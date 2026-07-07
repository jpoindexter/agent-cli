# PRD — agent cli

**One-liner:** A native macOS app that runs real coding agents (Claude Code, Codex) in real terminal panes — tabs = projects, a file rail, an inline editor — built on Ghostty's terminal engine, with none of the IDE chrome.

**Direction locked 2026-07-07** (see DECISIONS.md for the full trail): build our own app, leveraging open-source *components* (Ghostty's terminal engine, Tauri, CodeMirror) — not adopting a finished third-party app. cmux/Superconductor/hashmark were evaluated and are reference only. The core architecture (`libghostty-vt` in a Rust backend parsing a real pty) is **verified working** — see `spike-ghostty-vt/`.

## Problem

Jason works across 5-10 active projects — sometimes 3+ agent sessions on one project, sometimes one agent per project. Current setup is N separate VSCode windows, one per project: heavy, and none of it is the terminal CLI experience he actually likes. Existing tools each miss something: cmux (great, but someone else's app + can't fully own the look), zellij (static config, no "open a folder"), Superconductor (closed source, chat UI not real terminal), hashmark (his own, but reimplements the chat UI and shows one agent at a time).

## User

Jason. Solo dev, senior, 15yr, ND (dyslexia/ADHD/aphantasia). Needs concrete and testable over speculative; decides aesthetics by seeing, not describing (proven: rejected two color schemes before picking one by eye). Stack fluency: Node/ESM/TS, React, Tauri 2, Rust-adjacent (indx/hashmark/brutal all Tauri). **Not** a Swift/AppKit dev — a reason building native-in-Tauri beats forking a Swift app.

## v0 done criteria

**Done (one sentence): open the app, pick a project folder, and run a real `claude` session in a terminal pane that renders via libghostty-vt and takes keyboard input — it reads and feels like a real terminal.**

- [ ] The render+input loop is proven: pty → libghostty-vt → canvas paint → keyboard back to pty, in a real window, feeling like a real terminal (the one remaining unproven rock — the spike proved *parsing* only).
- [ ] Tauri app scaffold: native window, Rust backend, React frontend, IPC channel established.
- [ ] Folder picker → spawn `claude` in that cwd → one interactive terminal pane, fullscreen-TUI-clean (claude's own UI renders correctly).
- [ ] Survives: quit and relaunch reopens the last folder.

## In scope (v0)

- One native window, one folder, one live interactive terminal pane running a real agent.
- The full terminal pipeline (pty ↔ libghostty-vt ↔ canvas ↔ input) as a reusable component.

Everything else — tabs, multiple panes, file rail, editor, worktrees — is v1+ (see ROADMAP). v0 is deliberately the single vertical slice that proves the whole thing works.

## Out of scope → PARKED.md

- Tabs / multi-project (v1)
- Multiple simultaneous panes / grid (v1)
- File rail + preview (v2)
- Inline editor pane (v2)
- Worktree helper (v3)
- Windows/Linux (macOS first; Tauri makes this portable later, not now)

## Constraints

- **Stack locked** (DECISIONS.md 2026-07-07): Tauri 2 + React/TS/Vite frontend + Rust backend; `libghostty-vt` terminal engine; `portable-pty`; CodeMirror 6 for the eventual editor. Switching before v0 ships = "yes, throw away the work."
- Toolchain: Zig **pinned to 0.15.2** (Homebrew default 0.16.0 breaks the libghostty-vt build). Documented in `spike-ghostty-vt/README.md`.
- Must coexist with Jason's existing projects (indx, brutal, hashmark, prova, gripe, lint) without touching their git state.
- Ship ugly first: no theming, animation, settings UI, or empty-states polish until the core loop works end-to-end.

## Non-goals

- Not a general-purpose terminal emulator (it hosts agents; it's not iTerm).
- Not reimplementing the agent UI — panes run the *real* `claude`/`codex` TUI in a real pty. The app is the cockpit around them, never a chat-UI replacement.
- Not a from-scratch VT parser — that's what libghostty-vt is for.
- Not multi-platform, multi-user, or plugin-capable before there's a real daily-use track record.
