use crate::connection_secrets::{
    read_connection_secret, remove_connection_secret, write_connection_secret,
};
use base64::Engine;
use reqwest::blocking::{Client, Response};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, State};

const OAUTH_TIMEOUT: Duration = Duration::from_secs(10);
const CALLBACK_TIMEOUT: Duration = Duration::from_secs(300);
const RESPONSE_LIMIT: u64 = 1024 * 1024;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct McpOAuthRequest {
    id: String,
    target: String,
    #[serde(default)]
    oauth_issuer: String,
    #[serde(default)]
    oauth_client_id: String,
    #[serde(default)]
    oauth_scopes: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct McpOAuthStart {
    authorization_url: String,
    client_id: String,
    message: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct McpOAuthStatus {
    server_id: String,
    state: String,
    message: String,
}

#[derive(Clone, Debug, Deserialize)]
struct AuthorizationServerMetadata {
    issuer: String,
    authorization_endpoint: String,
    token_endpoint: String,
    #[serde(default)]
    registration_endpoint: Option<String>,
    #[serde(default)]
    revocation_endpoint: Option<String>,
    #[serde(default)]
    scopes_supported: Vec<String>,
    #[serde(default)]
    code_challenge_methods_supported: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct StoredOAuthTokens {
    access_token: String,
    #[serde(default)]
    refresh_token: Option<String>,
    token_type: String,
    #[serde(default)]
    expires_at: Option<u64>,
    token_endpoint: String,
    #[serde(default)]
    revocation_endpoint: Option<String>,
    client_id: String,
    resource: String,
}

struct PreparedAuthorization {
    client: Client,
    listener: TcpListener,
    server_id: String,
    redirect_uri: String,
    state: String,
    code_verifier: String,
    client_id: String,
    client_secret: Option<String>,
    resource: String,
    metadata: AuthorizationServerMetadata,
    authorization_url: String,
}

#[derive(Clone, Default)]
pub(crate) struct McpOAuthState {
    statuses: Arc<Mutex<HashMap<String, McpOAuthStatus>>>,
}

fn token_key(server_id: &str) -> String {
    format!("mcp:{server_id}:oauth-tokens")
}

fn client_secret_key(server_id: &str) -> String {
    format!("mcp:{server_id}:oauth-client-secret")
}

fn valid_server_id(server_id: &str) -> bool {
    !server_id.is_empty()
        && server_id.len() <= 80
        && server_id
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '_' | '-'))
}

fn set_status(
    statuses: &Arc<Mutex<HashMap<String, McpOAuthStatus>>>,
    server_id: &str,
    state: &str,
    message: impl Into<String>,
) -> McpOAuthStatus {
    let status = McpOAuthStatus {
        server_id: server_id.to_string(),
        state: state.to_string(),
        message: message.into(),
    };
    if let Ok(mut current) = statuses.lock() {
        current.insert(server_id.to_string(), status.clone());
    }
    status
}

fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0)
}

fn oauth_client() -> Result<Client, String> {
    Client::builder()
        .timeout(OAUTH_TIMEOUT)
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|error| format!("Could not create OAuth HTTP client: {error}"))
}

fn secure_url(value: &str, label: &str) -> Result<reqwest::Url, String> {
    let url =
        reqwest::Url::parse(value.trim()).map_err(|_| format!("{label} is not a valid URL."))?;
    if url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.fragment().is_some()
    {
        return Err(format!(
            "{label} must be an absolute URL without credentials or a fragment."
        ));
    }
    let local_http =
        url.scheme() == "http" && matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "::1"));
    if url.scheme() != "https" && !local_http {
        return Err(format!(
            "{label} must use HTTPS, except for localhost development."
        ));
    }
    Ok(url)
}

fn read_limited(response: Response, label: &str) -> Result<String, String> {
    let mut body = String::new();
    response
        .take(RESPONSE_LIMIT + 1)
        .read_to_string(&mut body)
        .map_err(|error| format!("Could not read {label}: {error}"))?;
    if body.len() as u64 > RESPONSE_LIMIT {
        return Err(format!("{label} exceeded 1 MiB."));
    }
    Ok(body)
}

fn response_json(response: Response, label: &str) -> Result<Value, String> {
    let status = response.status();
    let body = read_limited(response, label)?;
    if !status.is_success() {
        let detail: String = body.trim().chars().take(500).collect();
        return Err(format!("{label} returned HTTP {status}: {detail}"));
    }
    serde_json::from_str(&body).map_err(|error| format!("{label} returned invalid JSON: {error}"))
}

fn parse_resource_metadata_url(header: &str) -> Option<String> {
    let lower = header.to_ascii_lowercase();
    if !lower.trim_start().starts_with("bearer") {
        return None;
    }
    let start = lower.find("resource_metadata")?;
    let original = &header[start + "resource_metadata".len()..];
    let value = original.get(original.find('=')? + 1..)?.trim_start();
    let quote = value.chars().next()?;
    if !matches!(quote, '\'' | '"') {
        return None;
    }
    let value = &value[1..];
    Some(value[..value.find(quote)?].to_string())
}

fn discover_authorization_server(
    client: &Client,
    target: &str,
    issuer_override: &str,
) -> Result<(String, String), String> {
    let target = secure_url(target, "MCP endpoint")?;
    let response = client
        .post(target.clone())
        .header("Accept", "application/json, text/event-stream")
        .header("Content-Type", "application/json")
        .json(&json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-06-18",
                "capabilities": {},
                "clientInfo": { "name": "keelhouse", "version": env!("CARGO_PKG_VERSION") }
            }
        }))
        .send()
        .map_err(|error| format!("Could not inspect MCP authorization: {error}"))?;
    let metadata_url = response
        .headers()
        .get("www-authenticate")
        .and_then(|header| header.to_str().ok())
        .and_then(parse_resource_metadata_url);

    if let Some(metadata_url) = metadata_url {
        let metadata_url = secure_url(&metadata_url, "Protected resource metadata URL")?;
        let metadata = response_json(
            client
                .get(metadata_url)
                .header("Accept", "application/json")
                .send()
                .map_err(|error| format!("Could not fetch protected resource metadata: {error}"))?,
            "Protected resource metadata",
        )?;
        let resource = metadata
            .get("resource")
            .and_then(Value::as_str)
            .unwrap_or(target.as_str());
        let resource = secure_url(resource, "OAuth resource")?.to_string();
        let servers = metadata
            .get("authorization_servers")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
            .map(str::to_string)
            .collect::<Vec<_>>();
        if servers.is_empty() {
            return Err("Protected resource metadata did not list an authorization server.".into());
        }
        if !issuer_override.trim().is_empty() {
            let requested = secure_url(issuer_override, "Authorization server override")?;
            let allowed = servers.iter().any(|server| {
                secure_url(server, "Authorization server")
                    .map(|server| {
                        server.as_str().trim_end_matches('/')
                            == requested.as_str().trim_end_matches('/')
                    })
                    .unwrap_or(false)
            });
            if !allowed {
                return Err(
                    "The authorization server override is not advertised by the MCP resource."
                        .into(),
                );
            }
            return Ok((resource, requested.to_string()));
        }
        return Ok((
            resource,
            secure_url(&servers[0], "Authorization server")?.to_string(),
        ));
    }

    if issuer_override.trim().is_empty() {
        return Err("MCP server did not advertise protected resource metadata. Enter an authorization server override only for a known non-conforming server.".into());
    }
    Ok((
        target.to_string(),
        secure_url(issuer_override, "Authorization server override")?.to_string(),
    ))
}

fn authorization_metadata_url(issuer: &str) -> Result<reqwest::Url, String> {
    let issuer = secure_url(issuer, "Authorization server")?;
    let mut metadata = issuer.clone();
    let issuer_path = issuer.path().trim_end_matches('/');
    metadata.set_path(&format!(
        "/.well-known/oauth-authorization-server{issuer_path}"
    ));
    metadata.set_query(None);
    Ok(metadata)
}

fn fetch_authorization_metadata(
    client: &Client,
    issuer: &str,
) -> Result<AuthorizationServerMetadata, String> {
    let metadata_url = authorization_metadata_url(issuer)?;
    let value = response_json(
        client
            .get(metadata_url)
            .header("Accept", "application/json")
            .send()
            .map_err(|error| format!("Could not fetch authorization server metadata: {error}"))?,
        "Authorization server metadata",
    )?;
    let metadata: AuthorizationServerMetadata = serde_json::from_value(value)
        .map_err(|error| format!("Authorization server metadata is incomplete: {error}"))?;
    if metadata.issuer.trim_end_matches('/') != issuer.trim_end_matches('/') {
        return Err(
            "Authorization server metadata issuer did not match the discovered issuer.".into(),
        );
    }
    secure_url(&metadata.authorization_endpoint, "Authorization endpoint")?;
    secure_url(&metadata.token_endpoint, "Token endpoint")?;
    if let Some(endpoint) = metadata.registration_endpoint.as_deref() {
        secure_url(endpoint, "Client registration endpoint")?;
    }
    if let Some(endpoint) = metadata.revocation_endpoint.as_deref() {
        secure_url(endpoint, "Token revocation endpoint")?;
    }
    if !metadata.code_challenge_methods_supported.is_empty()
        && !metadata
            .code_challenge_methods_supported
            .iter()
            .any(|method| method == "S256")
    {
        return Err("Authorization server does not advertise PKCE S256 support.".into());
    }
    Ok(metadata)
}

fn register_client(
    client: &Client,
    endpoint: &str,
    redirect_uri: &str,
) -> Result<(String, Option<String>), String> {
    let value = response_json(
        client
            .post(endpoint)
            .json(&json!({
                "client_name": "Keelhouse",
                "redirect_uris": [redirect_uri],
                "grant_types": ["authorization_code", "refresh_token"],
                "response_types": ["code"],
                "token_endpoint_auth_method": "none"
            }))
            .send()
            .map_err(|error| format!("Dynamic client registration failed: {error}"))?,
        "Dynamic client registration",
    )?;
    let client_id = value
        .get("client_id")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty() && value.len() <= 1000)
        .ok_or_else(|| "Dynamic client registration did not return a client ID.".to_string())?;
    let client_secret = value
        .get("client_secret")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty() && value.len() <= 32_768)
        .map(str::to_string);
    Ok((client_id.to_string(), client_secret))
}

fn random_url_safe(bytes: usize) -> Result<String, String> {
    let mut value = vec![0_u8; bytes];
    getrandom::fill(&mut value)
        .map_err(|_| "Could not generate secure OAuth state.".to_string())?;
    Ok(base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(value))
}

fn pkce_challenge(verifier: &str) -> String {
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()))
}

fn build_authorization_url(
    metadata: &AuthorizationServerMetadata,
    client_id: &str,
    redirect_uri: &str,
    state: &str,
    challenge: &str,
    resource: &str,
    scopes: &[String],
) -> Result<String, String> {
    let mut url = secure_url(&metadata.authorization_endpoint, "Authorization endpoint")?;
    {
        let mut query = url.query_pairs_mut();
        query
            .append_pair("response_type", "code")
            .append_pair("client_id", client_id)
            .append_pair("redirect_uri", redirect_uri)
            .append_pair("state", state)
            .append_pair("code_challenge", challenge)
            .append_pair("code_challenge_method", "S256")
            .append_pair("resource", resource);
        if !scopes.is_empty() {
            query.append_pair("scope", &scopes.join(" "));
        }
    }
    Ok(url.to_string())
}

fn prepare_authorization(request: McpOAuthRequest) -> Result<PreparedAuthorization, String> {
    if !valid_server_id(&request.id) {
        return Err("MCP server id is invalid.".into());
    }
    if request.oauth_scopes.len() > 40
        || request.oauth_scopes.iter().any(|scope| {
            scope.is_empty() || scope.len() > 200 || scope.chars().any(char::is_whitespace)
        })
    {
        return Err("OAuth scopes exceed the configured limits.".into());
    }
    let client = oauth_client()?;
    let (resource, issuer) =
        discover_authorization_server(&client, &request.target, &request.oauth_issuer)?;
    let metadata = fetch_authorization_metadata(&client, &issuer)?;
    for scope in &request.oauth_scopes {
        if !metadata.scopes_supported.is_empty() && !metadata.scopes_supported.contains(scope) {
            return Err(format!(
                "Authorization server does not advertise the {scope} scope."
            ));
        }
    }
    let listener = TcpListener::bind("127.0.0.1:0")
        .map_err(|error| format!("Could not bind the OAuth callback listener: {error}"))?;
    let port = listener
        .local_addr()
        .map_err(|error| format!("Could not inspect the OAuth callback listener: {error}"))?
        .port();
    let redirect_uri = format!("http://127.0.0.1:{port}/callback");
    let (client_id, client_secret) = if request.oauth_client_id.trim().is_empty() {
        let endpoint = metadata.registration_endpoint.as_deref().ok_or_else(|| {
            "Authorization server does not support dynamic registration. Enter a registered client ID.".to_string()
        })?;
        register_client(&client, endpoint, &redirect_uri)?
    } else {
        let client_id = request.oauth_client_id.trim();
        if client_id.len() > 1000 || client_id.chars().any(char::is_control) {
            return Err("OAuth client ID is invalid.".into());
        }
        (client_id.to_string(), None)
    };
    let code_verifier = random_url_safe(48)?;
    let state = random_url_safe(24)?;
    let authorization_url = build_authorization_url(
        &metadata,
        &client_id,
        &redirect_uri,
        &state,
        &pkce_challenge(&code_verifier),
        &resource,
        &request.oauth_scopes,
    )?;
    Ok(PreparedAuthorization {
        client,
        listener,
        server_id: request.id,
        redirect_uri,
        state,
        code_verifier,
        client_id,
        client_secret,
        resource,
        metadata,
        authorization_url,
    })
}

fn callback_parameters(request_target: &str) -> Result<(String, String), String> {
    let url = reqwest::Url::parse(&format!("http://127.0.0.1{request_target}"))
        .map_err(|_| "OAuth callback URL was malformed.".to_string())?;
    if url.path() != "/callback" {
        return Err("OAuth callback path was not recognized.".into());
    }
    let mut code = None;
    let mut state = None;
    let mut error = None;
    for (key, value) in url.query_pairs() {
        match key.as_ref() {
            "code" => code = Some(value.into_owned()),
            "state" => state = Some(value.into_owned()),
            "error" => error = Some(value.into_owned()),
            _ => {}
        }
    }
    if let Some(error) = error {
        return Err(format!("Authorization server returned: {error}"));
    }
    Ok((
        code.ok_or_else(|| "OAuth callback did not include a code.".to_string())?,
        state.ok_or_else(|| "OAuth callback did not include state.".to_string())?,
    ))
}

fn wait_for_callback(listener: TcpListener, expected_state: &str) -> Result<String, String> {
    listener
        .set_nonblocking(true)
        .map_err(|error| format!("Could not configure the OAuth callback listener: {error}"))?;
    let deadline = Instant::now() + CALLBACK_TIMEOUT;
    loop {
        if Instant::now() >= deadline {
            return Err("OAuth authorization timed out after five minutes.".into());
        }
        match listener.accept() {
            Ok((mut stream, address)) => {
                if !address.ip().is_loopback() {
                    continue;
                }
                stream.set_read_timeout(Some(Duration::from_secs(3))).ok();
                let mut buffer = [0_u8; 8192];
                let count = stream
                    .read(&mut buffer)
                    .map_err(|error| format!("Could not read the OAuth callback: {error}"))?;
                let request = String::from_utf8_lossy(&buffer[..count]);
                let first_line = request.lines().next().unwrap_or_default();
                let mut parts = first_line.split_whitespace();
                if parts.next() != Some("GET") {
                    continue;
                }
                let target = parts
                    .next()
                    .ok_or_else(|| "OAuth callback request was malformed.".to_string())?;
                let result = callback_parameters(target).and_then(|(code, state)| {
                    if state != expected_state {
                        Err("OAuth callback state did not match the authorization request.".into())
                    } else {
                        Ok(code)
                    }
                });
                let (status, title, detail) = if result.is_ok() {
                    (
                        "200 OK",
                        "Authorization complete",
                        "You can close this window and return to Keelhouse.",
                    )
                } else {
                    (
                        "400 Bad Request",
                        "Authorization failed",
                        "Return to Keelhouse for details.",
                    )
                };
                let body = format!("<!doctype html><meta charset=\"utf-8\"><title>{title}</title><h1>{title}</h1><p>{detail}</p>");
                let response = format!(
                    "HTTP/1.1 {status}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\nCache-Control: no-store\r\n\r\n{body}",
                    body.len()
                );
                let _ = stream.write_all(response.as_bytes());
                let _ = stream.flush();
                return result;
            }
            Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                std::thread::sleep(Duration::from_millis(100));
            }
            Err(error) => return Err(format!("OAuth callback listener failed: {error}")),
        }
    }
}

fn parse_token_response(
    value: Value,
    metadata: &AuthorizationServerMetadata,
    client_id: &str,
    resource: &str,
    existing_refresh_token: Option<String>,
) -> Result<StoredOAuthTokens, String> {
    let access_token = value
        .get("access_token")
        .and_then(Value::as_str)
        .filter(|token| !token.is_empty() && token.len() <= 32_768)
        .ok_or_else(|| "Token response did not include an access token.".to_string())?;
    let token_type = value
        .get("token_type")
        .and_then(Value::as_str)
        .unwrap_or("Bearer");
    if !token_type.eq_ignore_ascii_case("bearer") {
        return Err("Token response did not use the Bearer token type.".into());
    }
    let refresh_token = value
        .get("refresh_token")
        .and_then(Value::as_str)
        .filter(|token| !token.is_empty() && token.len() <= 32_768)
        .map(str::to_string)
        .or(existing_refresh_token);
    let expires_at = value
        .get("expires_in")
        .and_then(Value::as_u64)
        .map(|seconds| now_unix().saturating_add(seconds.min(31_536_000)));
    Ok(StoredOAuthTokens {
        access_token: access_token.to_string(),
        refresh_token,
        token_type: "Bearer".into(),
        expires_at,
        token_endpoint: metadata.token_endpoint.clone(),
        revocation_endpoint: metadata.revocation_endpoint.clone(),
        client_id: client_id.to_string(),
        resource: resource.to_string(),
    })
}

fn exchange_code(
    prepared: &PreparedAuthorization,
    code: &str,
) -> Result<StoredOAuthTokens, String> {
    let mut form = vec![
        ("grant_type", "authorization_code".to_string()),
        ("code", code.to_string()),
        ("client_id", prepared.client_id.clone()),
        ("redirect_uri", prepared.redirect_uri.clone()),
        ("code_verifier", prepared.code_verifier.clone()),
        ("resource", prepared.resource.clone()),
    ];
    if let Some(secret) = prepared.client_secret.as_ref() {
        form.push(("client_secret", secret.clone()));
    }
    let value = response_json(
        prepared
            .client
            .post(&prepared.metadata.token_endpoint)
            .form(&form)
            .send()
            .map_err(|error| format!("OAuth token exchange failed: {error}"))?,
        "OAuth token exchange",
    )?;
    parse_token_response(
        value,
        &prepared.metadata,
        &prepared.client_id,
        &prepared.resource,
        None,
    )
}

fn save_tokens(server_id: &str, tokens: &StoredOAuthTokens) -> Result<(), String> {
    let value = serde_json::to_string(tokens)
        .map_err(|error| format!("Could not encode OAuth credentials: {error}"))?;
    write_connection_secret(&token_key(server_id), &value)
}

fn load_tokens(server_id: &str) -> Result<Option<StoredOAuthTokens>, String> {
    let Some(value) = read_connection_secret(&token_key(server_id))? else {
        return Ok(None);
    };
    serde_json::from_str(&value)
        .map(Some)
        .map_err(|_| "Stored OAuth credentials are invalid; disconnect and authorize again.".into())
}

fn refresh_tokens_request(
    client: &Client,
    current: StoredOAuthTokens,
    client_secret: Option<String>,
) -> Result<StoredOAuthTokens, String> {
    let refresh_token = current
        .refresh_token
        .clone()
        .ok_or_else(|| "OAuth access expired and no refresh token is available.".to_string())?;
    let mut form = vec![
        ("grant_type", "refresh_token".to_string()),
        ("refresh_token", refresh_token.clone()),
        ("client_id", current.client_id.clone()),
        ("resource", current.resource.clone()),
    ];
    if let Some(secret) = client_secret {
        form.push(("client_secret", secret));
    }
    let value = response_json(
        client
            .post(&current.token_endpoint)
            .form(&form)
            .send()
            .map_err(|error| format!("OAuth token refresh failed: {error}"))?,
        "OAuth token refresh",
    )?;
    let metadata = AuthorizationServerMetadata {
        issuer: String::new(),
        authorization_endpoint: String::new(),
        token_endpoint: current.token_endpoint.clone(),
        registration_endpoint: None,
        revocation_endpoint: current.revocation_endpoint.clone(),
        scopes_supported: Vec::new(),
        code_challenge_methods_supported: Vec::new(),
    };
    let refreshed = parse_token_response(
        value,
        &metadata,
        &current.client_id,
        &current.resource,
        Some(refresh_token),
    )?;
    Ok(refreshed)
}

fn refresh_tokens(
    server_id: &str,
    current: StoredOAuthTokens,
) -> Result<StoredOAuthTokens, String> {
    let client = oauth_client()?;
    let client_secret = read_connection_secret(&client_secret_key(server_id))?;
    let refreshed = refresh_tokens_request(&client, current, client_secret)?;
    save_tokens(server_id, &refreshed)?;
    Ok(refreshed)
}

fn revoke_tokens(
    client: &Client,
    tokens: &StoredOAuthTokens,
    client_secret: Option<String>,
) -> Result<(), String> {
    let Some(endpoint) = tokens.revocation_endpoint.as_deref() else {
        return Ok(());
    };
    let (token, hint) = tokens
        .refresh_token
        .as_ref()
        .map(|token| (token.clone(), "refresh_token"))
        .unwrap_or_else(|| (tokens.access_token.clone(), "access_token"));
    let mut form = vec![
        ("token", token),
        ("token_type_hint", hint.to_string()),
        ("client_id", tokens.client_id.clone()),
    ];
    if let Some(secret) = client_secret {
        form.push(("client_secret", secret));
    }
    let response = client
        .post(endpoint)
        .form(&form)
        .send()
        .map_err(|error| format!("OAuth token revocation failed: {error}"))?;
    if !response.status().is_success() {
        return Err(format!(
            "OAuth token revocation returned HTTP {}.",
            response.status()
        ));
    }
    Ok(())
}

pub(crate) fn oauth_authorization_header(server_id: &str) -> Result<String, String> {
    if !valid_server_id(server_id) {
        return Err("MCP server id is invalid.".into());
    }
    let mut tokens = load_tokens(server_id)?.ok_or_else(|| {
        "MCP OAuth authorization is required before this server can be checked.".to_string()
    })?;
    if tokens
        .expires_at
        .is_some_and(|expires_at| expires_at <= now_unix().saturating_add(30))
    {
        tokens = refresh_tokens(server_id, tokens)?;
    }
    Ok(format!("Bearer {}", tokens.access_token))
}

fn complete_authorization(prepared: PreparedAuthorization) -> Result<(), String> {
    let code = wait_for_callback(
        prepared
            .listener
            .try_clone()
            .map_err(|error| error.to_string())?,
        &prepared.state,
    )?;
    let tokens = exchange_code(&prepared, &code)?;
    save_tokens(&prepared.server_id, &tokens)
}

#[tauri::command]
pub(crate) async fn begin_mcp_oauth(
    app: AppHandle,
    state: State<'_, McpOAuthState>,
    request: McpOAuthRequest,
) -> Result<McpOAuthStart, String> {
    if !valid_server_id(&request.id) {
        return Err("MCP server id is invalid.".into());
    }
    let server_id = request.id.clone();
    let statuses = state.statuses.clone();
    if statuses
        .lock()
        .ok()
        .and_then(|current| current.get(&server_id).cloned())
        .is_some_and(|status| status.state == "pending")
    {
        return Err("OAuth authorization is already in progress for this server.".into());
    }
    set_status(
        &statuses,
        &server_id,
        "pending",
        "Preparing browser authorization...",
    );
    let prepared =
        match tauri::async_runtime::spawn_blocking(move || prepare_authorization(request)).await {
            Ok(Ok(prepared)) => prepared,
            Ok(Err(error)) => {
                set_status(&statuses, &server_id, "error", &error);
                return Err(error);
            }
            Err(error) => {
                let message = format!("OAuth preparation task failed: {error}");
                set_status(&statuses, &server_id, "error", &message);
                return Err(message);
            }
        };
    let authorization_url = prepared.authorization_url.clone();
    let client_id = prepared.client_id.clone();
    if let Some(secret) = prepared.client_secret.as_deref() {
        if let Err(error) = write_connection_secret(&client_secret_key(&server_id), secret) {
            set_status(&statuses, &server_id, "error", &error);
            return Err(error);
        }
    }
    if let Err(error) = tauri_plugin_opener::open_url(&authorization_url, None::<&str>) {
        if prepared.client_secret.is_some() {
            let _ = remove_connection_secret(&client_secret_key(&server_id));
        }
        let message = format!("Could not open the authorization page: {error}");
        set_status(&statuses, &server_id, "error", &message);
        return Err(message);
    }
    set_status(
        &statuses,
        &server_id,
        "pending",
        "Browser authorization is waiting for completion.",
    );
    let thread_statuses = statuses.clone();
    let thread_app = app.clone();
    std::thread::spawn(move || {
        let result = complete_authorization(prepared);
        let status = match result {
            Ok(()) => set_status(
                &thread_statuses,
                &server_id,
                "connected",
                "OAuth authorization completed; credentials are stored in Keychain.",
            ),
            Err(error) => set_status(&thread_statuses, &server_id, "error", error),
        };
        let _ = thread_app.emit("mcp-oauth-result", status);
    });
    Ok(McpOAuthStart {
        authorization_url,
        client_id,
        message: "Browser authorization opened.".into(),
    })
}

#[tauri::command]
pub(crate) fn mcp_oauth_status(
    state: State<'_, McpOAuthState>,
    server_id: String,
) -> Result<McpOAuthStatus, String> {
    if !valid_server_id(&server_id) {
        return Err("MCP server id is invalid.".into());
    }
    if let Some(status) = state
        .statuses
        .lock()
        .map_err(|_| "OAuth status is unavailable.".to_string())?
        .get(&server_id)
        .cloned()
    {
        return Ok(status);
    }
    if load_tokens(&server_id)?.is_some() {
        Ok(McpOAuthStatus {
            server_id,
            state: "connected".into(),
            message: "OAuth credentials are stored in Keychain.".into(),
        })
    } else {
        Ok(McpOAuthStatus {
            server_id,
            state: "idle".into(),
            message: "OAuth authorization is not configured.".into(),
        })
    }
}

#[tauri::command]
pub(crate) async fn disconnect_mcp_oauth(
    state: State<'_, McpOAuthState>,
    server_id: String,
) -> Result<McpOAuthStatus, String> {
    if !valid_server_id(&server_id) {
        return Err("MCP server id is invalid.".into());
    }
    let revocation_server_id = server_id.clone();
    tauri::async_runtime::spawn_blocking(move || {
        if let Some(tokens) = load_tokens(&revocation_server_id)? {
            let client = oauth_client()?;
            let secret = read_connection_secret(&client_secret_key(&revocation_server_id))?;
            revoke_tokens(&client, &tokens, secret)?;
        }
        remove_connection_secret(&token_key(&revocation_server_id))?;
        remove_connection_secret(&client_secret_key(&revocation_server_id))
    })
    .await
    .map_err(|error| format!("OAuth disconnect task failed: {error}"))??;
    Ok(set_status(
        &state.statuses,
        &server_id,
        "idle",
        "OAuth credentials were removed from Keychain.",
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Mutex};
    use std::thread;

    fn metadata() -> AuthorizationServerMetadata {
        AuthorizationServerMetadata {
            issuer: "https://auth.example.test/tenant".into(),
            authorization_endpoint: "https://auth.example.test/authorize".into(),
            token_endpoint: "https://auth.example.test/token".into(),
            registration_endpoint: None,
            revocation_endpoint: None,
            scopes_supported: vec!["mcp:tools".into()],
            code_challenge_methods_supported: vec!["S256".into()],
        }
    }

    #[test]
    fn parses_resource_metadata_challenges() {
        assert_eq!(
            parse_resource_metadata_url(
                "Bearer realm=\"mcp\", resource_metadata=\"https://mcp.example.test/.well-known/oauth-protected-resource\""
            )
            .as_deref(),
            Some("https://mcp.example.test/.well-known/oauth-protected-resource")
        );
        assert_eq!(parse_resource_metadata_url("Basic realm=\"mcp\""), None);
    }

    #[test]
    fn inserts_well_known_before_an_issuer_path() {
        assert_eq!(
            authorization_metadata_url("https://auth.example.test/tenant")
                .unwrap()
                .as_str(),
            "https://auth.example.test/.well-known/oauth-authorization-server/tenant"
        );
    }

    #[test]
    fn pkce_matches_the_rfc_7636_vector() {
        let verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
        assert_eq!(
            pkce_challenge(verifier),
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
        );
    }

    #[test]
    fn authorization_url_binds_state_pkce_and_resource() {
        let url = build_authorization_url(
            &metadata(),
            "client-id",
            "http://127.0.0.1:43123/callback",
            "state-value",
            "challenge-value",
            "https://mcp.example.test/mcp",
            &["mcp:tools".into()],
        )
        .unwrap();
        let parsed = reqwest::Url::parse(&url).unwrap();
        let query = parsed.query_pairs().collect::<HashMap<_, _>>();
        assert_eq!(
            query.get("state").map(|value| value.as_ref()),
            Some("state-value")
        );
        assert_eq!(
            query
                .get("code_challenge_method")
                .map(|value| value.as_ref()),
            Some("S256")
        );
        assert_eq!(
            query.get("resource").map(|value| value.as_ref()),
            Some("https://mcp.example.test/mcp")
        );
    }

    #[test]
    fn callback_requires_the_expected_path_and_decodes_values() {
        assert_eq!(
            callback_parameters("/callback?code=a%2Bb&state=state-value").unwrap(),
            ("a+b".into(), "state-value".into())
        );
        assert!(callback_parameters("/other?code=a&state=b").is_err());
    }

    #[test]
    fn token_parser_rejects_missing_access_tokens() {
        assert!(parse_token_response(
            json!({ "token_type": "Bearer" }),
            &metadata(),
            "client",
            "https://mcp.example.test/mcp",
            None,
        )
        .expect_err("missing token")
        .contains("access token"));
    }

    #[test]
    fn prepares_authorization_through_live_metadata_and_registration_endpoints() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        let origin = format!("http://{address}");
        let requests = Arc::new(Mutex::new(Vec::new()));
        let recorded_requests = requests.clone();
        let server_origin = origin.clone();
        let server = thread::spawn(move || {
            for _ in 0..4 {
                let (mut stream, _) = listener.accept().unwrap();
                stream
                    .set_read_timeout(Some(Duration::from_secs(2)))
                    .unwrap();
                let mut bytes = [0_u8; 8192];
                let count = stream.read(&mut bytes).unwrap();
                let request = String::from_utf8_lossy(&bytes[..count]).to_string();
                let request_line = request.lines().next().unwrap_or_default().to_string();
                recorded_requests.lock().unwrap().push(request_line.clone());
                let (status, headers, body) = if request_line.starts_with("POST /mcp ") {
                    (
                        "401 Unauthorized",
                        format!(
                            "WWW-Authenticate: Bearer resource_metadata=\"{server_origin}/.well-known/oauth-protected-resource\"\r\n"
                        ),
                        "{}".to_string(),
                    )
                } else if request_line.starts_with("GET /.well-known/oauth-protected-resource ") {
                    (
                        "200 OK",
                        String::new(),
                        json!({
                            "resource": format!("{server_origin}/mcp"),
                            "authorization_servers": [format!("{server_origin}/tenant")]
                        })
                        .to_string(),
                    )
                } else if request_line
                    .starts_with("GET /.well-known/oauth-authorization-server/tenant ")
                {
                    (
                        "200 OK",
                        String::new(),
                        json!({
                            "issuer": format!("{server_origin}/tenant"),
                            "authorization_endpoint": format!("{server_origin}/authorize"),
                            "token_endpoint": format!("{server_origin}/token"),
                            "registration_endpoint": format!("{server_origin}/register"),
                            "revocation_endpoint": format!("{server_origin}/revoke"),
                            "scopes_supported": ["mcp:tools"],
                            "code_challenge_methods_supported": ["S256"]
                        })
                        .to_string(),
                    )
                } else if request_line.starts_with("POST /register ") {
                    (
                        "201 Created",
                        String::new(),
                        json!({ "client_id": "registered-client", "client_secret": "registered-secret" })
                            .to_string(),
                    )
                } else {
                    ("404 Not Found", String::new(), "{}".to_string())
                };
                let response = format!(
                    "HTTP/1.1 {status}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n{headers}\r\n{body}",
                    body.len()
                );
                stream.write_all(response.as_bytes()).unwrap();
            }
        });

        let prepared = prepare_authorization(McpOAuthRequest {
            id: "local-docs".into(),
            target: format!("{origin}/mcp"),
            oauth_issuer: String::new(),
            oauth_client_id: String::new(),
            oauth_scopes: vec!["mcp:tools".into()],
        })
        .unwrap();

        assert_eq!(prepared.client_id, "registered-client");
        assert_eq!(prepared.client_secret.as_deref(), Some("registered-secret"));
        assert_eq!(prepared.resource, format!("{origin}/mcp"));
        let authorization_url = reqwest::Url::parse(&prepared.authorization_url).unwrap();
        let query = authorization_url.query_pairs().collect::<HashMap<_, _>>();
        assert_eq!(
            query.get("client_id").map(|value| value.as_ref()),
            Some("registered-client")
        );
        assert_eq!(
            query.get("scope").map(|value| value.as_ref()),
            Some("mcp:tools")
        );
        assert!(prepared.redirect_uri.starts_with("http://127.0.0.1:"));
        drop(prepared);
        server.join().unwrap();
        assert_eq!(
            requests.lock().unwrap().as_slice(),
            [
                "POST /mcp HTTP/1.1",
                "GET /.well-known/oauth-protected-resource HTTP/1.1",
                "GET /.well-known/oauth-authorization-server/tenant HTTP/1.1",
                "POST /register HTTP/1.1",
            ]
        );
    }

    fn read_http_request(stream: &mut std::net::TcpStream) -> String {
        stream
            .set_read_timeout(Some(Duration::from_secs(2)))
            .unwrap();
        let mut request = Vec::new();
        let mut buffer = [0_u8; 2048];
        loop {
            let count = stream.read(&mut buffer).unwrap();
            if count == 0 {
                break;
            }
            request.extend_from_slice(&buffer[..count]);
            let header_end = request
                .windows(4)
                .position(|window| window == b"\r\n\r\n")
                .map(|position| position + 4);
            if let Some(header_end) = header_end {
                let headers = String::from_utf8_lossy(&request[..header_end]);
                let content_length = headers
                    .lines()
                    .find_map(|line| {
                        line.strip_prefix("Content-Length: ")
                            .or_else(|| line.strip_prefix("content-length: "))
                    })
                    .and_then(|value| value.trim().parse::<usize>().ok())
                    .unwrap_or(0);
                if request.len() >= header_end + content_length {
                    break;
                }
            }
        }
        String::from_utf8(request).unwrap()
    }

    #[test]
    fn exchanges_refreshes_and_revokes_tokens_over_live_http() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        let origin = format!("http://{address}");
        let bodies = Arc::new(Mutex::new(Vec::new()));
        let recorded_bodies = bodies.clone();
        let server = thread::spawn(move || {
            for index in 0..3 {
                let (mut stream, _) = listener.accept().unwrap();
                let request = read_http_request(&mut stream);
                let body = request
                    .split("\r\n\r\n")
                    .nth(1)
                    .unwrap_or_default()
                    .to_string();
                recorded_bodies.lock().unwrap().push(body);
                let response_body = match index {
                    0 => json!({
                        "access_token": "access-one",
                        "refresh_token": "refresh-one",
                        "token_type": "Bearer",
                        "expires_in": 60
                    })
                    .to_string(),
                    1 => json!({
                        "access_token": "access-two",
                        "token_type": "Bearer",
                        "expires_in": 120
                    })
                    .to_string(),
                    _ => String::new(),
                };
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{response_body}",
                    response_body.len()
                );
                stream.write_all(response.as_bytes()).unwrap();
            }
        });

        let callback_listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let metadata = AuthorizationServerMetadata {
            issuer: format!("{origin}/tenant"),
            authorization_endpoint: format!("{origin}/authorize"),
            token_endpoint: format!("{origin}/token"),
            registration_endpoint: None,
            revocation_endpoint: Some(format!("{origin}/revoke")),
            scopes_supported: Vec::new(),
            code_challenge_methods_supported: vec!["S256".into()],
        };
        let prepared = PreparedAuthorization {
            client: oauth_client().unwrap(),
            listener: callback_listener,
            server_id: "local-docs".into(),
            redirect_uri: "http://127.0.0.1:43123/callback".into(),
            state: "state".into(),
            code_verifier: "verifier".into(),
            client_id: "registered-client".into(),
            client_secret: Some("registered-secret".into()),
            resource: format!("{origin}/mcp"),
            metadata,
            authorization_url: format!("{origin}/authorize"),
        };
        let initial = exchange_code(&prepared, "authorization-code").unwrap();
        assert_eq!(initial.access_token, "access-one");
        assert_eq!(initial.refresh_token.as_deref(), Some("refresh-one"));

        let refreshed =
            refresh_tokens_request(&prepared.client, initial, Some("registered-secret".into()))
                .unwrap();
        assert_eq!(refreshed.access_token, "access-two");
        assert_eq!(refreshed.refresh_token.as_deref(), Some("refresh-one"));
        revoke_tokens(
            &prepared.client,
            &refreshed,
            Some("registered-secret".into()),
        )
        .unwrap();
        server.join().unwrap();

        let bodies = bodies.lock().unwrap();
        assert!(bodies[0].contains("grant_type=authorization_code"));
        assert!(bodies[0].contains("code_verifier=verifier"));
        assert!(bodies[0].contains("resource=http%3A%2F%2F127.0.0.1"));
        assert!(bodies[1].contains("grant_type=refresh_token"));
        assert!(bodies[1].contains("refresh_token=refresh-one"));
        assert!(bodies[2].contains("token=refresh-one"));
        assert!(bodies[2].contains("token_type_hint=refresh_token"));
    }
}
