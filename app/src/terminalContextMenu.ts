import type { ContextMenuItem } from "./ContextMenu";

type TerminalContextMenuActions = {
  clear: () => unknown;
  closePane: () => unknown;
  copySelection: () => unknown;
  copyTail: () => unknown;
  copyWorkingDirectory: () => unknown;
  createPane: () => unknown;
  createWorktreePane: () => unknown;
  interrupt: () => unknown;
  killPane: () => unknown;
  paste: () => unknown;
  removeWorktree: () => unknown;
  renamePane: () => unknown;
  restartPane: () => unknown;
  saveTranscript: () => unknown;
};

export type TerminalContextMenuInput = {
  activePaneState: string | null;
  actions: TerminalContextMenuActions;
  hasActiveHandle: boolean;
  hasActivePane: boolean;
  hasSelection: boolean;
  hasWorkspace: boolean;
  hasWorktreeForActivePane: boolean;
  launchProfileChanging: boolean;
  launchProfileLabel: string;
  shortcuts: {
    clear: string;
    copy: string;
    paste: string;
  };
};

const terminalItem = (
  id: string,
  label: string,
  onSelect: () => unknown,
  options: Pick<ContextMenuItem, "shortcut" | "icon" | "disabled" | "danger"> = {},
): ContextMenuItem => ({ id, label, onSelect, ...options });

export const buildTerminalContextMenuItems = ({
  activePaneState,
  actions,
  hasActiveHandle,
  hasActivePane,
  hasSelection,
  hasWorkspace,
  hasWorktreeForActivePane,
  launchProfileChanging,
  launchProfileLabel,
  shortcuts,
}: TerminalContextMenuInput): ContextMenuItem[] => {
  const processExited = activePaneState === "exited";
  return [
    terminalItem("terminal.new-pane", `New ${launchProfileLabel} Pane`, actions.createPane, { icon: "terminal", disabled: !hasWorkspace || launchProfileChanging }),
    terminalItem("terminal.new-worktree-pane", "New Worktree Pane", actions.createWorktreePane, { icon: "terminal", disabled: !hasWorkspace || launchProfileChanging }),
    terminalItem("terminal.rename-pane", "Rename Selected Pane", actions.renamePane, { icon: "terminal", disabled: !hasActivePane }),
    terminalItem("terminal.save-transcript", "Save Transcript", actions.saveTranscript, { icon: "file", disabled: !hasActivePane }),
    terminalItem("terminal.restart-pane", "Restart Selected Process", actions.restartPane, { icon: "reload", disabled: !hasActivePane || launchProfileChanging }),
    terminalItem("terminal.terminate-pane", "Kill Selected Process", actions.killPane, { icon: "stop", danger: true, disabled: !hasActivePane || processExited }),
    terminalItem("terminal.close-pane", "Close Selected Pane", actions.closePane, { icon: "close", danger: true, disabled: !hasActiveHandle }),
    terminalItem("terminal.remove-worktree", "Remove Worktree", actions.removeWorktree, { icon: "close", danger: true, disabled: !hasActivePane || !hasWorktreeForActivePane }),
    terminalItem("terminal.copy", "Copy Selection", actions.copySelection, { icon: "terminal", shortcut: shortcuts.copy, disabled: !hasSelection }),
    terminalItem("terminal.paste", "Paste", actions.paste, { icon: "terminal", shortcut: shortcuts.paste, disabled: !hasActivePane }),
    terminalItem("terminal.copy-tail", "Copy Last 20 Lines", actions.copyTail, { icon: "terminal", disabled: !hasActiveHandle }),
    terminalItem("terminal.clear", "Clear Terminal", actions.clear, { icon: "terminal", shortcut: shortcuts.clear, disabled: !hasActivePane }),
    terminalItem("terminal.interrupt", "Interrupt Process", actions.interrupt, { icon: "stop", danger: true, disabled: !hasActivePane || processExited }),
    terminalItem("terminal.copy-cwd", "Copy Working Directory", actions.copyWorkingDirectory, { icon: "workspace", disabled: !hasWorkspace }),
  ];
};
