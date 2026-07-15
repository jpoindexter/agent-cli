import { useRef } from "react";

import { effectiveWorkbenchLayout } from "./workbenchLayout";
import { workbenchShellStyles } from "./workbenchLayoutSizing";
import { useStoredWorkbenchLayout } from "./useStoredWorkbenchLayout";
import { useSideDrawerResize, useWorkbenchResize } from "./useWorkbenchLayoutResize";

export const useWorkbenchLayout = () => {
  const state = useStoredWorkbenchLayout();
  const workbenchRef = useRef<HTMLElement | null>(null);
  const renderedWorkbenchLayout = effectiveWorkbenchLayout(
    state.workbenchLayout,
    state.viewportWidth,
    state.narrowPanelOpen,
  );
  const styles = workbenchShellStyles(
    state.workbenchSizing,
    state.viewportWidth,
    state.sideDrawerWidth,
    state.sideDrawerCollapsed,
  );
  const sideDrawerResize = useSideDrawerResize(state.sideDrawerCollapsed, state.setSideDrawerWidth);
  const workbenchResize = useWorkbenchResize(renderedWorkbenchLayout, workbenchRef, state.setWorkbenchSizing);

  return {
    ...styles,
    beginSideDrawerResize: sideDrawerResize.begin,
    beginWorkbenchResize: workbenchResize.begin,
    nudgeSideDrawerResize: sideDrawerResize.nudge,
    nudgeWorkbenchResize: workbenchResize.nudge,
    resetWorkbenchLayout: state.resetWorkbenchLayout,
    renderedWorkbenchLayout,
    setSideDrawerCollapsed: state.setSideDrawerCollapsed,
    setToolTrayMode: state.setToolTrayMode,
    setWorkbenchLayout: state.setWorkbenchLayout,
    sideDrawerCollapsed: state.sideDrawerCollapsed,
    toolTrayMode: state.toolTrayMode,
    workbenchLayout: state.workbenchLayout,
    workbenchRef,
    workbenchSizing: state.workbenchSizing,
  };
};
