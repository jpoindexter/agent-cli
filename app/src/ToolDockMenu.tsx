import type { MouseEvent } from "react";

import { AppIcon } from "./icons";
import type { ToolTrayMode, WorkbenchLayoutMode } from "./workbenchLayout";

type ToolDockMenuProps = {
  layout: WorkbenchLayoutMode;
  toolMode: ToolTrayMode;
  onLayoutChange: (layout: WorkbenchLayoutMode) => void;
  onToolModeChange: (mode: ToolTrayMode) => void;
};

export function ToolDockMenu({ layout, toolMode, onLayoutChange, onToolModeChange }: ToolDockMenuProps) {
  const close = (event: MouseEvent<HTMLElement>) => event.currentTarget.closest("details")?.removeAttribute("open");
  const chooseTool = (mode: ToolTrayMode, event: MouseEvent<HTMLButtonElement>) => {
    onToolModeChange(mode);
    if (layout === "hidden") onLayoutChange("right");
    close(event);
  };
  const chooseLayout = (next: WorkbenchLayoutMode, event: MouseEvent<HTMLButtonElement>) => {
    onLayoutChange(next);
    close(event);
  };
  return (
    <details className="tool-dock-menu" aria-label="Tools and dock position">
      <summary>
        <AppIcon name="workspace" />
        <span>Tools</span>
      </summary>
      <div className="tool-dock-menu__popover" role="menu">
        <span className="tool-dock-menu__label">Show</span>
        <button className={toolMode === "editor" ? "is-active" : ""} type="button" role="menuitem" onClick={(event) => chooseTool("editor", event)}>
          <AppIcon name="file" /><span>Editor</span>
        </button>
        <button className={toolMode === "browser" ? "is-active" : ""} type="button" role="menuitem" onClick={(event) => chooseTool("browser", event)}>
          <AppIcon name="browser" /><span>Browser</span>
        </button>
        <button className={toolMode === "split" ? "is-active" : ""} type="button" role="menuitem" onClick={(event) => chooseTool("split", event)}>
          <AppIcon name="workspace" /><span>Split editor and browser</span>
        </button>
        <span className="tool-dock-menu__label">Position</span>
        <button className={layout === "left" ? "is-active" : ""} type="button" role="menuitem" onClick={(event) => chooseLayout("left", event)}>
          <AppIcon name="file" /><span>Dock left</span>
        </button>
        <button className={layout === "right" ? "is-active" : ""} type="button" role="menuitem" onClick={(event) => chooseLayout("right", event)}>
          <AppIcon name="file" /><span>Dock right</span>
        </button>
        <button className={layout === "bottom" ? "is-active" : ""} type="button" role="menuitem" onClick={(event) => chooseLayout("bottom", event)}>
          <AppIcon name="browser" /><span>Dock bottom</span>
        </button>
        <button className={layout === "hidden" ? "is-active" : ""} type="button" role="menuitem" onClick={(event) => chooseLayout("hidden", event)}>
          <AppIcon name="close" /><span>Hide tools</span>
        </button>
      </div>
    </details>
  );
}
