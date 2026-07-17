use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::process::ChildStdin;
use std::sync::atomic::AtomicU64;
use std::sync::mpsc::{channel, Receiver, RecvTimeoutError, TryRecvError};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, State};

use crate::chat_harness::{
    emit_event, terminate_chat_process, validate_image_inputs, validate_run_budget,
    validate_run_id, validate_runtime_overrides, validate_thread_id, ChatRunControl,
    ChatRunEnvelope, ChatRunRequest, ChatRunStarted, ChatRunState, CHAT_RUN_EVENT,
};
use crate::opencode_adapter::OpenCodeStreamAdapter;
use crate::opencode_process::{spawn_opencode_process, OpenCodeProcess};

struct RunOutcome {
    exit_code: i32,
    stopped: bool,
    timed_out: bool,
}

fn validate_request(request: &ChatRunRequest) -> Result<(), String> {
    if !std::path::Path::new(request.project_path.trim()).is_dir() {
        return Err(format!(
            "Chat workspace does not exist: {}",
            request.project_path
        ));
    }
    if request.prompt.trim().is_empty() {
        return Err("Chat prompt is empty.".into());
    }
    if let Some(session_id) = request.provider_thread_id.as_deref() {
        validate_thread_id(session_id)?;
    }
    validate_runtime_overrides(request)?;
    validate_run_budget(request.budget_seconds)?;
    validate_image_inputs(request)
}

fn register_run(
    state: &State<ChatRunState>,
    base: ChatRunEnvelope,
    stdin: ChildStdin,
) -> Result<(Arc<ChatRunControl>, Receiver<()>), String> {
    let (stop, stop_rx) = channel();
    let control = Arc::new(ChatRunControl {
        base,
        stdin: Arc::new(Mutex::new(stdin)),
        stop,
        thread_id: Arc::new(Mutex::new(None)),
        turn_id: Arc::new(Mutex::new(None)),
        pending_approvals: Arc::new(Mutex::new(BTreeMap::new())),
        next_request_id: AtomicU64::new(100),
    });
    state
        .runs
        .lock()
        .map_err(|_| "Could not register the chat run.".to_string())?
        .insert(control.base.run_id.clone(), control.clone());
    Ok((control, stop_rx))
}

fn handle_events(
    app: &AppHandle,
    base: &ChatRunEnvelope,
    control: &ChatRunControl,
    adapter: &mut OpenCodeStreamAdapter,
    line: &str,
) -> bool {
    let mut finished = false;
    for event in adapter.ingest_line(line) {
        if event.get("type").and_then(Value::as_str) == Some("thread.started") {
            let session = event
                .get("thread_id")
                .and_then(Value::as_str)
                .map(str::to_string);
            if let Ok(mut thread_id) = control.thread_id.lock() {
                *thread_id = session;
            }
        }
        finished |= event.get("type").and_then(Value::as_str) == Some("turn.completed");
        emit_event(app, base, "stdout", event);
    }
    finished
}

fn interruption_outcome(
    request: &ChatRunRequest,
    process: &mut OpenCodeProcess,
    stop_rx: &Receiver<()>,
    started_at: Instant,
) -> Option<RunOutcome> {
    let (exit_code, stopped, timed_out) =
        if matches!(stop_rx.try_recv(), Ok(()) | Err(TryRecvError::Disconnected)) {
            (130, true, false)
        } else if request
            .budget_seconds
            .is_some_and(|limit| started_at.elapsed() >= Duration::from_secs(limit))
        {
            (124, false, true)
        } else {
            return None;
        };
    let process_group_id = process.child.id();
    terminate_chat_process(&mut process.child, process_group_id);
    Some(RunOutcome {
        exit_code,
        stopped,
        timed_out,
    })
}

fn run_loop(
    app: &AppHandle,
    base: &ChatRunEnvelope,
    request: &ChatRunRequest,
    control: &ChatRunControl,
    process: &mut OpenCodeProcess,
    stop_rx: Receiver<()>,
) -> RunOutcome {
    let mut adapter = OpenCodeStreamAdapter::default();
    let started_at = Instant::now();
    loop {
        if let Some(outcome) = interruption_outcome(request, process, &stop_rx, started_at) {
            return outcome;
        }
        match process.stdout.recv_timeout(Duration::from_millis(50)) {
            Ok(line) if handle_events(app, base, control, &mut adapter, &line) => {
                return RunOutcome {
                    exit_code: 0,
                    stopped: false,
                    timed_out: false,
                }
            }
            Ok(_) | Err(RecvTimeoutError::Timeout) => {
                if let Ok(Some(status)) = process.child.try_wait() {
                    return RunOutcome {
                        exit_code: status.code().unwrap_or(1),
                        stopped: false,
                        timed_out: false,
                    };
                }
            }
            Err(RecvTimeoutError::Disconnected) => {
                return RunOutcome {
                    exit_code: process
                        .child
                        .wait()
                        .ok()
                        .and_then(|status| status.code())
                        .unwrap_or(1),
                    stopped: false,
                    timed_out: false,
                }
            }
        }
    }
}

fn finish_run(
    app: &AppHandle,
    runs: &Arc<Mutex<BTreeMap<String, Arc<ChatRunControl>>>>,
    base: ChatRunEnvelope,
    request: ChatRunRequest,
    mut process: OpenCodeProcess,
    outcome: RunOutcome,
) {
    if process.child.try_wait().ok().flatten().is_none() {
        let process_group_id = process.child.id();
        terminate_chat_process(&mut process.child, process_group_id);
    }
    let _ = process.child.wait();
    let _ = process.stdout_thread.join();
    let _ = process.stderr_thread.join();
    if let Ok(mut active) = runs.lock() {
        active.remove(&base.run_id);
    }
    let message = if outcome.timed_out {
        format!(
            "OpenCode run reached its {} second budget.",
            request.budget_seconds.unwrap_or_default()
        )
    } else if outcome.stopped {
        "OpenCode run stopped.".into()
    } else {
        "OpenCode structured turn exited.".into()
    };
    let _ = app.emit(CHAT_RUN_EVENT, ChatRunEnvelope {
        stream: "lifecycle".into(), event: Some(json!({ "type": "run.completed", "exitCode": outcome.exit_code, "message": message })), ..base
    });
}

pub(crate) fn start_opencode_chat_run(
    app: AppHandle,
    state: State<ChatRunState>,
    request: ChatRunRequest,
) -> Result<ChatRunStarted, String> {
    validate_request(&request)?;
    let run_id = validate_run_id(request.run_id.trim())?.to_string();
    let base = ChatRunEnvelope {
        run_id: run_id.clone(),
        chat_id: request.chat_id.clone(),
        provider: request.provider.clone(),
        stream: "lifecycle".into(),
        event: None,
        line: None,
    };
    let mut process = spawn_opencode_process(&app, &base, &request)?;
    let stdin = process
        .stdin
        .take()
        .ok_or_else(|| "Could not register OpenCode input.".to_string())?;
    let (control, stop_rx) = register_run(&state, base.clone(), stdin)?;
    let runs = state.runs.clone();
    std::thread::spawn(move || {
        let outcome = run_loop(&app, &base, &request, &control, &mut process, stop_rx);
        finish_run(&app, &runs, base, request, process, outcome);
    });
    Ok(ChatRunStarted { run_id })
}
