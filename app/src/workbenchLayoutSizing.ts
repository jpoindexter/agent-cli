import type { CSSProperties } from "react";

import { DEFAULT_WORKBENCH_SIZING } from "./workbenchLayout";
import type { WorkbenchLayoutMode, WorkbenchSizing } from "./workbenchLayout";
import { clamp } from "./workbenchLayoutStorage";

export type WorkbenchResizeKind = "tray" | "tools";

type WorkbenchRect = Pick<DOMRect, "bottom" | "height" | "left" | "right" | "top" | "width">;

export const workbenchShellStyles = (
  sizing: WorkbenchSizing,
  viewportWidth: number,
  sideDrawerWidth: number,
  sideDrawerCollapsed: boolean,
) => {
  const drawerWidth = sideDrawerCollapsed ? 0 : sideDrawerWidth;
  const dockWidth = sizing.trayPercent === DEFAULT_WORKBENCH_SIZING.trayPercent
    ? 430
    : Math.max(240, (viewportWidth - drawerWidth - 1) * (sizing.trayPercent / 100));
  return {
    appShellStyle: {
      "--side-drawer-width": `${drawerWidth}px`,
      "--titlebar-leading-width": `${sideDrawerCollapsed ? 216 : sideDrawerWidth}px`,
      "--dock-width": `${dockWidth}px`,
    } as CSSProperties,
    workbenchStyle: {
      "--tool-tray-size": `${sizing.trayPercent}%`,
      "--tool-primary-size": `${sizing.toolSplitPercent}%`,
    } as CSSProperties,
  };
};

export const resizeWorkbenchSizing = (
  kind: WorkbenchResizeKind,
  layout: WorkbenchLayoutMode,
  current: WorkbenchSizing,
  rect: WorkbenchRect,
  clientX: number,
  clientY: number,
): WorkbenchSizing => {
  if (kind === "tray") {
    const next = layout === "right"
      ? ((rect.right - clientX) / rect.width) * 100
      : layout === "left"
        ? ((clientX - rect.left) / rect.width) * 100
        : ((rect.bottom - clientY) / rect.height) * 100;
    return { ...current, trayPercent: clamp(next, 18, 54) };
  }
  const next = layout === "bottom"
    ? ((clientX - rect.left) / rect.width) * 100
    : ((clientY - rect.top) / rect.height) * 100;
  return { ...current, toolSplitPercent: clamp(next, 25, 75) };
};

export const nudgeWorkbenchSizing = (
  kind: WorkbenchResizeKind,
  layout: WorkbenchLayoutMode,
  current: WorkbenchSizing,
  key: string,
): WorkbenchSizing => {
  const delta = key === "ArrowRight" || key === "ArrowDown" ? 3 : -3;
  if (kind === "tray") {
    const direction = layout === "left" || layout === "bottom" ? delta : -delta;
    return { ...current, trayPercent: clamp(current.trayPercent + direction, 18, 54) };
  }
  const direction = layout === "bottom"
    ? key === "ArrowRight" ? 3 : key === "ArrowLeft" ? -3 : 0
    : key === "ArrowDown" ? 3 : key === "ArrowUp" ? -3 : 0;
  return { ...current, toolSplitPercent: clamp(current.toolSplitPercent + direction, 25, 75) };
};
