# Navigation Parity Scope

Codex's sidebar is a useful reference for density and grouping, but this app should translate "chats" into project work sessions.

## Keep / Translate

| Codex sidebar item | agent cli equivalent | Scope |
| --- | --- | --- |
| New chat | New session | Create a named project session with default editor/browser/pane layout and one selected agent profile. |
| Search | Search | Global search across projects, files, commands, sessions, and terminal transcripts when available. |
| Projects | Projects | Persistent left rail of open/recent project folders with active/running/exited/attention badges. |
| Chat rows under projects | Project sessions | Task-scoped work contexts: editor tabs, browser URL, agent panes, pane names/status, and transcript references. |
| Show more | Show more | Collapse old sessions per project; keep the rail dense. |
| Active chat highlight | Active session highlight | Clear selected project/session state with visible focus and status. |

## Drop / Rename

| Codex sidebar item | Decision |
| --- | --- |
| Plugins | Drop. No plugin marketplace or arbitrary extension host. |
| Bottom account/profile area | Drop as account UX. Replace with local app/settings/status entry if needed. |
| Generic "New chat" labels | Rename to task/session labels; default names should be editable and derived from context. |

## Park

| Codex sidebar item | Possible future equivalent |
| --- | --- |
| Scheduled | Scheduled/background agent runs, only after session restore and agent hooks are real. |
| Archived chat list | Session archive/transcripts, only after project sessions and transcript capture ship. |

## Done Criteria

- The left rail can show multiple projects and nested sessions without needing separate app windows.
- Selecting a session restores that task's project, editor tabs, browser preview URL, pane layout, pane labels/status, and transcript references.
- Running/exited/attention-needed state is visible at both project and session rows.
- Sessions are not editor file tabs and not custom chat threads; they are task-scoped workbench states.
