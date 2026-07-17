use serde::Serialize;
use std::process::{Command, Stdio};

const MAX_MODELS: usize = 2000;
const MAX_MODEL_ADDRESS: usize = 256;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct OpenCodeModelsResponse {
    models: Vec<String>,
}

fn valid_model_address(value: &str) -> bool {
    if value.is_empty() || value.len() > MAX_MODEL_ADDRESS || value.chars().any(char::is_whitespace)
    {
        return false;
    }
    value
        .split_once('/')
        .map(|(provider, model)| !provider.is_empty() && !model.is_empty())
        .unwrap_or(false)
}

fn parse_models(output: &str) -> Vec<String> {
    let mut models = output
        .lines()
        .map(str::trim)
        .filter(|line| valid_model_address(line))
        .map(str::to_string)
        .collect::<Vec<_>>();
    models.sort();
    models.dedup();
    models.truncate(MAX_MODELS);
    models
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}

fn run_models_command(refresh: bool) -> Result<std::process::Output, String> {
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into());
    let mut line = format!("exec {} models", shell_quote("opencode"));
    if refresh {
        line.push_str(" --refresh");
    }
    Command::new(shell)
        .arg("-l")
        .arg("-c")
        .arg(line)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()
        .map_err(|error| format!("Could not launch OpenCode model discovery: {error}"))
}

#[tauri::command]
pub(crate) fn opencode_models(refresh: Option<bool>) -> Result<OpenCodeModelsResponse, String> {
    let output = run_models_command(refresh.unwrap_or(false))?;
    if !output.status.success() {
        return Err("OpenCode could not load its model catalog.".into());
    }
    Ok(OpenCodeModelsResponse {
        models: parse_models(&String::from_utf8_lossy(&output.stdout)),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_unique_bounded_provider_model_addresses() {
        let output = "openai/gpt-5.4\nbad model\ngoogle/gemini-3.5-flash\nopenai/gpt-5.4\n";
        assert_eq!(
            parse_models(output),
            vec!["google/gemini-3.5-flash", "openai/gpt-5.4"]
        );
    }

    #[test]
    fn accepts_nested_model_ids_but_rejects_incomplete_addresses() {
        assert!(valid_model_address("openrouter/anthropic/claude-sonnet-4"));
        assert!(!valid_model_address("openai/"));
        assert!(!valid_model_address("/gpt-5.4"));
    }
}
