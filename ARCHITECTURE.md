# ARCHITECTURE — agent cli

The technical design that doesn't fit the one-page PRD. Stack is locked (DECISIONS.md 2026-07-07).

## Stack

| Layer | Choice | Why |
|---|---|---|
| Shell | Tauri 2 | Native window, tiny footprint, Rust backend. Jason's stack (indx/hashmark/brutal). |
| Frontend | React + TypeScript + Vite | Matches existing projects; the chrome (sidebar/tabs/panes) is genuinely just UI. |
| Terminal engine | `libghostty-vt` 0.2.0 (Rust) | Ghostty's *actual* parsing engine, extracted for embedding. Real VT/xterm correctness without reinventing it. **Verified** (`spike-ghostty-vt/`). |
| PTY | `portable-pty` | Real ptys hosting real `claude`/`codex` processes. Verified. |
| Terminal render | Canvas 2D (v0) | Ship-ugly. WebGL only if perf demands it (measure first). |
| Editor (v2) | CodeMirror 6 | Lighter than Monaco, good for an inline pane, real syntax highlighting. |
| State | React state / Zustand | Keep it boring for v0. |
| Persistence | `tauri-plugin-sql` (SQLite) | Sessions + open folders. Matches hashmark's proven pattern. |

## Data flow (one pane)

```
[agent process: claude / codex]
      ↕  stdin / stdout over pty
[portable-pty master]  ────────────────┐
      ↓ raw bytes (incl. ANSI)         │  RUST BACKEND (Tauri)
[libghostty-vt Terminal::vt_write]     │
      → cell grid state (chars +       │
        fg/bg/style per cell)          │
      ↓ serialize (dirty cells)        │
──────────── Tauri IPC event ──────────┘
      ↓
[canvas renderer]  ────────────────────┐
      → pixels                          │  REACT FRONTEND
[keyboard / mouse capture]              │
      ↑ encode via libghostty-vt key.rs │
──────────── Tauri command ────────────┘
      ↑
[portable-pty master write] → agent stdin
```

**Ownership boundary:** backend owns ptys + terminal state; frontend owns rendering + input capture; IPC is the seam. Per pane: one pty + one `Terminal` instance + one render surface.

## The one remaining rock: the render+input loop

The spike proved **parsing** (bytes → correct cell grid). It did **not** prove:
1. **Rendering** the cell grid to pixels on a canvas at terminal speed.
2. **Input** roundtrip — keyboard → escape sequences → pty → process reacts.
3. **Fullscreen TUI** correctness — `claude`'s own alt-screen UI (not just line output) rendering right.
4. **Performance** under fast output (big build logs) and rapid redraws (TUI repaint).

**This is the first slice, before any app scaffolding.** If the loop doesn't feel like a real terminal, nothing built on top matters. See ROADMAP v0 → SPIKE-2.

### Rendering approach (v0)
- Canvas 2D, monospace grid. Each cell: glyph + fg/bg. Redraw dirty cells only (libghostty-vt exposes cell state; diff against last frame).
- Batch on `requestAnimationFrame` — don't repaint per byte; coalesce backend updates into one frame.
- IPC payload: start with full-grid snapshots for correctness; move to dirty-region deltas if the snapshot is too heavy. Measure before optimizing.

### Input approach (v0)
- Capture keydown on the focused pane's canvas. Encode via libghostty-vt's `key.rs` (handles ctrl/alt/arrows/function keys, kitty keyboard protocol, bracketed paste).
- Send encoded bytes to the pty master over a Tauri command.

## Concurrency (v1+, note now)
N panes = N ptys + N `Terminal` instances + N render loops. Each pty read runs on its own backend task; frontend renders only the visible/focused panes at full rate, throttles background panes. Watch memory/CPU with many agents — a real risk at Jason's "3+ agents per project" usage.

## Known risks

| Risk | Severity | Mitigation |
|---|---|---|
| Render pipeline can't keep up with fast output / TUI redraws | **High — it's the rock** | Prove in SPIKE-2 before scaffolding; dirty-region diffing; rAF batching; measure early |
| Input fidelity (every key/mod/escape right) | Med-high | Lean on libghostty-vt `key.rs`; test against `claude`'s real TUI, vim, arrow keys, ctrl-c |
| Zig 0.15.2 pin (build breaks on 0.16) | Med (setup friction) | Documented; `zig@0.15` scoped to build; pin in any CI |
| libghostty-vt is v0.2.0, young, API may churn | Med | Pin the version; the spike already caught one API shape (`graphemes` on `GridRef` not `Cell`) |
| Many concurrent panes exhaust memory/CPU | Med (v1+) | Throttle non-focused panes; measure at 3-4 agents |
| Scope creep (this is a big app) | **High — session history proves it** | v0 is ONE pane. Tabs/rail/editor are parked. Enforce hard. |
