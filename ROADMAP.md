# ROADMAP — agent cli

Source of truth: `roadmap.json` → `roadmap.html` (rockmap board). Rebuild after editing:

```bash
node rockmap/build-roadmap.mjs roadmap.json roadmap.html
```

Sequential, not parallel — each slice gates the next. Ship ugly first. One feature end-to-end before the next.

## Done so far (research + verification — see DECISIONS.md)

- ~~OSS landscape survey~~ · ~~zellij trial (parked — wrong interaction model)~~ · ~~Superconductor/hashmark/cmux evaluated~~ · ~~editor-fidelity spike (PASS)~~ · ~~cmux fork-decision audit~~
- ~~**libghostty-vt spike — PASSED 2026-07-07.**~~ Real pty → real Ghostty parsing → correct cell readback (`spike-ghostty-vt/`). Proves the terminal *engine* choice.

## v0 — The core loop works (one folder, one live terminal pane)

The whole app in one vertical slice. If this works, everything else is composition; if it doesn't, nothing else matters.

1. **SPIKE-2: Render + input loop** *(the rock — do before scaffolding)*. Extend the spike: pty → libghostty-vt → **canvas paint** + **keyboard roundtrip** in a real window. Done = type in a canvas-rendered pane running a real shell, see output, arrow keys + ctrl-c work, `claude`'s fullscreen TUI renders correctly. This proves rendering + input + TUI + perf — the three things the parsing spike didn't.
2. **SCAFFOLD: Tauri 2 app**. Native window, React/Vite frontend, Rust backend, IPC channel wired. Nothing fancy — an empty window that can round-trip a message backend↔frontend.
3. **CORE: One agent pane**. Folder picker (native Tauri dialog) → spawn `claude` in that cwd → one interactive terminal pane using the SPIKE-2 pipeline. Persist the last folder; reopen it on relaunch.

**v0 done:** open the app, pick a folder, run `claude` in the pane, type and see output — feels like a real terminal.

## v1 — Cockpit shape (tabs + multiple panes)

- Tabs = projects (add/switch folders, multi-project in one window)
- Multiple panes per tab in a grid, each its own pty/agent
- Pane focus, new pane (`n`), close pane (`x`)
- mono-ghost theme applied (palette already approved, `ghostty/config`)
- Session persistence (reopen tabs + panes where you left off)

## v2 — The rail and the editor

- File tree rail (yazi-style) with inline preview
- Double-click a file → CodeMirror editor pane, inline in the grid (real syntax highlighting — the "looks like VSCode's editor" requirement, built directly)
- Git status indicators in the rail

## v3 — Worktrees + whatever real use surfaces

- Worktree helper: one keystroke = new git worktree + agent launched in it (the "3 agents on one repo, parallel" workflow)
- Polish, settings, empty states — only what daily use proves necessary
