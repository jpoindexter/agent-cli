# Workbench State Guards (WORKBENCH-STATE-GUARDS, 2026-07-11)

Guards for cross-surface state named by the 2026-07-11 blind audit. Two are enforced by construction and documented here as invariants; two shipped as changes.

## 1. Aggregate status is derived, not incrementally flipped (by construction)

Every `pane-exit` and restart re-derives project/session status from the full post-update pane list (`terminalPaneProjectStatus(nextPanes)` in the pane-exit listener). Concurrent exits cannot leave a stale aggregate because no handler flips a status flag independently of the list. Invariant: any future status producer must derive from the pane list, never patch a stored aggregate.

## 2. Pane project == editor project (invariant, banner deferred)

The current architecture cannot produce a pane/editor project mismatch: editor file access is validated against the canonical workspace root by the backend (`validate_workspace_file_path`), and project switches snapshot/restore editor tabs per project (PROJECT-RAIL/PROJECT-SESSIONS). The blind-audit's proposed mismatch warning banner therefore guards an unreachable state today and was NOT built (dead UI). Trigger to build it: the WORKTREE card (disposable worktrees introduce panes whose cwd is a worktree while the editor may show the parent repo) or any future multi-root feature. This invariant must be revisited in the WORKTREE design.

## 3. Titlebar project ownership (rule, no code needed today)

Ordering rule when surfaces could disagree: the focused pane's project owns the titlebar crumb; if no pane, the active editor's project; if neither, the most recently used open project. Today all three are structurally the active workspace (see guard 2), so the current implementation (crumb = active workspace) already satisfies the rule. Cite this rule when WORKTREE or multi-root work lands.

## 4. Activity-log overflow policy + Clear (shipped)

The durable activity log keeps at most 200 events (`MAX_AGENT_ACTIVITY_LOG_EVENTS`); overflow drops oldest-first (FIFO) at normalize/append time — this is deliberate and now documented. A `Clear` action in the Activity toolbar empties the current project-session's events (other sessions' history untouched) and persists immediately; clearing intentionally does not log itself.
