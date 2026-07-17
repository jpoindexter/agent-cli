import type { ComponentProps, ReactNode } from "react";
import type { QuickOpenDialog } from "./QuickOpenDialog";
import type { WorktreeLabelDialog } from "./WorktreeLabelDialog";
import type { agentConversationPanelPropsFrom } from "./agentConversationPanelHost";
import type { appRuntimeMenusFrom } from "./appRuntimeMenuHost";
import type { appRuntimeDialogsPropsFrom } from "./appRuntimeDialogsHost";
import type { appSettingsHostPropsFrom } from "./appSettingsHostProps";
import type { deriveAppSurfaceLabels } from "./appSurfaceLabels";
import type { bottomUtilityTrayPropsFrom } from "./bottomUtilityTrayHost";
import type { draftNavigationPropsFrom } from "./draftNavigationHost";
import type { searchDialogPropsFrom } from "./searchCommandDialogHost";
import type { transcriptsModalPropsFrom } from "./transcriptsModalHost";
import type { useAppShellDomain } from "./useAppShellDomain";
import type { workbenchDockPanelsPropsFrom } from "./workbenchDockPanelsHost";
import type { workbenchEditorSectionPropsFrom } from "./workbenchEditorSectionHost";
import type { workspaceSideRailPropsFrom } from "./workspaceSideRailHost";

type DraftInput = Parameters<typeof draftNavigationPropsFrom>[0];
type HostInput = Omit<Parameters<typeof workspaceSideRailPropsFrom>[0], "drawerActiveTitle">
  & Parameters<typeof workbenchDockPanelsPropsFrom>[0]
  & Parameters<typeof workbenchEditorSectionPropsFrom>[0]
  & Parameters<typeof agentConversationPanelPropsFrom>[0]
  & Omit<Parameters<typeof bottomUtilityTrayPropsFrom>[0], "defaultTerminalLaunchProfile" | "paste">
  & Parameters<typeof appSettingsHostPropsFrom>[0]
  & Parameters<typeof appRuntimeDialogsPropsFrom>[0];

export type AppWorkbenchViewInput = HostInput & {
  appMenuAssembly: ReturnType<typeof appRuntimeMenusFrom>["appMenuAssembly"];
  chatSearch: { error: string | null; loading: boolean };
  commandPalette: Parameters<typeof searchDialogPropsFrom>[0] & {
    open: boolean; openDialog: () => void;
  };
  contextMenuElement: ReactNode;
  editorNavigation: HostInput["editorNavigation"] & {
    cancelNavigation: DraftInput["cancel"];
    discardAndContinue: DraftInput["discard"];
    draftDialogError: DraftInput["error"];
    pendingNavigation: unknown;
    saveAndContinue: DraftInput["save"];
  };
  paneTranscripts: Parameters<typeof transcriptsModalPropsFrom>[0];
  projectCreationOpen: boolean;
  projectSessionNavigationActions: HostInput["projectSessionNavigationActions"] & {
    createSession: (root: string) => Promise<unknown>;
  };
  quickOpen: ComponentProps<typeof QuickOpenDialog>["controller"];
  setProjectCreationOpen: (open: boolean) => void;
  settingsRuntime: ReturnType<typeof useAppShellDomain>["settingsRuntime"];
  surfaceLabels: ReturnType<typeof deriveAppSurfaceLabels>;
  visiblePaletteCommands: Parameters<typeof searchDialogPropsFrom>[1]["commands"];
  worktreeLabelDialog: ComponentProps<typeof WorktreeLabelDialog>;
};
