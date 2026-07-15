import { useEffect, useState } from "react";

import {
  DEFAULT_SIDE_DRAWER_WIDTH,
  DEFAULT_TOOL_TRAY_MODE,
  DEFAULT_WORKBENCH_LAYOUT,
  DEFAULT_WORKBENCH_SIZING,
} from "./workbenchLayout";
import type { ToolTrayMode, WorkbenchLayoutMode, WorkbenchSizing } from "./workbenchLayout";
import {
  readStoredSideDrawerCollapsed,
  readStoredSideDrawerWidth,
  readStoredToolTrayMode,
  readStoredWorkbenchLayout,
  readStoredWorkbenchSizing,
  workbenchStorageKeys,
} from "./workbenchLayoutStorage";

const useViewportWidth = () => {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return viewportWidth;
};

const usePersistWorkbenchLayout = (values: {
  layout: WorkbenchLayoutMode;
  sizing: WorkbenchSizing;
  toolTrayMode: ToolTrayMode;
  sideDrawerWidth: number;
  sideDrawerCollapsed: boolean;
}) => useEffect(() => {
  try {
    window.localStorage.setItem(workbenchStorageKeys.layout, values.layout);
    window.localStorage.setItem(workbenchStorageKeys.sizing, JSON.stringify(values.sizing));
    window.localStorage.setItem(workbenchStorageKeys.toolTrayMode, values.toolTrayMode);
    window.localStorage.setItem(workbenchStorageKeys.sideDrawerWidth, String(values.sideDrawerWidth));
    window.localStorage.setItem(workbenchStorageKeys.sideDrawerCollapsed, values.sideDrawerCollapsed ? "true" : "false");
  } catch {
    // Layout persistence is best-effort.
  }
}, [values.layout, values.sideDrawerCollapsed, values.sideDrawerWidth, values.sizing, values.toolTrayMode]);

export const useStoredWorkbenchLayout = () => {
  const [workbenchLayout, setStoredWorkbenchLayout] = useState<WorkbenchLayoutMode>(readStoredWorkbenchLayout);
  const [toolTrayMode, setToolTrayMode] = useState<ToolTrayMode>(readStoredToolTrayMode);
  const [workbenchSizing, setWorkbenchSizing] = useState<WorkbenchSizing>(readStoredWorkbenchSizing);
  const [narrowPanelOpen, setNarrowPanelOpen] = useState(false);
  const [sideDrawerWidth, setSideDrawerWidth] = useState(readStoredSideDrawerWidth);
  const [sideDrawerCollapsed, setSideDrawerCollapsed] = useState(readStoredSideDrawerCollapsed);
  const viewportWidth = useViewportWidth();
  usePersistWorkbenchLayout({ layout: workbenchLayout, sizing: workbenchSizing, toolTrayMode, sideDrawerWidth, sideDrawerCollapsed });

  const setWorkbenchLayout = (layout: WorkbenchLayoutMode) => {
    setStoredWorkbenchLayout(layout);
    setNarrowPanelOpen(layout !== "hidden");
  };
  const resetWorkbenchLayout = () => {
    setStoredWorkbenchLayout(DEFAULT_WORKBENCH_LAYOUT);
    setNarrowPanelOpen(false);
    setToolTrayMode(DEFAULT_TOOL_TRAY_MODE);
    setWorkbenchSizing(DEFAULT_WORKBENCH_SIZING);
    setSideDrawerWidth(DEFAULT_SIDE_DRAWER_WIDTH);
    setSideDrawerCollapsed(false);
  };
  return {
    narrowPanelOpen, resetWorkbenchLayout, setNarrowPanelOpen, setSideDrawerCollapsed,
    setSideDrawerWidth, setToolTrayMode, setWorkbenchLayout, setWorkbenchSizing,
    sideDrawerCollapsed, sideDrawerWidth, toolTrayMode, viewportWidth, workbenchLayout, workbenchSizing,
  };
};
