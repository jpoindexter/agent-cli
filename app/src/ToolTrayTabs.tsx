import { useLayoutEffect, useRef, useState } from "react";

import { AppIcon } from "./icons";
import type { ToolTrayMode } from "./workbenchLayout";

type ToolTrayTabsProps = {
  mode: ToolTrayMode;
  onModeChange: (mode: ToolTrayMode) => void;
  onClose: () => void;
};

export const toolTraySelection = (current: ToolTrayMode, next: ToolTrayMode): ToolTrayMode | null =>
  current === next ? null : next;

const showsEditor = (mode: ToolTrayMode) => mode === "editor" || mode === "split";
const showsBrowser = (mode: ToolTrayMode) => mode === "browser" || mode === "split";

export type ToolTrayDensity = "full" | "compact" | "icons";

export const toolTrayDensity = (width: number): ToolTrayDensity => {
  if (width < 480) return "icons";
  if (width < 720) return "compact";
  return "full";
};

const useToolTrayDensity = () => {
  const trayRef = useRef<HTMLElement | null>(null);
  const [density, setDensity] = useState<ToolTrayDensity>("compact");
  useLayoutEffect(() => {
    const tray = trayRef.current;
    if (!tray) return;
    const update = (width: number) => setDensity((current) => {
      const next = toolTrayDensity(width);
      return current === next ? current : next;
    });
    update(tray.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    observer.observe(tray);
    return () => observer.disconnect();
  }, []);
  return { density, trayRef };
};

const toolTabs = [
  { mode: "files", label: "Files", icon: "folder", selected: (mode: ToolTrayMode) => mode === "files" },
  { mode: "editor", label: "Editor", icon: "file", selected: showsEditor },
  { mode: "browser", label: "Browser", icon: "browser", selected: showsBrowser },
  { mode: "git", label: "Git", icon: "git", selected: (mode: ToolTrayMode) => mode === "git" },
  { mode: "context", label: "Context", icon: "context", selected: (mode: ToolTrayMode) => mode === "context" },
] as const;

const ToolTrayTab = ({ current, tab, onChoose }: { current: ToolTrayMode; tab: typeof toolTabs[number]; onChoose: (mode: ToolTrayMode) => void }) => {
  const selected = tab.selected(current);
  return (
    <button className={`tool-tray-tabs__tab ${selected ? "tool-tray-tabs__tab--active" : ""}`} type="button" aria-pressed={selected} title={`${selected && current === tab.mode ? "Hide" : "Show"} ${tab.label} panel`} onClick={() => onChoose(tab.mode)}>
      <AppIcon name={tab.icon} />
      <span>{tab.label}</span>
    </button>
  );
};

export function ToolTrayTabs({ mode, onModeChange, onClose }: ToolTrayTabsProps) {
  const { density, trayRef } = useToolTrayDensity();

  const choose = (next: ToolTrayMode) => {
    const selection = toolTraySelection(mode, next);
    if (selection == null) onClose();
    else onModeChange(selection);
  };

  return (
    <nav ref={trayRef} className={`tool-tray-tabs tool-tray-tabs--${density}`} aria-label="Tool tray surfaces" data-density={density}>
      {toolTabs.map((tab) => <ToolTrayTab current={mode} key={tab.mode} tab={tab} onChoose={choose} />)}
      <span className="tool-tray-tabs__spacer" />
      <button
        className="tool-tray-tabs__icon"
        type="button"
        title="Hide tools"
        aria-label="Hide tool tray"
        onClick={onClose}
      >
        <AppIcon name="close" />
      </button>
    </nav>
  );
}
