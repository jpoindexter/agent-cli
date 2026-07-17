use std::io::{BufRead, BufReader};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::mpsc::{channel, Receiver};
use std::thread::JoinHandle;
use tauri::AppHandle;

use crate::chat_harness::{emit_raw_line, isolate_chat_process, ChatRunEnvelope, ChatRunRequest};
use crate::connection_secrets::resolve_connection_environment;
use crate::opencode_adapter::command_args;

pub(crate) struct OpenCodeProcess {
    pub(crate) child: Child,
    pub(crate) stdin: Option<ChildStdin>,
    pub(crate) stdout: Receiver<String>,
    pub(crate) stdout_thread: JoinHandle<()>,
    pub(crate) stderr_thread: JoinHandle<()>,
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}

fn login_shell_command(args: &[String]) -> Command {
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into());
    let line = args
        .iter()
        .fold("exec opencode".to_string(), |mut line, arg| {
            line.push(' ');
            line.push_str(&shell_quote(arg));
            line
        });
    let mut command = Command::new(shell);
    command.arg("-l").arg("-c").arg(line);
    command
}

fn forward_lines<R: std::io::Read + Send + 'static>(
    reader: R,
) -> (Receiver<String>, JoinHandle<()>) {
    let (sender, receiver) = channel();
    let thread = std::thread::spawn(move || {
        for line in BufReader::new(reader).lines().map_while(Result::ok) {
            if sender.send(line).is_err() {
                break;
            }
        }
    });
    (receiver, thread)
}

pub(crate) fn spawn_opencode_process(
    app: &AppHandle,
    base: &ChatRunEnvelope,
    request: &ChatRunRequest,
) -> Result<OpenCodeProcess, String> {
    let args = command_args(
        request.provider_thread_id.as_deref(),
        request.model.as_deref(),
        request.reasoning_effort.as_deref(),
        &request.prompt,
        &request.images,
        request.approval_mode == "fullAccess",
    );
    let mut command = login_shell_command(&args);
    command
        .current_dir(&request.project_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    for (name, value) in resolve_connection_environment(&request.environment, None)? {
        command.env(name, value);
    }
    isolate_chat_process(&mut command);
    let mut child = command
        .spawn()
        .map_err(|error| format!("Could not launch OpenCode structured chat: {error}"))?;
    let stdin = child
        .stdin
        .take()
        .ok_or_else(|| "Could not open OpenCode input.".to_string())?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Could not read OpenCode output.".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Could not read OpenCode diagnostics.".to_string())?;
    let (stdout, stdout_thread) = forward_lines(stdout);
    let stderr_app = app.clone();
    let stderr_base = base.clone();
    let stderr_thread = std::thread::spawn(move || {
        for line in BufReader::new(stderr).lines().map_while(Result::ok) {
            emit_raw_line(&stderr_app, &stderr_base, "stderr", line);
        }
    });
    Ok(OpenCodeProcess {
        child,
        stdin: Some(stdin),
        stdout,
        stdout_thread,
        stderr_thread,
    })
}
