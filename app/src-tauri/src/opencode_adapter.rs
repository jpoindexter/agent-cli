use serde_json::{json, Value};

pub(crate) fn command_args(
    session_id: Option<&str>,
    model: Option<&str>,
    variant: Option<&str>,
    prompt: &str,
    images: &[String],
    full_access: bool,
) -> Vec<String> {
    let mut args = vec!["run".into(), "--format".into(), "json".into()];
    if let Some(session_id) = session_id {
        args.extend(["--session".into(), session_id.into()]);
    }
    if let Some(model) = model.map(str::trim).filter(|value| !value.is_empty()) {
        args.extend(["--model".into(), model.into()]);
    }
    if let Some(variant) = variant.map(str::trim).filter(|value| !value.is_empty()) {
        args.extend(["--variant".into(), variant.into()]);
    }
    for image in images {
        args.extend(["--file".into(), image.clone()]);
    }
    if full_access {
        args.push("--dangerously-skip-permissions".into());
    }
    args.push(prompt.into());
    args
}

#[derive(Default)]
pub(crate) struct OpenCodeStreamAdapter {
    emitted_session: bool,
    input_tokens: u64,
    cached_input_tokens: u64,
    output_tokens: u64,
}

fn session_event(value: &Value) -> Option<Value> {
    value
        .get("sessionID")
        .and_then(Value::as_str)
        .map(|id| json!({ "type": "thread.started", "thread_id": id }))
}

fn text_event(value: &Value) -> Option<Value> {
    let part = value.get("part")?;
    let id = part.get("id")?.as_str()?;
    let text = part.get("text")?.as_str()?.trim();
    (!text.is_empty()).then(|| {
        json!({
            "type": "item.completed",
            "item": { "id": id, "type": "agent_message", "text": text }
        })
    })
}

fn tool_event(value: &Value) -> Option<Value> {
    let part = value.get("part")?;
    let state = part.get("state")?;
    let id = part.get("id")?.as_str()?;
    let tool = part.get("tool")?.as_str()?;
    Some(json!({
        "type": "item.completed",
        "item": {
            "id": id, "type": "mcp_tool_call", "tool": tool,
            "input": state.get("input").cloned().unwrap_or(Value::Null),
            "aggregated_output": state.get("output").and_then(Value::as_str).unwrap_or(""),
            "status": state.get("status").and_then(Value::as_str).unwrap_or("completed")
        }
    }))
}

fn step_usage(value: &Value) -> (u64, u64, u64) {
    let tokens = value.pointer("/part/tokens").unwrap_or(&Value::Null);
    (
        tokens.get("input").and_then(Value::as_u64).unwrap_or(0),
        tokens
            .pointer("/cache/read")
            .and_then(Value::as_u64)
            .unwrap_or(0),
        tokens.get("output").and_then(Value::as_u64).unwrap_or(0),
    )
}

fn usage_event(input: u64, cached: u64, output: u64) -> Value {
    json!({
        "type": "turn.completed",
        "usage": {
            "input_tokens": input, "cached_input_tokens": cached, "output_tokens": output
        }
    })
}

impl OpenCodeStreamAdapter {
    pub(crate) fn ingest_line(&mut self, line: &str) -> Vec<Value> {
        let Ok(value) = serde_json::from_str::<Value>(line) else {
            return vec![];
        };
        let mut events = vec![];
        if !self.emitted_session {
            if let Some(event) = session_event(&value) {
                self.emitted_session = true;
                events.push(event);
            }
        }
        match value.get("type").and_then(Value::as_str) {
            Some("text") => events.extend(text_event(&value)),
            Some("tool_use") => events.extend(tool_event(&value)),
            Some("step_finish") => {
                let (input, cached, output) = step_usage(&value);
                self.input_tokens += input;
                self.cached_input_tokens += cached;
                self.output_tokens += output;
                if value.pointer("/part/reason").and_then(Value::as_str) != Some("tool-calls") {
                    events.push(usage_event(
                        self.input_tokens,
                        self.cached_input_tokens,
                        self.output_tokens,
                    ));
                }
            }
            _ => {}
        }
        events
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_provider_model_resume_and_attachment_arguments() {
        assert_eq!(
            command_args(
                Some("ses_123"),
                Some("google/gemini-3.5-flash"),
                Some("high"),
                "Inspect this",
                &["/tmp/example.png".into()],
                true,
            ),
            vec![
                "run",
                "--format",
                "json",
                "--session",
                "ses_123",
                "--model",
                "google/gemini-3.5-flash",
                "--variant",
                "high",
                "--file",
                "/tmp/example.png",
                "--dangerously-skip-permissions",
                "Inspect this",
            ]
        );
    }

    #[test]
    fn translates_session_text_and_usage_into_neutral_events() {
        let mut adapter = OpenCodeStreamAdapter::default();
        let started =
            adapter.ingest_line(r#"{"type":"step_start","sessionID":"ses_123","part":{}}"#);
        assert_eq!(
            started,
            vec![json!({ "type": "thread.started", "thread_id": "ses_123" })]
        );
        let text = adapter.ingest_line(
            r#"{"type":"text","sessionID":"ses_123","part":{"id":"prt_1","text":"Hello"}}"#,
        );
        assert_eq!(
            text,
            vec![json!({
                "type": "item.completed",
                "item": { "id": "prt_1", "type": "agent_message", "text": "Hello" }
            })]
        );
        let finished = adapter.ingest_line(r#"{"type":"step_finish","sessionID":"ses_123","part":{"tokens":{"input":12,"output":3,"cache":{"read":4}}}}"#);
        assert_eq!(
            finished,
            vec![json!({
                "type": "turn.completed",
                "usage": { "input_tokens": 12, "cached_input_tokens": 4, "output_tokens": 3 }
            })]
        );
    }

    #[test]
    fn keeps_tool_steps_open_and_translates_tool_cards() {
        let mut adapter = OpenCodeStreamAdapter::default();
        let tool = adapter.ingest_line(r#"{"type":"tool_use","sessionID":"ses_1","part":{"id":"prt_tool","tool":"bash","state":{"status":"completed","input":{"command":"pwd"},"output":"/repo\n"}}}"#);
        assert_eq!(
            tool[1],
            json!({
                "type": "item.completed",
                "item": { "id": "prt_tool", "type": "mcp_tool_call", "tool": "bash", "input": { "command": "pwd" }, "aggregated_output": "/repo\n", "status": "completed" }
            })
        );
        let intermediate = adapter.ingest_line(r#"{"type":"step_finish","sessionID":"ses_1","part":{"reason":"tool-calls","tokens":{"input":10,"output":2,"cache":{"read":3}}}}"#);
        assert!(intermediate.is_empty());
        let final_step = adapter.ingest_line(r#"{"type":"step_finish","sessionID":"ses_1","part":{"reason":"stop","tokens":{"input":4,"output":1,"cache":{"read":8}}}}"#);
        assert_eq!(
            final_step,
            vec![json!({
                "type": "turn.completed",
                "usage": { "input_tokens": 14, "cached_input_tokens": 11, "output_tokens": 3 }
            })]
        );
    }

    #[test]
    fn ignores_malformed_and_non_display_events() {
        let mut adapter = OpenCodeStreamAdapter::default();
        assert!(adapter.ingest_line("not-json").is_empty());
        assert!(
            adapter
                .ingest_line(r#"{"type":"step_start","sessionID":"ses_123","part":{}}"#)
                .len()
                == 1
        );
        assert!(adapter
            .ingest_line(r#"{"type":"step_start","sessionID":"ses_123","part":{}}"#)
            .is_empty());
    }
}
