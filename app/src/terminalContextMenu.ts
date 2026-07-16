import type { ContextMenuItem } from "./ContextMenu";
import type { UtilityTrayMode } from "./BottomUtilityTabs";

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

type UtilityTrayTabContextMenuInput = {
  activeMode: UtilityTrayMode;
  activePaneState: string | null;
  activeSurface: boolean;
  actions: {
    closePane: () => unknown;
    copyActivity: () => unknown;
    createShell: () => unknown;
    hide: () => unknown;
    killPane: () => unknown;
    restartPane: () => unknown;
    show: (mode: UtilityTrayMode) => unknown;
  };
  hasActivePane: boolean;
  hasActivity: boolean;
  hasWorkspace: boolean;
  launchProfileChanging: boolean;
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

const utilityModeItems = (
  mode: UtilityTrayMode,
  input: UtilityTrayTabContextMenuInput,
): ContextMenuItem[] => {
  if (mode === "terminal") return [
    terminalItem("utility.terminal.new-shell", "New Shell Pane", input.actions.createShell, {
      icon: "terminal", disabled: !input.hasWorkspace || input.launchProfileChanging,
    }),
    terminalItem("utility.terminal.close-pane", "Close Selected Pane", input.actions.closePane, {
      icon: "close", danger: true, disabled: !input.hasActivePane,
    }),
  ];
  if (mode === "processes") return [
    terminalItem("utility.processes.restart", "Restart Selected Process", input.actions.restartPane, {
      icon: "reload", disabled: !input.hasActivePane || input.launchProfileChanging,
    }),
    terminalItem("utility.processes.kill", "Kill Selected Process", input.actions.killPane, {
      icon: "stop", danger: true,
      disabled: !input.hasActivePane || input.activePaneState === "exited",
    }),
  ];
  return [terminalItem("utility.logs.copy", "Copy Activity Log", input.actions.copyActivity, {
    icon: "logs", disabled: !input.hasActivity,
  })];
};

export const buildUtilityTrayTabContextMenuItems = (
  mode: UtilityTrayMode,
  input: UtilityTrayTabContextMenuInput,
): ContextMenuItem[] => {
  const label = mode.charAt(0).toUpperCase() + mode.slice(1);
  return [
    terminalItem(`utility.${mode}.show`, `Show ${label}`, () => input.actions.show(mode), {
      icon: mode === "terminal" ? "terminal" : mode === "processes" ? "waiting" : "logs",
      disabled: input.activeSurface && input.activeMode === mode,
    }),
    ...utilityModeItems(mode, input),
    terminalItem("utility.hide", "Hide Bottom Panel", input.actions.hide, {
      icon: "chevronDown", disabled: !input.activeSurface,
    }),
  ];
};
