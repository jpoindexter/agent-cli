import { invoke } from "@tauri-apps/api/core";
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import { AgentConversationPanel } from "./AgentConversationPanel";
import { AppTitlebar } from "./AppTitlebar";
import { BottomUtilityTray } from "./BottomUtilityTray";
import { BrowserPreviewPanel } from "./BrowserPreviewPanel";
import { WorkbenchDockPanels } from "./WorkbenchDockPanels";
import { WorkbenchEditorSection } from "./WorkbenchEditorSection";
import { WorkbenchResizers } from "./WorkbenchResizers";
import { WorkspaceSideRail } from "./WorkspaceSideRail";
import { agentConversationPanelPropsFrom } from "./agentConversationPanelHost";
import { appTitlebarPropsFrom } from "./appTitlebarHost";
import type { AppWorkbenchViewInput } from "./appWorkbenchViewTypes";
import { bottomUtilityTrayPropsFrom } from "./bottomUtilityTrayHost";
import { browserPreviewPropsFrom } from "./browserPreviewHost";
import { defaultTerminalLaunchProfile } from "./launchProfiles";
import { workbenchDockPanelsPropsFrom } from "./workbenchDockPanelsHost";
import { workbenchEditorSectionPropsFrom } from "./workbenchEditorSectionHost";
import { workspaceSideRailPropsFrom } from "./workspaceSideRailHost";
import { drawerTitleFor } from "./drawerModes";

type ViewProps = { input: AppWorkbenchViewInput };

export const AppTitlebarSlot = ({ input }: ViewProps) => <AppTitlebar {...appTitlebarPropsFrom({
  activeSessionTitle: input.surfaceLabels.activeSessionTitle,
  newTask: input.projectEntryActions.newTask,
  openCommandPalette: input.commandPalette.openDialog,
  openSettings: () => input.setSettingsOpen(true),
  openWorkspaceFolder: openPath,
  renderedLayout: input.shellLayout.renderedWorkbenchLayout,
  resetInterface: input.shellLayout.resetInterface,
  setLayout: input.shellLayout.setWorkbenchLayout,
  setToolMode: input.shellLayout.setToolTrayMode,
  sideDrawerCollapsed: input.shellLayout.sideDrawerCollapsed,
  storedLayout: input.shellLayout.workbenchLayout,
  surfaceLabel: input.surfaceLabels.primarySurfaceLabel,
  surfaceState: input.surfaceLabels.primarySurfaceState,
  surfaceStatusLabel: input.surfaceLabels.primarySurfaceStatusLabel,
  terminalOpen: input.shellLayout.agentSurfaceMode === "terminal",
  toggleRawTerminal: input.utilityTrayControls.toggleRawTerminal,
  toggleSideDrawer: () => input.shellLayout.setSideDrawerCollapsed((collapsed) => !collapsed),
  toolMode: input.shellLayout.toolTrayMode,
  workspacePath: input.workspacePath,
})} />;

export const AppRailSlot = ({ input }: ViewProps) => <WorkspaceSideRail {...workspaceSideRailPropsFrom({
  ...input, drawerActiveTitle: drawerTitleFor(input.shellLayout.sideDrawerMode), openUrl,
})} />;

const AppWorkbenchTools = ({ input }: ViewProps) => <>
  <WorkbenchDockPanels {...workbenchDockPanelsPropsFrom(input)} />
  <WorkbenchEditorSection {...workbenchEditorSectionPropsFrom(input)} />
  <WorkbenchResizers
    layout={input.shellLayout.renderedWorkbenchLayout}
    onKeyDown={input.shellLayout.nudgeWorkbenchResize}
    onPointerDown={input.shellLayout.beginWorkbenchResize}
    sizing={input.shellLayout.workbenchSizing}
    trayMode={input.shellLayout.toolTrayMode}
  />
  <BrowserPreviewPanel {...browserPreviewPropsFrom(input.browser, {
    contextMenu: (event) => input.contextMenuHost.openContextMenu(
      event, input.appMenuAssembly.browserContextMenuItems(),
    ),
    openExternal: openUrl,
  })} />
</>;

const AppConversationStack = ({ input }: ViewProps) => <>
  <AgentConversationPanel {...agentConversationPanelPropsFrom(input)} />
  <BottomUtilityTray {...bottomUtilityTrayPropsFrom({
    ...input,
    defaultTerminalLaunchProfile,
    paste: (text) => { invoke("paste", { text }).catch(() => {}); },
  })} />
</>;

export const AppMainSlot = ({ input }: ViewProps) => <>
  <AppWorkbenchTools input={input} />
  <AppConversationStack input={input} />
</>;
