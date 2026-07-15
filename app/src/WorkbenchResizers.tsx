import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { ToolTrayMode, WorkbenchLayoutMode, WorkbenchSizing } from "./workbenchLayout";

type ResizerKind = "tray" | "tools";

type WorkbenchResizersProps = {
  layout: WorkbenchLayoutMode;
  onKeyDown: (kind: ResizerKind, event: KeyboardEvent<HTMLButtonElement>) => void;
  onPointerDown: (kind: ResizerKind, event: ReactPointerEvent<HTMLButtonElement>) => void;
  sizing: WorkbenchSizing;
  trayMode: ToolTrayMode;
};

type WorkbenchResizerProps = {
  kind: ResizerKind;
  label: string;
  layout: Exclude<WorkbenchLayoutMode, "hidden">;
  max: number;
  min: number;
  onKeyDown: WorkbenchResizersProps["onKeyDown"];
  onPointerDown: WorkbenchResizersProps["onPointerDown"];
  orientation: "horizontal" | "vertical";
  value: number;
};

const WorkbenchResizer = (props: WorkbenchResizerProps) => (
  <button
    className={`workbench-resizer workbench-resizer--${props.kind} workbench-resizer--${props.layout}`}
    type="button"
    role="separator"
    aria-label={props.label}
    aria-orientation={props.orientation}
    aria-valuemin={props.min}
    aria-valuemax={props.max}
    aria-valuenow={Math.round(props.value)}
    title={`Drag to resize ${props.kind === "tray" ? "tool tray" : "editor and browser trays"}`}
    onPointerDown={(event) => props.onPointerDown(props.kind, event)}
    onKeyDown={(event) => props.onKeyDown(props.kind, event)}
  />
);

export const WorkbenchResizers = (props: WorkbenchResizersProps) => {
  if (props.layout === "hidden") return null;
  const bottom = props.layout === "bottom";
  return <>
    <WorkbenchResizer kind="tray" label="Resize tool tray" layout={props.layout} min={18} max={54}
      orientation={bottom ? "horizontal" : "vertical"} value={props.sizing.trayPercent}
      onKeyDown={props.onKeyDown} onPointerDown={props.onPointerDown} />
    {props.trayMode === "split" ? (
      <WorkbenchResizer kind="tools" label="Resize editor and browser trays" layout={props.layout} min={25} max={75}
        orientation={bottom ? "vertical" : "horizontal"} value={props.sizing.toolSplitPercent}
        onKeyDown={props.onKeyDown} onPointerDown={props.onPointerDown} />
    ) : null}
  </>;
};
