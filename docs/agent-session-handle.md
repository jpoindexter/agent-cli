# Agent Session Handle

AGENT-SESSION-HANDLE adds the app-owned layer between real pty panes and Codex-style composer/hook surfaces.

## Implemented

- `app/src/agentSessionHandle.ts` defines `AgentSessionHandleDescriptor`, `AgentSessionHandle`, approval modes, process-state mapping, activity labels, and terminal `readTail` extraction.
- Each active terminal pane can be described as a handle with stable `pane:<id>` id, project id, project session id, cwd, pane label, profile id/label, process state, approval mode, exit code, created time, and activity metadata.
- The selected composer target is wrapped as an `AgentSessionHandle`.
- Composer prompt send now calls `handle.send(text)`, which focuses the pane if needed, pastes into the real pty, and sends Enter.
- Stop/interrupt now calls `handle.interrupt()`.
- Close selected pane now calls `handle.close()`.
- The terminal context menu exposes `Copy Last 20 Lines`, backed by `handle.readTail(20)` from the latest terminal snapshot.

## Boundaries

- The handle does not replace the real Claude/Codex terminal UI.
- `readTail` currently reads the visible/latest terminal snapshot, not the full scrollback transcript.
- Approval mode is contract metadata only in this slice; APP-ACTIONS-MINIMAL and COMPOSER-HARNESS add real action gates and visible permission controls.
- Activity metadata is the current process summary. Full event history belongs to AGENT-ACTIVITY and AGENT-ACTIVITY-LOG.
- Direct MCP/API agent orchestration remains v2 until terminal-backed handles and app-owned actions are solid.

## Verification

- `npm run build`
- `npm test`
- `cargo test` with Zig 0.15 path
- `cargo fmt --check`
- `npm run qa:editor`
- `git diff --check`
