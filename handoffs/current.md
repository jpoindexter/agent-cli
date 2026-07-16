# Handoff: Claude Session Continuation

Date: 2026-07-16 (updated in-session)
Project: `/Users/jasonpoindexter/Documents/GitHub/apps/agent cli`
From: Claude (Fable 5 session, 16 slices)
To: Next session

## Goal

Unchanged from the Codex handoff: complete every open roadmap card in build order,
starting with `MODULARITY-300-200-50`. Strict TDD per slice, full gate before every push,
never close a card without executing its real Done criterion.

## Current State

- Branch: `main`, clean. Pushed checkpoint: `56fc711 refactor: extract tools layout toggle policy`.
- All gates green at `56fc711`: build=0, module-size ratchet=0, chrome-contract=0,
  **244 test files / 760 tests**, `git diff --check`=0. Vitest now uses the forks pool
  (flake fix, ERRORS.md 2026-07-16) — no rerun ritual needed.
- Module baseline:

```json
{
  "app/src/App.tsx": { "lines": 2082, "longFunctions": 1, "maxFunctionLines": 1855 }
}
```

Session start was 2844 / 2558. Sixteen slices extracted (all pushed, one commit each):
terminalProcessActionsController, editorViewLifecycle, workspaceBootstrapController,
WorkspaceSideRail, appMenuAssembly, commandPaletteAssembly, settingsConnectionActionsController,
editorFileUtilityActions, projectSessionMetadataActions, editorReviewNavigation,
editorSurfaceActions (consolidation), agentHookIntegration, AgentConversationPanel,
terminalClipboardActions, useContextMenuHost (first state-owning hook),
terminalSurfaceController (consolidation of pane+process+clipboard),
workspaceOpenSurface (target+lifecycle+actions with owned Tauri adapters),
chatRunControls, composerSurfaceController (app-command+submit+orchestration+child actions),
composerHistoryNavigation, utilityTrayControls, terminalPaneRename, projectChatStatus,
editorFileWorkflowSurface, workspaceFileActionsSurface, sessionCheckpointSurface,
projectSessionMenuSurface, WorkbenchEditorSection, renderPerfExport, devServerDetectionSurface,
paneTranscriptCapture, orchestrationDialogState, settingsAgentProfileOptions, appSurfaceLabels,
appSettingsHost, WorkbenchDockPanels, shellProfileNotice, WorkbenchShell (slot-based app shell),
browserPreviewHost (+ drawer mapping), quickSettingsHost, composerMentionQuery, projectRailView,
activePaneDisplayLabel, fileTreeTypes helpers, vitest forks pool, terminalPaneFinalize,
chatSearchNavigation, sessionSnapshotCapture (+restore), composerHarnessEvents, workspacePicker,
paneActivityLog, terminalResize, connection saveSettings, searchCommandDialogHost,
transcriptsModalHost, statusBarHost (repo link + title), appTitlebarHost (tools toggle).
SIXTY slices total; every push behind the full five-part gate with explicit exit codes.

## Decisions carried forward

- Source-contract tests and chrome-contract rules follow moved code to its new owner
  (contextMenuCoverage.test.ts, runCards.test.ts, scripts/check-chrome-contract.mjs all updated this way).
- Consolidation pattern established twice (editorSurfaceActions, terminalSurfaceController):
  a `create<X>SurfaceActions(state, deps)` factory in its own file with `wire*` helpers ≤50 lines,
  App makes one call and aliases the outputs.
- Gate runs MUST check exit codes explicitly (`cmd > /dev/null; echo $?`) — piping through
  `tail` once masked a chrome-contract failure (slice 6, caught and fixed).
- Known flake: `SettingsWorkspace.interaction.test.tsx` failed once under parallel load,
  passes in isolation and on rerun. Log to ERRORS.md if it recurs.

## Next exact work (MODULARITY-300-200-50)

Cheap adapter extractions are exhausted. Remaining ~2150 lines in `App()` are:
1. DONE: workspace-open consolidation (`workspaceOpenSurface.ts`).
2. DONE: composer runtime consolidation (`composerSurfaceController.ts`);
   `logComposerHarnessEvent` and attachment actions still in App.
3. DONE: WorkbenchShell slot shell, WorkbenchEditorSection, WorkbenchDockPanels,
   AppSettingsHost, host mappings for browser/search/transcripts/status-bar/titlebar.
4. REMAINING (the hard part): App() is now ~1855-line hook-composition + option bags +
   grouped-prop slots. Emptying the baseline requires repackaging hook APIs into domain
   bundles (each hook returns one object App passes through, instead of destructured
   pieces re-wired into factory bags) and splitting App into ~8 useXxxDomain hooks that
   own their wiring. That is invasive multi-file work — plan it as its own arc with the
   consolidation pattern (editorSurfaceActions/terminalSurfaceController) as the template.
5. Then the packaged smoke (chat, trays, terminal, editor, browser, menus, session
   restore) before closing MODULARITY-300-200-50.

Done criterion (unchanged): empty violations object from
`node scripts/check-module-size.mjs --print-baseline`, focused+full tests green, packaged
smoke executing chat, trays, terminal, editor, browser, menus, session restore.

## Blockers requiring Jason

- `CHROME-EYEBALL-SIGNOFF` — human sign-off, never self-approve.
- Packaged-app smoke for closing MODULARITY (real `npm run tauri dev` / packaged run).

## Remaining open cards (build order)

Unchanged list of 17 from the original handoff; MODULARITY-300-200-50 is `now`, all others
after it. Read each card's `summary`/`done`/`progress` in `roadmap.json` before implementing.
