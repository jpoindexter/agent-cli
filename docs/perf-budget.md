# Performance Budget

PERF-BUDGET protects Keelhouse's core promise: replace the user's VS Code-plus-agent workflow with a lighter native agent workbench, not a heavier editor clone.

## Current Gate

Run from `app/` after a production build and daily-driver readiness check:

```bash
npm run build
npm run qa:daily-driver
npm run qa:perf-budget
```

The collector writes:

- `docs/qa/perf-budget/latest.json`
- `docs/qa/perf-budget/latest.md`

## Budgets

- **Hard:** built JS assets must stay under `1.4 MB` and CSS under `90 KB`.
- **Hard:** required chrome/editor screenshots and daily-driver evidence must exist.
- **Hard:** source checks must preserve the lightweight architecture: CodeMirror instead of Monaco, no Monaco dependency, frame-coalesced terminal painting, cached terminal snapshots, and output-driven local preview detection.
- **Soft:** largest JS chunk currently warns above Vite's `500 KB` threshold because CodeMirror language packages are bundled. This is tracked as a warning until chunk splitting becomes valuable.

## Current Boundary

This gate proves the static budget and evidence baseline is present. It does not yet prove Keelhouse is lighter than VS Code at runtime. The next pass must capture packaged Tauri memory, CPU, and responsiveness for one-project, two-agent, and three-project workflows, then compare the same workflows against VS Code.
