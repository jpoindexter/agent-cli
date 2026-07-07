# agent cli

A native macOS app that runs real coding agents (Claude Code, Codex) in real terminal panes — tabs = projects, a file rail, an inline editor — built on Ghostty's terminal engine, with none of the IDE chrome.

## Current state — building it (direction locked 2026-07-07)

**Build our own app, leveraging open-source components** — not adopting a finished third-party app. cmux/Superconductor/hashmark/zellij were all evaluated and are reference only (see `DECISIONS.md` for the full trail, `PARKED.md` for what's shelved).

The core architecture is **verified working** — `spike-ghostty-vt/` proves a real pty → `libghostty-vt` (Ghostty's actual parsing engine, in a Rust backend) → correct cell readback. That's the terminal-engine bet, de-risked.

**Next up (v0):** the render+input loop (`SPIKE-2` — canvas paint + keyboard roundtrip, the one remaining rock), then the Tauri app scaffold, then one live agent pane. See `ROADMAP.md`.

- **Stack:** Tauri 2 + React/TS/Vite + `libghostty-vt` + `portable-pty` + Canvas 2D + CodeMirror 6 (editor, v2). Full design in `ARCHITECTURE.md`. Locked (`DECISIONS.md`).
- **Toolchain gotcha:** Zig must be pinned to **0.15.2** (`brew install zig@0.15`) — the default 0.16 breaks the libghostty-vt build. See `spike-ghostty-vt/README.md`.
- **Theme:** mono-ghost palette approved (`ghostty/config` has the values); applied in v1, not before the core loop works.

Read `PRD.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `PARKED.md`, `ERRORS.md` at the start of any session on this project.

## In this repo

| Path | What |
|---|---|
| `PRD.md` / `ROADMAP.md` / `DECISIONS.md` / `PARKED.md` / `ERRORS.md` | Planning docs — source of truth |
| `ARCHITECTURE.md` | Stack, data flow, the render+input rock, risks |
| `spike-ghostty-vt/` | **Verified** libghostty-vt-in-Rust spike — the terminal engine proof |
| `roadmap.json` / `roadmap.html` | The plan as a rockmap board — open `roadmap.html` in a browser |
| `ghostty/config` | **The theme** — contrast-verified mono-ghost palette cmux inherits for terminal rendering |
| `spike/` | The editor-fidelity test — `cd spike && hx sample.tsx` (passed 2026-07-07; superseded by cmux's real inline VS Code, kept for reference) |
| `zellij/agent.kdl` | Earlier trial config — not deleted, not the shipped path. See `DECISIONS.md`. |
| `rockmap/` | Vendored [rockmap](https://github.com/jpoindexter/rockmap) (board generator) |
| `demo/cockpit-demo.html` | Early interactive mockup — superseded by the real cmux app |
| `docs/brainstorm/` | Design-phase mockups (platform options, approaches, tab models) |
| `docs/blind-spot-audit-2026-07-07.html` | 16-framework audit that caught the demo-replaced-the-trial drift |
| `docs/blind-audit-cmux-fork-decision-2026-07-07.html` | 16-framework audit of the fork-cmux decision — found cmux's chrome is config-themeable |
| `resources/superconductor-reference/` | Superconductor UX notes (settings-key feature map) + icon — signed binary removed, see `DECISIONS.md` |

Rebuild the board after editing `roadmap.json`:

```bash
node rockmap/build-roadmap.mjs roadmap.json roadmap.html
```
