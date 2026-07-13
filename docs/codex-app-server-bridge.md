# Codex App-Server Bridge

Keelhouse structured Codex chats use `codex app-server --stdio`, not terminal transcript parsing or the completed-item-only `codex exec --json` stream.

## Protocol

For each active chat turn, the Rust bridge:

1. launches an isolated app-server process in the project directory;
2. sends `initialize` and `initialized`;
3. starts or resumes the chat's saved provider thread;
4. starts one turn with the selected model, reasoning effort, approval policy, sandbox, and prompt on stdin;
5. forwards provider notifications to the selected chat only; and
6. interrupts the exact thread/turn before using process-group termination as a fallback.

The React reducer consumes `item/agentMessage/delta` and command/file output deltas progressively, then reconciles the same item on `item/completed`. Reasoning text notifications are intentionally ignored. Provider usage is read from `thread/tokenUsage/updated`.

## Evidence

- Installed CLI: `codex-cli 0.141.0`.
- Direct protocol smoke streamed `APP-SERVER-SMOKE` in six provider deltas and completed the turn.
- `cargo test`: 55 passing tests.
- `npm test`: 193 passing tests.
- Production build, package build, and `qa:chrome-contract` pass.

The corrected package still needs an unlocked native session for final visual confirmation of progressive Markdown, scroll anchoring, and stop behavior. Provider approvals are exposed by app-server but remain a separate roadmap card until the inline decision UI and allow/deny native QA exist.
