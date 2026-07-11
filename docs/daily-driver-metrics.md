# Daily Driver Metrics

DAILY-DRIVER-METRICS proves Keelhouse is moving toward the actual replacement workflow: use one app window instead of multiple VS Code windows, talk to real agents, inspect/edit files, preview local web output, and switch projects.

## North Star

Daily-driver workflow runs completed without opening VS Code.

## Instrumented Scenarios

1. **One project: talk, edit, preview** — the agent Run stays primary, editor save path exists, composer routes prompts with context, and browser preview can open detected localhost servers.
2. **Two agents: same project** — one project owns multiple real panes, with focus, close, labels, lifecycle, and layout persistence.
3. **Three projects: switch and relaunch** — project rail, sessions, editor snapshots, pane layout, and browser preview URLs survive switching and relaunch boundaries.

## Command

Run from `app/` after build and editor QA:

```bash
npm run build
npm run qa:shell
npm run qa:editor
npm run qa:daily-driver
```

The collector writes:

- `docs/qa/daily-driver/latest.json`
- `docs/qa/daily-driver/latest.md`

## Current Boundary

The current collector verifies implementation readiness: required code paths, docs, and actual app-shell screenshots exist for the three workflow runs. It does not prove the North Star, time live Tauri runs, or compare memory/CPU against VS Code. Those claims require recorded end-to-end runs and remain open.
