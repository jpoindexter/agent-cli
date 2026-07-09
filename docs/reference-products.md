# Reference Products

Use these products as references for Keelhouse, not as copy targets. The goal is to preserve Jason's actual workflow: agent conversation and supervision first, with files, editor, browser, terminal, git, and settings available as movable work trays.

## Closest References

1. **[Zed](https://github.com/zed-industries/zed)** is the closest product-shape reference. Its [Agent Panel](https://zed.dev/docs/ai/agent-panel), [Parallel Agents](https://zed.dev/docs/ai/parallel-agents), [Terminal Threads](https://zed.dev/docs/ai/terminal-threads), and [External Agents](https://zed.dev/docs/ai/external-agents) map directly to Keelhouse. The key inversion: Zed is still a high-performance code editor with strong AI surfaces; Keelhouse should be an agent cockpit where the agent thread is primary and the editor/browser/terminal are trays.
2. **[ConstellAgent](https://github.com/owengretzinger/constellagent)** is the closest item in [`awesome-agent-orchestrators`](https://github.com/andyrewlee/awesome-agent-orchestrators) by stated surface: a macOS app where multiple AI agents each have terminal, editor, and git worktree context.
3. **[herdr](https://github.com/ogulcancelik/herdr)** is the closest terminal/session mechanics reference: real terminal panes, persistent workspaces/tabs/panes, agent status detection, and jump-to-attention behavior.
4. **[parallel-code](https://github.com/johannesjo/parallel-code)** is the closest worktree/review workflow reference: isolated git worktrees, multiple agents, built-in diff review, and one-click merge.
5. **[Clave](https://github.com/codika-io/clave)** is a useful native macOS session-layout reference for multiple Claude Code sessions, split/grid layouts, session groups, remote sessions, and usage visibility.

## What To Borrow

- Project-grouped thread/session sidebar with status, search, history/archive, and fast switching.
- Agent panel as the primary surface, with streaming activity, context attachments, stop/send, permission mode, and review-changes flow.
- Terminal-thread mode for real CLI/TUI agents, where the CLI owns auth, model config, subscriptions, tools, skills, and native config.
- External-agent protocol boundary for future direct integrations; ACP is worth tracking, but Keelhouse v1 remains real-pty first.
- Worktree isolation and diff review once the local multi-pane loop is reliable.

## What Not To Borrow

- Full editor-first IDE posture, LSP/debugger/task breadth, extension marketplace, collaboration/account/billing surfaces, or novelty chat features.
- Broad cloud/team orchestrator scope from the awesome list: Kanban, org charts, remote fleets, Kubernetes pods, issue trackers, and phone dashboards are outside the lean local cockpit.
- Decorative side rails or copied chrome that does not operate real drawer content.

## Product Guardrail

If a reference feature makes the code editor the default center, invert it before adopting it. Keelhouse's default center is the selected agent session: prompt/composer, visible activity, approval/review, and raw terminal escape hatch. Files, editor, browser, git, search, and settings surround that center as resizable drawers or trays.
