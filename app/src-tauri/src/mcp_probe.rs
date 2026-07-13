use crate::connection_secrets::{
    read_connection_secret, resolve_connection_environment, ConnectionEnvironmentInput,
};
use crate::mcp_oauth::oauth_authorization_header;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Read, Write};
use std::path::Path;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::mpsc::{channel, Receiver, RecvTimeoutError};
use std::time::{Duration, Instant};

const MCP_PROTOCOL_VERSION: &str = "2025-06-18";
const MCP_TIMEOUT: Duration = Duration::from_secs(6);
const MCP_BODY_LIMIT: u64 = 1024 * 1024;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct McpProbeRequest {
    id: String,
    transport: String,
    target: String,
    #[serde(default)]
    args: Vec<String>,
    auth_mode: String,
    #[serde(default)]
    environment: Vec<ConnectionEnvironmentInput>,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct McpProbeStatus {
    ok: bool,
    message: String,
    protocol_version: Option<String>,
    tool_count: usize,
    tools: Vec<String>,
}

struct HttpRpcResponse {
    body: String,
    content_type: String,
    session_id: Option<String>,
}

fn rpc_request(id: u64, method: &str, params: Value) -> Value {
    json!({ "jsonrpc": "2.0", "id": id, "method": method, "params": params })
}

fn initialize_request() -> Value {
    rpc_request(
        1,
        "initialize",
        json!({
            "protocolVersion": MCP_PROTOCOL_VERSION,
            "capabilities": {},
            "clientInfo": {
                "name": "keelhouse",
                "title": "Keelhouse",
                "version": env!("CARGO_PKG_VERSION")
            }
        }),
    )
}

fn initialized_notification() -> Value {
    json!({ "jsonrpc": "2.0", "method": "notifications/initialized", "params": {} })
}

fn tools_request() -> Value {
    rpc_request(2, "tools/list", json!({}))
}

fn rpc_result(message: Value, id: u64) -> Result<Value, String> {
    if message.get("id").and_then(Value::as_u64) != Some(id) {
        return Err("MCP response id did not match the request.".into());
    }
    if let Some(error) = message.get("error") {
        return Err(error
            .get("message")
            .and_then(Value::as_str)
            .unwrap_or("MCP returned an unknown JSON-RPC error.")
            .to_string());
    }
    message
        .get("result")
        .cloned()
        .ok_or_else(|| "MCP response did not include a result.".into())
}

fn parse_rpc_body(body: &str, content_type: &str, id: u64) -> Result<Value, String> {
    let message = if content_type
        .to_ascii_lowercase()
        .contains("text/event-stream")
    {
        body.lines()
            .filter_map(|line| line.strip_prefix("data:"))
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .find_map(|line| {
                serde_json::from_str::<Value>(line)
                    .ok()
                    .filter(|value| value.get("id").and_then(Value::as_u64) == Some(id))
            })
            .ok_or_else(|| "MCP event stream did not contain the requested response.".to_string())?
    } else {
        let value: Value = serde_json::from_str(body)
            .map_err(|error| format!("MCP returned invalid JSON: {error}"))?;
        if let Some(batch) = value.as_array() {
            batch
                .iter()
                .find(|item| item.get("id").and_then(Value::as_u64) == Some(id))
                .cloned()
                .ok_or_else(|| {
                    "MCP response batch did not contain the requested response.".to_string()
                })?
        } else {
            value
        }
    };
    rpc_result(message, id)
}

fn tool_names(result: &Value) -> Vec<String> {
    result
        .get("tools")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|tool| tool.get("name").and_then(Value::as_str))
        .filter(|name| !name.is_empty())
        .take(200)
        .map(str::to_string)
        .collect()
}

fn probe_status(protocol_version: Option<String>, tools: Vec<String>) -> McpProbeStatus {
    McpProbeStatus {
        ok: true,
        message: format!("Connected; discovered {} tools.", tools.len()),
        protocol_version,
        tool_count: tools.len(),
        tools,
    }
}

fn resolve_executable(target: &str) -> Result<String, String> {
    let target = target.trim();
    if target.is_empty() || target.chars().any(char::is_whitespace) {
        return Err("Enter one MCP executable; put arguments in the Arguments field.".into());
    }
    if Path::new(target).components().count() > 1 {
        return Path::new(target)
            .is_file()
            .then(|| target.to_string())
            .ok_or_else(|| format!("MCP executable does not exist: {target}"));
    }
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into());
    let escaped = target.replace('\'', "'\\''");
    let output = Command::new(shell)
        .args(["-l", "-c", &format!("command -v -- '{escaped}'")])
        .stdin(Stdio::null())
        .stderr(Stdio::null())
        .output()
        .map_err(|error| format!("Could not inspect the login-shell PATH: {error}"))?;
    let resolved = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if output.status.success() && !resolved.is_empty() {
        Ok(resolved)
    } else {
        Err(format!("Cannot find {target} in the login-shell PATH."))
    }
}

fn write_stdio(stdin: &mut ChildStdin, message: &Value) -> Result<(), String> {
    serde_json::to_writer(&mut *stdin, message)
        .map_err(|error| format!("Could not encode MCP request: {error}"))?;
    stdin
        .write_all(b"\n")
        .and_then(|_| stdin.flush())
        .map_err(|error| format!("Could not write to MCP server: {error}"))
}

fn read_stdio_result(
    receiver: &Receiver<Result<String, String>>,
    id: u64,
) -> Result<Value, String> {
    let deadline = Instant::now() + MCP_TIMEOUT;
    loop {
        let remaining = deadline.saturating_duration_since(Instant::now());
        if remaining.is_zero() {
            return Err("MCP request timed out after 6 seconds.".into());
        }
        let line = match receiver.recv_timeout(remaining) {
            Ok(line) => line?,
            Err(RecvTimeoutError::Timeout) => {
                return Err("MCP request timed out after 6 seconds.".into())
            }
            Err(RecvTimeoutError::Disconnected) => {
                return Err("MCP server closed stdout before responding.".into())
            }
        };
        if line.trim().is_empty() {
            continue;
        }
        let message: Value = serde_json::from_str(&line)
            .map_err(|error| format!("MCP server wrote invalid JSON to stdout: {error}"))?;
        if message.get("id").and_then(Value::as_u64) == Some(id) {
            return rpc_result(message, id);
        }
    }
}

fn stop_child(child: &mut Child) {
    let _ = child.kill();
    let _ = child.wait();
}

fn probe_stdio(request: &McpProbeRequest) -> Result<McpProbeStatus, String> {
    let executable = resolve_executable(&request.target)?;
    if request.args.len() > 40
        || request
            .args
            .iter()
            .any(|arg| arg.len() > 500 || arg.chars().any(char::is_control))
    {
        return Err("MCP arguments exceed the configured limits.".into());
    }
    let environment = resolve_connection_environment(&request.environment, None)?;
    let mut command = Command::new(executable);
    command
        .args(&request.args)
        .envs(environment)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    let mut child = command
        .spawn()
        .map_err(|error| format!("Could not start MCP server: {error}"))?;
    let mut stdin = match child.stdin.take() {
        Some(stdin) => stdin,
        None => {
            stop_child(&mut child);
            return Err("Could not open MCP stdin.".into());
        }
    };
    let stdout = match child.stdout.take() {
        Some(stdout) => stdout,
        None => {
            stop_child(&mut child);
            return Err("Could not open MCP stdout.".into());
        }
    };
    let (sender, receiver) = channel();
    std::thread::spawn(move || {
        for line in BufReader::new(stdout).lines() {
            if sender
                .send(line.map_err(|error| format!("Could not read MCP stdout: {error}")))
                .is_err()
            {
                break;
            }
        }
    });

    let result = (|| {
        write_stdio(&mut stdin, &initialize_request())?;
        let initialized = read_stdio_result(&receiver, 1)?;
        let protocol_version = initialized
            .get("protocolVersion")
            .and_then(Value::as_str)
            .map(str::to_string);
        write_stdio(&mut stdin, &initialized_notification())?;
        write_stdio(&mut stdin, &tools_request())?;
        let tools = tool_names(&read_stdio_result(&receiver, 2)?);
        Ok(probe_status(protocol_version, tools))
    })();
    drop(stdin);
    stop_child(&mut child);
    result
}

fn bearer_header(request: &McpProbeRequest) -> Result<Option<String>, String> {
    match request.auth_mode.as_str() {
        "none" => Ok(None),
        "bearer" => read_connection_secret(&format!("mcp:{}:bearer", request.id))?
            .map(|token| format!("Bearer {token}"))
            .ok_or_else(|| "MCP bearer token is missing from macOS Keychain.".into())
            .map(Some),
        "oauth" => oauth_authorization_header(&request.id).map(Some),
        _ => Err("MCP authentication mode is invalid.".into()),
    }
}

fn read_http_body(response: reqwest::blocking::Response) -> Result<String, String> {
    let mut body = String::new();
    response
        .take(MCP_BODY_LIMIT + 1)
        .read_to_string(&mut body)
        .map_err(|error| format!("Could not read MCP HTTP response: {error}"))?;
    if body.len() as u64 > MCP_BODY_LIMIT {
        return Err("MCP HTTP response exceeded 1 MiB.".into());
    }
    Ok(body)
}

fn post_http(
    client: &reqwest::blocking::Client,
    url: &str,
    message: &Value,
    bearer: Option<&str>,
    session_id: Option<&str>,
    protocol_version: Option<&str>,
) -> Result<HttpRpcResponse, String> {
    let mut request = client
        .post(url)
        .header("Accept", "application/json, text/event-stream")
        .header("Content-Type", "application/json")
        .json(message);
    if let Some(value) = bearer {
        request = request.header("Authorization", value);
    }
    if let Some(value) = session_id {
        request = request.header("Mcp-Session-Id", value);
    }
    if let Some(value) = protocol_version {
        request = request.header("MCP-Protocol-Version", value);
    }
    let response = request
        .send()
        .map_err(|error| format!("MCP HTTP request failed: {error}"))?;
    let status = response.status();
    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default()
        .to_string();
    let session_id = response
        .headers()
        .get("mcp-session-id")
        .and_then(|value| value.to_str().ok())
        .map(str::to_string);
    let body = read_http_body(response)?;
    if !status.is_success() {
        let detail: String = body.trim().chars().take(500).collect();
        return Err(format!("MCP HTTP {status}: {detail}"));
    }
    Ok(HttpRpcResponse {
        body,
        content_type,
        session_id,
    })
}

fn probe_http(request: &McpProbeRequest) -> Result<McpProbeStatus, String> {
    let url = reqwest::Url::parse(request.target.trim())
        .map_err(|_| "Enter a valid MCP HTTP endpoint.".to_string())?;
    if !matches!(url.scheme(), "http" | "https") || url.host_str().is_none() {
        return Err("Enter an http:// or https:// MCP endpoint with a host.".into());
    }
    if !url.username().is_empty() || url.password().is_some() {
        return Err("MCP endpoint credentials must use Keychain bearer or OAuth settings.".into());
    }
    let bearer = bearer_header(request)?;
    let client = reqwest::blocking::Client::builder()
        .timeout(MCP_TIMEOUT)
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|error| format!("Could not create MCP HTTP client: {error}"))?;
    let initialized = post_http(
        &client,
        url.as_str(),
        &initialize_request(),
        bearer.as_deref(),
        None,
        None,
    )?;
    let initialized_result = parse_rpc_body(&initialized.body, &initialized.content_type, 1)?;
    let protocol_version = initialized_result
        .get("protocolVersion")
        .and_then(Value::as_str)
        .unwrap_or(MCP_PROTOCOL_VERSION)
        .to_string();
    let result = (|| {
        let notification = post_http(
            &client,
            url.as_str(),
            &initialized_notification(),
            bearer.as_deref(),
            initialized.session_id.as_deref(),
            Some(&protocol_version),
        )?;
        if !notification.body.trim().is_empty() && notification.body.trim() != "{}" {
            return Err("MCP initialized notification returned an unexpected body.".into());
        }
        let listed = post_http(
            &client,
            url.as_str(),
            &tools_request(),
            bearer.as_deref(),
            initialized.session_id.as_deref(),
            Some(&protocol_version),
        )?;
        let tools = tool_names(&parse_rpc_body(&listed.body, &listed.content_type, 2)?);
        Ok(probe_status(Some(protocol_version.clone()), tools))
    })();
    if let Some(session_id) = initialized.session_id.as_deref() {
        let mut cleanup = client
            .delete(url.as_str())
            .header("Mcp-Session-Id", session_id)
            .header("MCP-Protocol-Version", &protocol_version);
        if let Some(value) = bearer.as_deref() {
            cleanup = cleanup.header("Authorization", value);
        }
        let _ = cleanup.send();
    }
    result
}

fn probe_mcp_server_blocking(request: McpProbeRequest) -> Result<McpProbeStatus, String> {
    if request.id.is_empty()
        || request.id.len() > 80
        || !request
            .id
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '_' | '-'))
    {
        return Err("MCP server id is invalid.".into());
    }
    match request.transport.as_str() {
        "stdio" => probe_stdio(&request),
        "http" => probe_http(&request),
        _ => Err("MCP transport must be stdio or http.".into()),
    }
}

#[tauri::command]
pub(crate) async fn probe_mcp_server(request: McpProbeRequest) -> Result<McpProbeStatus, String> {
    tauri::async_runtime::spawn_blocking(move || probe_mcp_server_blocking(request))
        .await
        .map_err(|error| format!("MCP health task failed: {error}"))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{TcpListener, TcpStream};
    use std::thread;

    fn request(transport: &str, target: &str) -> McpProbeRequest {
        McpProbeRequest {
            id: "qa-server".into(),
            transport: transport.into(),
            target: target.into(),
            args: Vec::new(),
            auth_mode: "none".into(),
            environment: Vec::new(),
        }
    }

    #[test]
    fn parses_json_and_sse_tool_lists() {
        let json_body = r#"{"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"search"}]}}"#;
        assert_eq!(
            tool_names(&parse_rpc_body(json_body, "application/json", 2).unwrap()),
            ["search"]
        );
        let sse_body = "event: message\ndata: {\"jsonrpc\":\"2.0\",\"id\":2,\"result\":{\"tools\":[{\"name\":\"open\"}]}}\n\n";
        assert_eq!(
            tool_names(&parse_rpc_body(sse_body, "text/event-stream", 2).unwrap()),
            ["open"]
        );
    }

    #[test]
    fn probes_a_real_stdio_server_and_stops_it() {
        let script = concat!(
            "while IFS= read -r line; do case \"$line\" in ",
            "*'\"method\":\"initialize\"'*) printf '%s\\n' '{\"jsonrpc\":\"2.0\",\"id\":1,\"result\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"serverInfo\":{\"name\":\"qa\",\"version\":\"1\"}}}' ;; ",
            "*'\"method\":\"tools/list\"'*) printf '%s\\n' '{\"jsonrpc\":\"2.0\",\"id\":2,\"result\":{\"tools\":[{\"name\":\"search\"},{\"name\":\"open\"}]}}' ;; ",
            "esac; done"
        );
        let mut request = request("stdio", "/bin/sh");
        request.args = vec!["-c".into(), script.into()];
        let result = probe_mcp_server_blocking(request).expect("stdio probe");
        assert_eq!(result.tool_count, 2);
        assert_eq!(
            result.protocol_version.as_deref(),
            Some(MCP_PROTOCOL_VERSION)
        );
    }

    #[test]
    fn oauth_probe_requires_authorization_without_reading_tokens() {
        let mut request = request("http", "https://mcp.example.test");
        request.auth_mode = "oauth".into();
        assert!(probe_mcp_server_blocking(request)
            .expect_err("oauth required")
            .contains("authorization is required"));
    }

    #[test]
    fn http_probe_rejects_credentials_embedded_in_the_url() {
        assert!(probe_mcp_server_blocking(request(
            "http",
            "https://user:password@mcp.example.test"
        ))
        .expect_err("embedded credentials")
        .contains("must use Keychain"));
    }

    fn read_http_request(stream: &mut TcpStream) -> String {
        stream
            .set_read_timeout(Some(Duration::from_secs(2)))
            .expect("read timeout");
        let mut request = Vec::new();
        let mut chunk = [0_u8; 2048];
        loop {
            let count = stream.read(&mut chunk).expect("read request");
            if count == 0 {
                break;
            }
            request.extend_from_slice(&chunk[..count]);
            let Some(header_end) = request.windows(4).position(|window| window == b"\r\n\r\n")
            else {
                continue;
            };
            let headers = String::from_utf8_lossy(&request[..header_end]);
            let content_length = headers
                .lines()
                .find_map(|line| {
                    line.to_ascii_lowercase()
                        .strip_prefix("content-length:")
                        .and_then(|value| value.trim().parse::<usize>().ok())
                })
                .unwrap_or(0);
            if request.len() >= header_end + 4 + content_length {
                break;
            }
        }
        String::from_utf8(request).expect("utf8 request")
    }

    fn write_http_response(stream: &mut TcpStream, status: &str, body: &str, session_id: bool) {
        let session = if session_id {
            "Mcp-Session-Id: qa-session\r\n"
        } else {
            ""
        };
        write!(
            stream,
            "HTTP/1.1 {status}\r\nContent-Type: application/json\r\n{session}Content-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        )
        .expect("write response");
        stream.flush().expect("flush response");
    }

    #[test]
    fn probes_a_real_streamable_http_server_with_session_cleanup() {
        let listener = TcpListener::bind("127.0.0.1:0").expect("bind server");
        let address = listener.local_addr().expect("server address");
        let server = thread::spawn(move || {
            for _ in 0..4 {
                let (mut stream, _) = listener.accept().expect("accept request");
                let request = read_http_request(&mut stream);
                if request.starts_with("DELETE ") {
                    assert!(
                        request.contains("mcp-session-id: qa-session")
                            || request.contains("Mcp-Session-Id: qa-session")
                    );
                    write_http_response(&mut stream, "200 OK", "", false);
                } else if request.contains(r#""method":"initialize""#) {
                    write_http_response(
                        &mut stream,
                        "200 OK",
                        r#"{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{},"serverInfo":{"name":"qa","version":"1"}}}"#,
                        true,
                    );
                } else if request.contains(r#""method":"notifications/initialized""#) {
                    assert!(
                        request.contains("mcp-session-id: qa-session")
                            || request.contains("Mcp-Session-Id: qa-session")
                    );
                    write_http_response(&mut stream, "202 Accepted", "", false);
                } else if request.contains(r#""method":"tools/list""#) {
                    assert!(
                        request.contains("mcp-session-id: qa-session")
                            || request.contains("Mcp-Session-Id: qa-session")
                    );
                    write_http_response(
                        &mut stream,
                        "200 OK",
                        r#"{"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"inspect"}]}}"#,
                        false,
                    );
                } else {
                    panic!("unexpected MCP request: {request}");
                }
            }
        });

        let result = probe_mcp_server_blocking(request("http", &format!("http://{address}/mcp")))
            .expect("http probe");
        assert_eq!(result.tools, ["inspect"]);
        server.join().expect("server thread");
    }
}
