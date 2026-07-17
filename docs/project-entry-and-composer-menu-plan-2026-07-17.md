# Project entry and composer menu plan

Date: 2026-07-17
Reference: six Codex Desktop captures supplied by Jason
Roadmap sequence: `PROJECT-ENTRY-CONTRACT` through `PROJECT-ENTRY-NATIVE-QA`

## Problem

Keelhouse can already open a folder with `Cmd+O`, restore recent folders, switch persisted open projects, create project chats, create worktrees, and open a small composer add menu. Those paths are fragmented across the project rail, command palette, context menus, settings, and composer. They also alternate between **folder**, **workspace**, and **project**, so the product does not visibly answer three basic questions:

1. How do I create or open a project?
2. How do I start another task in the current project?
3. What does the composer `+` button contain?

The fix is one shared project-entry/action contract surfaced through several obvious doors. Internal persistence may keep `workspace` naming; user-facing copy uses **Project** consistently.

## Reference matrix

| Codex reference | Keelhouse state on 2026-07-17 | Planned owner |
|---|---|---|
| Persistent **New task** with `Cmd+N` | Titlebar can create a chat only when a project is active; Threads has no persistent create control | `PROJECT-NEW-TASK` |
| Searchable branch picker + **Create and checkout new branch** | Branch is visible metadata; Git/worktree commands exist elsewhere | `COMPOSER-TARGET-MENUS` |
| **Start in** menu: local/worktree/remote and usage | Local/worktree execution exists, but not as a composer target menu; cloud/usage is provider-owned | `COMPOSER-TARGET-MENUS`; unsupported remote rows stay absent rather than fake |
| Searchable projects + **New project** + no-project choice | Open projects and recents exist, but no searchable picker and no new-project creation flow | `PROJECT-SWITCHER`, `PROJECT-CREATE-FLOW`; cwd-less chat is explicitly deferred |
| First-use prompt surface bound to the selected project | Empty Threads says only “Open a folder”; center state does not lead project entry | `PROJECT-FIRST-USE` |
| Composer `+` menu for attachments, modes, goals, and integrations | A four-row context menu exists for files/current file/browser/parallel chats | `COMPOSER-PLUS-MENU` |

## Product contract

### Shared actions

- **New Project…** asks for a parent folder and project name, validates the name, creates the folder, optionally initializes Git through an explicit control, opens it, persists it in recents/open projects, and creates its first task.
- **Open Project…** uses the native directory picker and the existing guarded workspace-open lifecycle. Cancelling changes nothing.
- **New Task** creates and selects a fresh chat in the active project. With no active project, it opens the project switcher instead of failing silently.
- **Switch Project** searches open and recent projects, marks the current project, and routes every selection through the existing guarded project-open lifecycle.

All doors call these shared actions. No sidebar-only, palette-only, or menu-only variants may fork the behavior.

### Persistent placement

- Threads toolbar: labeled **New task** control with `Cmd+N`, plus a project-switcher trigger.
- First-use Threads state: primary **Open Project…**, secondary **New Project…**.
- Composer context strip: project, execution target, and branch are buttons with menus, not static status text.
- Command palette and macOS File menu: **New Project…**, **Open Project…**, **New Task**, and **Switch Project…**.

### Project switcher

- Search field receives focus on open.
- Open projects precede recent projects; canonical paths deduplicate the two lists.
- Current project has a checkmark; missing recent paths are pruned using the existing recovery path.
- Footer actions are **New Project…** and **Open Project…**.
- Escape closes and returns focus to the trigger; arrow keys and Enter operate the active row.

Keelhouse will not copy Codex's **Don't work in a project** row yet. Structured chat, file context, terminal cwd, Git, browser detection, and persistence currently assume a project root. A separate future `NO-PROJECT-CHAT` card records that contract change instead of pretending it works.

### Composer `+` menu

Use a purpose-built accessible popover rather than the current generic context-menu geometry. Keep it compact and group only real actions:

- **Add**: Files and folders, Current editor file, Browser preview.
- **Task**: Set or review goal, Run parallel child chats.
- **Connections**: Manage providers and MCP servers.

Rows expose disabled reasons, not silent dead controls. Plan mode, Finder control, plugin rows, cloud execution, and usage rows appear only after Keelhouse owns the corresponding real behavior; visual imitation is not acceptance.

### Composer target menus

- Project button opens the shared project switcher.
- Local/worktree button shows **Work locally** and existing worktrees, plus **New worktree…** through the real worktree path.
- Branch button searches local branches and can create/check out a branch through a new guarded native Git command. Dirty-worktree/error feedback remains scoped and recoverable.
- Provider usage or remote execution is shown only when a provider adapter supplies truthful data/capability.

## State and failure behavior

- First use, user-cleared project list, picker cancellation, missing recent path, duplicate project name, invalid project name, directory creation failure, Git initialization failure, dirty branch switch, and project-open failure each receive distinct outcomes.
- Creating the folder and failing optional `git init` must not delete the new folder. The error offers **Open without Git** and **Retry Git initialization**.
- Project switching preserves the existing dirty-draft and active-process guards.
- Async controls show inline busy state and remain single-submit.

## Accessibility and interaction requirements

- Native `button`, `input`, and dialog/menu semantics; no clickable `div` rows.
- Full keyboard operation, visible focus, logical focus return, Escape close, and no keyboard trap.
- Minimum 44×44 pointer targets for persistent toolbar actions; compact menu rows retain at least 32px height and a full-width hit area.
- Labels remain visible where the action is foundational; icons supplement rather than replace **New task**, **New Project…**, and **Open Project…**.
- Status announcements cover create/open success and failure without moving focus unexpectedly.

## Ordered delivery and proof

1. `PROJECT-ENTRY-CONTRACT` — shared typed actions and consistent product vocabulary.
2. `PROJECT-CREATE-FLOW` — real local project creation and optional Git initialization.
3. `PROJECT-SWITCHER` — searchable open/recent project menu and footer actions.
4. `PROJECT-NEW-TASK` — persistent Threads action and `Cmd+N` routing.
5. `COMPOSER-PLUS-MENU` — accessible grouped menu using real actions.
6. `COMPOSER-TARGET-MENUS` — clickable project/local-worktree/branch controls.
7. `PROJECT-FIRST-USE` — intentional no-project and project-ready entry states.
8. `PROJECT-ENTRY-NATIVE-QA` — multi-door parity, responsive screenshots, accessibility, and signed-app execution.

Each behavior starts with a focused failing test. Each card remains open until its user-visible path runs in a freshly built native app. The final gate also runs:

```bash
cd app
npm run build
npm run qa:module-size
npm run qa:chrome-contract
npm test -- --run
cargo test --manifest-path src-tauri/Cargo.toml
git diff --check
```

`NO-PROJECT-CHAT` stays later and is not a prerequisite for the project-entry sequence.
