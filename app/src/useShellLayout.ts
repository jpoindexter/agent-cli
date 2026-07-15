import { type PointerEvent as ReactPointerEvent, type RefObject, useCallback, useState } from "react";

import type { UtilityTrayMode } from "./BottomUtilityTabs";
import { useWorkbenchLayout } from "./useWorkbenchLayout";

export type AgentSurfaceMode = "chat" | "terminal";
export type SideDrawerMode = "projects" | "files" | "git" | "browser" | "settings";

export const utilityTrayHeightFromPointer = (rect: DOMRect, clientY: number) =>
  Math.round(Math.max(150, Math.min(rect.height * 0.65, rect.bottom - clientY)));

const useUtilityTrayResize = (
  workbenchRef: RefObject<HTMLElement | null>,
  setHeight: (height: number) => void,
) => useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  document.body.classList.add("is-resizing-workbench");
  const move = (pointerEvent: PointerEvent) => {
    const rect = workbenchRef.current?.getBoundingClientRect();
    if (rect) setHeight(utilityTrayHeightFromPointer(rect, pointerEvent.clientY));
  };
  const stop = () => {
    document.body.classList.remove("is-resizing-workbench");
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
}, [setHeight, workbenchRef]);

export const useShellLayout = (onResetSettings: () => void) => {
  const workbench = useWorkbenchLayout();
  const [agentSurfaceMode, setAgentSurfaceMode] = useState<AgentSurfaceMode>("chat");
  const [utilityTrayMode, setUtilityTrayMode] = useState<UtilityTrayMode>("terminal");
  const [utilityTrayHeight, setUtilityTrayHeight] = useState(260);
  const [sideDrawerMode, setSideDrawerMode] = useState<SideDrawerMode>("projects");
  const beginUtilityTrayResize = useUtilityTrayResize(workbench.workbenchRef, setUtilityTrayHeight);
  const resetInterface = useCallback(() => {
    workbench.resetWorkbenchLayout();
    setSideDrawerMode("projects");
    setAgentSurfaceMode("chat");
    setUtilityTrayMode("terminal");
    setUtilityTrayHeight(260);
    onResetSettings();
  }, [onResetSettings, workbench.resetWorkbenchLayout]);
  return {
    ...workbench, agentSurfaceMode, beginUtilityTrayResize, resetInterface, setAgentSurfaceMode,
    setSideDrawerMode, setUtilityTrayMode, sideDrawerMode, utilityTrayHeight, utilityTrayMode,
  };
};
