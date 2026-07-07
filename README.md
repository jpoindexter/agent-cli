# agent cli

Terminal-first multi-agent cockpit. The real Claude Code TUI front and center, a thin file rail, **tabs = projects**, each tab holding N agent panes (claude ×3 on one repo, codex on another) — none of the VSCode chrome.

## Current state — trials before code

Decided 2026-07-07 after a July-2026 OSS survey (every purpose-built Claude Code GUI reimplements the UI, is deprecated, closed, or Electron-heavy):

1. **Zellij cockpit spike** (closest match to the stated experience): KDL layout in Ghostty — tabs per project, yazi rail, agent panes in worktrees, native persistence.
2. **Superconductor trial** (`resources/super.engineering.app`, closed source): its workspace-tab + worktree-per-task model is exactly the ask; its chat UI instead of the claude TUI is the open question.
3. **Tauri 2 native harness** — gated endgame, only if both trials fail on logged frictions. Seed: hashmark's Tauri scaffold + Warp design spec.

## In this repo

| Path | What |
|---|---|
| `roadmap.json` / `roadmap.html` | The plan as a rockmap board — open `roadmap.html` in a browser |
| `rockmap/` | Vendored [rockmap](https://github.com/jpoindexter/rockmap) (board generator) |
| `demo/cockpit-demo.html` | **Interactive demo of the target experience** — open it, press 1–4 / n / x |
| `docs/brainstorm/` | Design-phase mockups (platform options, approaches, tab models) |
| `resources/super.engineering.app` | Superconductor bundle (LFS) — UX reference to mine |

Rebuild the board after editing `roadmap.json`:

```bash
node rockmap/build-roadmap.mjs roadmap.json roadmap.html
```
