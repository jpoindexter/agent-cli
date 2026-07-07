# agent cli

Terminal-first multi-agent cockpit. The real Claude Code TUI front and center, a thin file rail, **tabs = projects**, each tab holding N agent panes (claude ×3 on one repo, codex on another) — none of the VSCode chrome.

## Current state — R1 trial in progress

A [16-framework blind-spot audit](docs/blind-spot-audit-2026-07-07.html) on 2026-07-07 found the demo had replaced the actual trial (zero zellij config existed, tools weren't installed) and that the "zellij is closest match" call had gone stale after later feedback (VSCode-editor-fidelity expectation, color rejections). Remediated same day — see `ERRORS.md` and `DECISIONS.md` for the full record.

- **Editor-fidelity spike** (`spike/`) — **PASSED** 2026-07-07. Real tree-sitter highlighting, usable for real editing.
- **R1: Zellij cockpit trial** — **started.** `zellij/agent.kdl` is the real config: `cd zellij && ./install.sh`, then `zellij --layout agent --session agent`. One week of daily use, frictions logged in `ERRORS.md` same-day.
- **R2: Superconductor trial** — next, after R1 concludes (not concurrent — confounds friction attribution).
- **R3: Tauri 2 native harness** — gated. Exact firing threshold in `DECISIONS.md`, decided before the trials, not after.

Read `PRD.md`, `ROADMAP.md`, `DECISIONS.md`, `PARKED.md`, `ERRORS.md` at the start of any session on this project.

## In this repo

| Path | What |
|---|---|
| `PRD.md` / `ROADMAP.md` / `DECISIONS.md` / `PARKED.md` / `ERRORS.md` | Planning docs — source of truth |
| `roadmap.json` / `roadmap.html` | The plan as a rockmap board — open `roadmap.html` in a browser |
| `spike/` | The editor-fidelity test — `cd spike && hx sample.tsx` (passed 2026-07-07) |
| `zellij/agent.kdl` | **The real R1 trial config** — `cd zellij && ./install.sh`, then `zellij --layout agent --session agent` |
| `rockmap/` | Vendored [rockmap](https://github.com/jpoindexter/rockmap) (board generator) |
| `demo/cockpit-demo.html` | Interactive demo of the target experience — press 1–4 / n / x |
| `docs/brainstorm/` | Design-phase mockups (platform options, approaches, tab models) |
| `docs/blind-spot-audit-2026-07-07.html` | The audit that caught the drift, and the action report |
| `resources/superconductor-reference/` | Superconductor UX notes (settings-key feature map) + icon — the signed binary itself was removed, see `DECISIONS.md` |

Rebuild the board after editing `roadmap.json`:

```bash
node rockmap/build-roadmap.mjs roadmap.json roadmap.html
```
