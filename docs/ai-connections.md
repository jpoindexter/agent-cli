# AI Connections

Keelhouse keeps connection metadata in the existing Tauri Store and secret values in macOS Keychain. The frontend can write, clear, and query the presence of a secret, but the Rust commands never return its value over IPC.

## Implemented Foundation

- Provider defaults for Codex, Gemini, Claude, and OpenCode. OpenCode model addresses use its universal `provider/model` format, so one structured adapter can reach built-in, local, gateway, and custom OpenAI-compatible providers configured in OpenCode.
- Provider health rows expose an `Open CLI` recovery action for installed providers. Keelhouse launches the official CLI in the active project; that CLI remains responsible for login, browser consent, and credential storage.
- Provider API keys stored under the Keychain service `com.jasonpoindexter.agent-cli.connections`.
- Project-scoped environment records. Non-secret values persist in local settings; secret values persist only in Keychain.
- MCP server records for stdio and HTTP transports with no auth, bearer auth, or OAuth 2.1.
- Target validation that resolves stdio executables through the login-shell `PATH` and rejects malformed HTTP endpoints.
- Bounded live MCP checks for stdio and Streamable HTTP servers. Checks negotiate MCP `2025-06-18`, complete the initialization lifecycle, call `tools/list`, display discovered tool names, propagate HTTP session IDs, and terminate or delete the probe session afterward.
- Bearer-authenticated MCP checks read the token from Keychain only inside Rust. HTTP probes reject redirects and credentials embedded in URLs, cap response bodies at 1 MiB, and time out after six seconds.
- MCP OAuth discovers RFC 9728 protected-resource metadata and RFC 8414 authorization-server metadata, requires PKCE S256, binds authorization and token requests to the MCP resource, validates callback state on a random loopback port, and supports either dynamic client registration or a pre-registered client ID.
- OAuth access/refresh tokens and dynamic client secrets are stored only in Keychain. Expiring access tokens refresh before a probe; Disconnect revokes the refresh token when the server advertises revocation, then removes local credentials.
- Full local reset removes all known connection secrets before clearing metadata.
- New structured Codex and Claude runs plus every raw-terminal create, restore, restart, and worktree launch receive the active project's configured environment. Rust resolves secret references immediately before spawn.
- OpenCode is a structured chat provider backed by `opencode run --format json`. Keelhouse passes model, variant, attachments, session resume, full-access policy, and project environment without reimplementing OpenCode's provider tool loop.
- The OpenCode adapter translates session, text, tool, and cumulative usage records into Keelhouse's provider-neutral chat events. Intermediate tool-call steps remain open until the final answer; stop and time-budget controls terminate the whole process group.
- The composer model browser follows Vanta's provider-first interaction contract: searchable provider navigation, separate current/default badges, a live OpenCode catalog, explicit refresh, and a typed-ID fallback. Opening the picker reads `opencode models` from OpenCode's local catalog; Refresh alone requests `--refresh`. Model addresses are validated and bounded before crossing IPC, and provider credentials never reach React.
- Provider keys map in Rust to `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `ANTHROPIC_API_KEY`; the renderer cannot choose a provider secret key or read its value.

Secret identifiers are namespaced as `provider:<provider>:api-key`, `mcp:<server-id>:bearer`, `mcp:<server-id>:oauth-tokens`, `mcp:<server-id>:oauth-client-secret`, and `environment:<variable-id>`. Values are never written to `workspace.json`, rendered after save, logged, or placed in command arguments.

## Current Boundary

Connection records, process environment injection, live MCP discovery, provider recovery launch, and the OAuth protocol lifecycle are implemented. OpenCode owns its credentials and provider catalog; Keelhouse does not mirror secrets from `auth.json` into its Keychain. Live CLI probes executed an OpenAI model text turn and a multi-step shell-tool turn. Browser QA verified the repaired Connections layout and exercised the model browser at 1280x720 and 640x900: provider switching, refresh, search, Escape, full containment, zero horizontal overflow, and zero console errors passed. A fresh signed package built, launched, and painted normally; native model selection stopped at the macOS Documents-folder permission prompt, which requires the operator to grant access. No launch failure was written to `health.log`. Claude's structured adapter reuses the existing Claude CLI session; its capability and auth status have been inspected without sending a prompt. Gemini was switched from an invalid API-key selection to its official `oauth-personal` flow, but the first smoke stopped at browser consent while the Mac was locked. This does not yet prove a packaged OpenCode turn, packaged third-party OAuth consent, or packaged provider-credential validation. Those real UI paths remain before `AI-CONNECTIONS` is complete.

Provider environment names follow the current official CLI contracts: [Codex CLI](https://help.openai.com/en/articles/11096431), [Gemini CLI](https://google-gemini.github.io/gemini-cli/docs/get-started/authentication.html), and [Claude Code](https://docs.anthropic.com/en/docs/claude-code/llm-gateway). OpenCode provider/model and custom OpenAI-compatible behavior follows its [provider documentation](https://opencode.ai/docs/providers).

## Verification

Run from `app/`:

```bash
npm test -- connectionSettings.test.ts ConnectionSettingsPanel.test.tsx
npm run qa:chrome-contract
npm run build
cd src-tauri && cargo test connection_secrets && cargo test mcp_probe && cargo test mcp_oauth && cargo test opencode_adapter
```
