# Codex Multi-Chat Checkpoint

Implementation checkpoint: 2026-07-13.

## Product Correction

Native QA showed that the previous center surface was the raw PTY transcript with chat chrome. That made a project row a terminal session rather than the Codex-style independent chat Jason expected.

The corrected model separates:

- `chatConversations`: persisted user, assistant, tool, status, and error messages keyed by project + chat id.
- Codex provider identity: the `thread.started` UUID is persisted and passed to `codex exec resume --json` on later turns.
- Chat run state: start/stop/completion belongs to the chat and drives rail/title/status indicators.
- Raw terminal state: PTY panes remain optional, start lazily only when Raw terminal is opened, and never supply inferred chat structure.

## Executed Evidence

- Local `codex exec --json -s read-only` used the existing OAuth and emitted `thread.started`, `turn.started`, structured `item.completed`, and `turn.completed` events.
- Frontend build passed.
- All 178 frontend tests passed, including chat normalization, event reduction, tool rendering, title generation, and chat prompt routing.
- All 47 Rust tests passed, including new/resume command construction, sandbox mapping, provider-thread-id validation, and full process-group cancellation.
- `qa:chrome-contract` passed.
- `package:mac` produced the rebuilt `Keelhouse.app`.
- The frontend allocates and persists the active run before invoking Codex, so a fast completion cannot leave the chat stuck in `Working`.
- Opening or switching chats uses `resolve_workspace`; it does not launch a hidden PTY.

## Native Criterion Executed

Executed in the rebuilt arm64 `Keelhouse.app` on 2026-07-13:

1. Created two chats under `agent cli`; each received distinct structured Codex output through the existing OAuth session.
2. Switched between chats and confirmed their user/assistant/tool histories did not mix.
3. Asked each chat to recall its previous token without restating it. Chat A returned `CHAT-A-ONE`; Chat B returned `CHAT-B-ONE`, proving independent provider-thread resume.
4. Ran `sleep 60` in Chat A and `sleep 20` in Chat B concurrently. Both rail rows showed Running.
5. The first Stop attempt exposed a real defect: only the wrapper shell was killed. `chat_harness.rs` now launches each Codex run in its own process group and terminates that group. A Rust regression test exercises a shell plus descendant process.
6. Rebuilt and repeated the workflow. Chat A returned to Ready within 1.8 seconds after Stop while Chat B remained Running and completed `CHAT-B-SURVIVED`. After the original 60-second delay window elapsed, Chat A still had not emitted the forbidden `CHAT-A-CANCEL-FAILED` token.
7. Quit and relaunched the packaged app. Projects, both histories, and provider thread ids restored. Chat B recalled the pre-relaunch token `CHAT-B-LONG-DONE` without it being supplied in the new prompt.
8. Toggled Raw terminal on and back. It replaced the center chat surface and the structured chat/composer returned unchanged.

Evidence: `codex-multi-chat-native.png`. This completes the `DIRECT-AGENT-HARNESS` native criterion. It does not complete rich Markdown, durable SQLite storage, provider approvals, Gemini/Claude structured adapters, or the remaining daily-driver/performance workflows.
