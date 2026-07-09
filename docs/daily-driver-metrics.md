# Daily Driver Metrics

DAILY-DRIVER-METRICS proves Keelhouse is moving toward the actual replacement workflow: use one app window instead of multiple VS Code windows, talk to real agents, inspect/edit files, preview local web output, and switch projects.

## North Star

Daily-driver workflow runs completed without opening VS Code.

## Instrumented Scenarios

1. **One project: talk, edit, preview** — agent thread stays primary, editor save path exists, composer routes prompts with context, and browser preview can open detected localhost servers.
2. **Two agents: same project** — one project owns multiple real panes, with focus, close, labels, lifecycle, and layout persistence.
3. **Three projects: switch and relaunch** — project rail, sessions, editor snapshots, pane layout, and browser preview URLs survive switching and relaunch boundaries.

## Command

Run from `app/` after build and editor QA:

```bash
npm run build
npm run qa:editor
npm run qa:daily-driver
```

The collector writes:

- `docs/qa/daily-driver/latest.json`
- `docs/qa/daily-driver/latest.md`

## Current Boundary

The current collector verifies that required code paths, docs, and screenshot evidence exist for the three workflow runs. It does not yet time live Tauri runs or compare memory/CPU against VS Code. Those measurements belong to the next pass after this readiness gate is stable.
