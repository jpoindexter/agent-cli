# Session Pane Isolation

Implementation checkpoint: 2026-07-12.

## Code Evidence

- Live pane and active-pane maps are keyed by `project root + session id` through `paneContextKey`.
- Project badges aggregate all session contexts; session rows use only their owned panes.
- Creating or switching a same-project thread runs the target context through the real workspace/pane restore path without copying the outgoing pane set.
- Background pane exits update the owning session and aggregate project status.
- Deleting a thread closes only its owned backend panes and switches to the fallback context.
- `paneOwnership.test.ts` covers context keys, same-project separation, malformed keys, and project cleanup.

`npm run build`, all 176 frontend tests, all QA gates, and `npm run package:mac` pass.

## Live Criterion Still Pending

The packaged app must execute this sequence after macOS is unlocked:

1. Open a same-project thread with multiple live panes.
2. Create a new thread and confirm it starts with only its own default pane.
3. Start output in both threads.
4. Switch twice and confirm pane IDs, labels, output, and process state remain independent.
5. Quit/relaunch and confirm each thread restores its own layout with fresh processes.

Two attempts to execute this path were stopped by the locked Mac. This is not negative product evidence and does not complete `SESSION-PANE-ISOLATION`.
