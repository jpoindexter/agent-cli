export type WorkbenchLayoutMode = "left" | "right" | "bottom" | "hidden";
export type ToolTrayMode = "split" | "editor" | "browser";

export type WorkbenchSizing = {
  trayPercent: number;
  toolSplitPercent: number;
};

export const DEFAULT_WORKBENCH_LAYOUT: WorkbenchLayoutMode = "right";
export const DEFAULT_TOOL_TRAY_MODE: ToolTrayMode = "editor";
export const DEFAULT_WORKBENCH_SIZING: WorkbenchSizing = { trayPercent: 30, toolSplitPercent: 58 };
export const DEFAULT_SIDE_DRAWER_WIDTH = 260;

export const effectiveWorkbenchLayout = (layout: WorkbenchLayoutMode, viewportWidth: number) => {
  if (layout === "left" || layout === "right") {
    return viewportWidth < 1200 ? "bottom" : layout;
  }
  return layout;
};

export const usableAgentWidth = ({
  viewportWidth,
  drawerWidth,
  drawerCollapsed,
  layout,
  trayPercent,
}: {
  viewportWidth: number;
  drawerWidth: number;
  drawerCollapsed: boolean;
  layout: WorkbenchLayoutMode;
  trayPercent: number;
}) => {
  const mainWidth = viewportWidth - (drawerCollapsed ? 52 : drawerWidth);
  return layout === "left" || layout === "right" ? mainWidth * (1 - trayPercent / 100) : mainWidth;
};
