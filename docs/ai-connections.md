# AI Connections

Keelhouse keeps connection metadata in the existing Tauri Store and secret values in macOS Keychain. The frontend can write, clear, and query the presence of a secret, but the Rust commands never return its value over IPC.

## Implemented Foundation

- Provider defaults for Codex, Gemini, and Claude, including a per-provider model name.
- Provider API keys stored under the Keychain service `com.jasonpoindexter.agent-cli.connections`.
- Project-scoped environment records. Non-secret values persist in local settings; secret values persist only in Keychain.
- MCP server records for stdio and HTTP transports with no auth, bearer auth, or an OAuth issuer.
- Target validation that resolves stdio executables through the login-shell `PATH` and rejects malformed HTTP endpoints.
- Bounded live MCP checks for stdio and Streamable HTTP servers. Checks negotiate MCP `2025-06-18`, complete the initialization lifecycle, call `tools/list`, display discovered tool names, propagate HTTP session IDs, and terminate or delete the probe session afterward.
- Bearer-authenticated MCP checks read the token from Keychain only inside Rust. HTTP probes reject redirects and credentials embedded in URLs, cap response bodies at 1 MiB, and time out after six seconds.
- Full local reset removes all known connection secrets before clearing metadata.
- New structured Codex runs and every raw-terminal create, restore, restart, and worktree launch receive the active project's configured environment. Rust resolves secret references immediately before spawn.
- Provider keys map in Rust to `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `ANTHROPIC_API_KEY`; the renderer cannot choose a provider secret key or read its value.

Secret identifiers are namespaced as `provider:<provider>:api-key`, `mcp:<server-id>:bearer`, and `environment:<variable-id>`. Values are never written to `workspace.json`, rendered after save, logged, or placed in command arguments.

## Current Boundary

Connection records, process environment injection, and live MCP discovery are implemented. OAuth entries remain intentionally blocked at health-check time until the app has a complete PKCE authorization, refresh, revocation, and Keychain token lifecycle. A real provider credential must also be validated through the packaged UI before `AI-CONNECTIONS` is complete.

Provider environment names follow the current official CLI contracts: [Codex CLI](https://help.openai.com/en/articles/11096431), [Gemini CLI](https://google-gemini.github.io/gemini-cli/docs/get-started/authentication.html), and [Claude Code](https://docs.anthropic.com/en/docs/claude-code/llm-gateway).

## Verification

Run from `app/`:

```bash
npm test -- connectionSettings.test.ts ConnectionSettingsPanel.test.tsx
npm run qa:chrome-contract
npm run build
cd src-tauri && cargo test connection_secrets && cargo test mcp_probe
```
