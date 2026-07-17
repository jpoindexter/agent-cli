import { WorkbenchShell } from "./WorkbenchShell";
import { AppMainSlot, AppRailSlot, AppTitlebarSlot } from "./AppWorkbenchMain";
import { AppWorkbenchOverlays } from "./AppWorkbenchOverlays";
import type { AppWorkbenchViewInput } from "./appWorkbenchViewTypes";

export const AppWorkbenchView = (input: AppWorkbenchViewInput) => <WorkbenchShell
  handlers={{
    beginSideDrawerResize: input.shellLayout.beginSideDrawerResize,
    hideTools: () => input.shellLayout.setWorkbenchLayout("hidden"),
    nudgeSideDrawerResize: input.shellLayout.nudgeSideDrawerResize,
    setToolTrayMode: input.shellLayout.setToolTrayMode,
  }}
  layout={{
    appShellStyle: input.shellLayout.appShellStyle,
    renderedWorkbenchLayout: input.shellLayout.renderedWorkbenchLayout,
    settingsOpen: input.settingsOpen,
    sideDrawerCollapsed: input.shellLayout.sideDrawerCollapsed,
    surfaceMode: input.shellLayout.agentSurfaceMode,
    toolTrayMode: input.shellLayout.toolTrayMode,
    utilityTrayHeight: input.shellLayout.utilityTrayHeight,
    workbenchStyle: input.shellLayout.workbenchStyle,
  }}
  refs={{ workbenchRef: input.shellLayout.workbenchRef }}
  slots={{
    titlebar: <AppTitlebarSlot input={input} />,
    rail: <AppRailSlot input={input} />,
    main: <AppMainSlot input={input} />,
    overlays: <AppWorkbenchOverlays input={input} />,
  }}
/>;
