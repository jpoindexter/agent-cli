import type { CompositionEvent, MouseEvent, RefObject } from "react";

import { AppIcon } from "./icons";

type TerminalViewportProps = {
  activeProfileLabel: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  imeInputRef: RefObject<HTMLTextAreaElement | null>;
  paneCount: number;
  terminalHostRef: RefObject<HTMLDivElement | null>;
  workspaceOpen: boolean;
  onContextMenu: (event: MouseEvent<HTMLDivElement>) => void;
  onOpenFolder: () => void;
  onPaste: (text: string) => void;
  onStartShell: () => void;
};

const TerminalEmptyState = ({ paneCount, workspaceOpen, onOpenFolder, onStartShell }: Pick<TerminalViewportProps, "paneCount" | "workspaceOpen" | "onOpenFolder" | "onStartShell">) => {
  if (workspaceOpen && paneCount > 0) return null;
  return (
    <div className="utility-tray__terminal-empty">
      <AppIcon name="terminal" />
      <strong>{workspaceOpen ? "No terminal panes" : "Open a folder to start a terminal"}</strong>
      {!workspaceOpen ? <span>Shell panes run in the selected project.</span> : null}
      <button type="button" onClick={workspaceOpen ? onStartShell : onOpenFolder}>{workspaceOpen ? "Start Shell" : "Open folder"}</button>
    </div>
  );
};

export const TerminalViewport = (props: TerminalViewportProps) => {
  const handleCompositionEnd = (event: CompositionEvent<HTMLTextAreaElement>) => {
    const text = event.data;
    event.currentTarget.value = "";
    if (text) props.onPaste(text);
  };
  return (
    <div ref={props.terminalHostRef} className="terminal-host utility-tray__terminal" onPointerDown={() => props.imeInputRef.current?.focus()} onContextMenu={props.onContextMenu}>
      <canvas ref={props.canvasRef} className="term" aria-hidden="true" />
      <TerminalEmptyState {...props} />
      <textarea ref={props.imeInputRef} className="terminal-ime-input" tabIndex={0} role="application" aria-label={`${props.activeProfileLabel} terminal pane. Type to send keyboard input to the active process.`} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} onCompositionEnd={handleCompositionEnd} />
    </div>
  );
};
