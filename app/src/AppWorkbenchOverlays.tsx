import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AppRuntimeDialogs } from "./AppRuntimeDialogs";
import { AppSettingsHost } from "./appSettingsHost";
import { DraftNavigationDialog } from "./DraftNavigationDialog";
import { ProjectCreationDialog } from "./ProjectCreationDialog";
import { QuickOpenDialog } from "./QuickOpenDialog";
import { SearchCommandDialog } from "./SearchCommandDialog";
import { StatusBar } from "./StatusBar";
import { TranscriptsModal } from "./TranscriptsModal";
import { WorktreeLabelDialog } from "./WorktreeLabelDialog";
import { appRuntimeDialogsPropsFrom } from "./appRuntimeDialogsHost";
import { appSettingsHostPropsFrom } from "./appSettingsHostProps";
import type { AppWorkbenchViewInput } from "./appWorkbenchViewTypes";
import { draftNavigationPropsFrom } from "./draftNavigationHost";
import { projectCreationCommands } from "./projectCreationCommands";
import { searchDialogPropsFrom } from "./searchCommandDialogHost";
import { shortcutKeys } from "./shortcuts";
import { sourceRepoStatusTitleFrom, statusBarRepoPropsFrom } from "./statusBarHost";
import { transcriptsModalPropsFrom } from "./transcriptsModalHost";

type ViewProps = { input: AppWorkbenchViewInput };

const AppProjectDialogs = ({ input }: ViewProps) => <>
  <ProjectCreationDialog
    open={input.projectCreationOpen}
    onClose={() => input.setProjectCreationOpen(false)}
    onCreateProject={projectCreationCommands.create}
    onInitializeGit={projectCreationCommands.initializeGit}
    onOpenProject={input.projectSessionNavigationActions.createSession}
    onPickParent={async () => {
      const parent = await open({ directory: true });
      return typeof parent === "string" ? parent : null;
    }}
  />
  <WorktreeLabelDialog {...input.worktreeLabelDialog} />
  <AppRuntimeDialogs {...appRuntimeDialogsPropsFrom(input)} />
</>;

const AppCommandDialogs = ({ input }: ViewProps) => {
  const draftProps = draftNavigationPropsFrom({
    cancel: input.editorNavigation.cancelNavigation,
    discard: input.editorNavigation.discardAndContinue,
    error: input.editorNavigation.draftDialogError,
    hasPendingNavigation: Boolean(input.editorNavigation.pendingNavigation),
    save: input.editorNavigation.saveAndContinue,
    saving: input.editorSession.editorSaving,
    selectedFile: input.editorSession.selectedFile,
  });
  return <>
    {input.commandPalette.open ? <SearchCommandDialog {...searchDialogPropsFrom(input.commandPalette, {
      commands: input.visiblePaletteCommands, error: input.chatSearch.error,
      loading: input.chatSearch.loading, shortcut: shortcutKeys("chrome.command-palette"),
    })} /> : null}
    <QuickOpenDialog
      controller={input.quickOpen}
      shortcut={shortcutKeys("workspace.quick-open")}
      workspacePath={input.workspacePath}
      onOpenFile={(file) => void input.editorFileWorkflow.requestOpen(file, { focusEditor: true })}
    />
    {draftProps ? <DraftNavigationDialog {...draftProps} /> : null}
  </>;
};

const AppStatus = ({ input }: ViewProps) => <StatusBar
  workspaceName={input.surfaceLabels.activeWorkspaceName}
  primarySurfaceState={input.surfaceLabels.primarySurfaceState}
  primarySurfaceLabel={input.surfaceLabels.primarySurfaceLabel}
  primarySurfaceStatusLabel={input.surfaceLabels.primarySurfaceStatusLabel}
  {...statusBarRepoPropsFrom(input.settingsRuntime.repoLocation, openUrl)}
  repoTitle={sourceRepoStatusTitleFrom(
    input.settingsRuntime.repoLocation, input.settingsRuntime.sourceControlStatus,
  )}
  surfaceMode={input.shellLayout.agentSurfaceMode}
  utilityLabel={input.surfaceLabels.utilityTrayStatusLabel}
/>;

export const AppWorkbenchOverlays = ({ input }: ViewProps) => <>
  <AppSettingsHost {...appSettingsHostPropsFrom({ ...input, openUrl })} />
  <TranscriptsModal {...transcriptsModalPropsFrom(input.paneTranscripts, {
    projectId: input.workspacePath, projectSessionId: input.activeChat.activeSessionId,
  })} />
  <AppProjectDialogs input={input} />
  {input.contextMenuElement}
  <AppCommandDialogs input={input} />
  <AppStatus input={input} />
</>;
