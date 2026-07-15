import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  SetStateAction,
} from "react";

import type { WorkbenchLayoutMode, WorkbenchSizing } from "./workbenchLayout";
import { clamp } from "./workbenchLayoutStorage";
import { nudgeWorkbenchSizing, resizeWorkbenchSizing } from "./workbenchLayoutSizing";
import type { WorkbenchResizeKind } from "./workbenchLayoutSizing";

const startPointerTracking = (
  event: ReactPointerEvent<HTMLButtonElement>,
  move: (pointerEvent: PointerEvent) => void,
) => {
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  document.body.classList.add("is-resizing-workbench");
  const stop = () => {
    document.body.classList.remove("is-resizing-workbench");
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
  window.addEventListener("pointercancel", stop, { once: true });
};

export const useSideDrawerResize = (
  collapsed: boolean,
  setWidth: Dispatch<SetStateAction<number>>,
) => ({
  begin: (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (collapsed) return;
    startPointerTracking(event, (pointerEvent) => setWidth(clamp(pointerEvent.clientX, 220, 420)));
  },
  nudge: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setWidth((width) => clamp(width + (event.key === "ArrowRight" ? 12 : -12), 220, 420));
  },
});

export const useWorkbenchResize = (
  layout: WorkbenchLayoutMode,
  workbenchRef: RefObject<HTMLElement | null>,
  setSizing: Dispatch<SetStateAction<WorkbenchSizing>>,
) => ({
  begin: (kind: WorkbenchResizeKind, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (layout === "hidden") return;
    startPointerTracking(event, (pointerEvent) => {
      const rect = workbenchRef.current?.getBoundingClientRect();
      if (!rect) return;
      setSizing((current) => resizeWorkbenchSizing(kind, layout, current, rect, pointerEvent.clientX, pointerEvent.clientY));
    });
  },
  nudge: (kind: WorkbenchResizeKind, event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!event.key.startsWith("Arrow")) return;
    event.preventDefault();
    setSizing((current) => nudgeWorkbenchSizing(kind, layout, current, event.key));
  },
});
