import type { MouseEvent } from "react";

import { AppIcon } from "./icons";

export type UtilityTrayMode = "terminal" | "processes" | "logs";

type BottomUtilityTabsProps = {
  mode: UtilityTrayMode;
  open: boolean;
  onContextMenu: (event: MouseEvent<HTMLButtonElement>, mode: UtilityTrayMode) => void;
  onOpen: (mode: UtilityTrayMode) => void;
  onToggleVisibility: () => void;
};

const TABS = [
  ["terminal", "terminal", "Terminal"],
  ["processes", "processes", "Processes"],
  ["logs", "logs", "Logs"],
] as const;

export const BottomUtilityTabs = ({ mode, open, onContextMenu, onOpen, onToggleVisibility }: BottomUtilityTabsProps) => (
  <nav className="utility-tray__tabs" aria-label="Utility tray surfaces">
    {TABS.map(([tabMode, icon, label]) => (
      <button className={`utility-tray__tab ${mode === tabMode ? "utility-tray__tab--active" : ""}`} type="button" aria-pressed={open && mode === tabMode} key={tabMode} onClick={() => onOpen(tabMode)} onContextMenu={(event) => onContextMenu(event, tabMode)}>
        <AppIcon name={icon} /><span>{label}</span>
      </button>
    ))}
    <span className="utility-tray__spacer" />
    <button className="utility-tray__icon" type="button" title={open ? "Collapse tray" : "Expand tray"} aria-label={open ? "Collapse utility tray" : "Expand utility tray"} aria-expanded={open} onClick={onToggleVisibility}>
      <AppIcon name={open ? "chevronDown" : "chevronUp"} />
    </button>
  </nav>
);
