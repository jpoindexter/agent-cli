import type { ManagedTerminalPane } from "./managedTerminalPane";
import { normalizeTerminalPaneLabel, terminalPaneLabelForDisplay } from "./terminalPane";

type TerminalPaneRenameOptions = {
  getPanes: (root: string, sessionId: string) => ManagedTerminalPane[];
  getRoot: () => string | null;
  getSessionId: (root: string | null) => string | null;
  persistLabel: (root: string, slot: number, label: string | null) => Promise<unknown>;
  promptLabel: (currentLabel: string) => string | null;
  setSessionPanes: (
    root: string, sessionId: string, panes: ManagedTerminalPane[], activePaneId: number,
  ) => void;
};

export const createTerminalPaneRename = (options: TerminalPaneRenameOptions) =>
  async (pane: ManagedTerminalPane) => {
    const root = options.getRoot();
    const sessionId = options.getSessionId(root);
    if (!root || !sessionId) return;
    const currentIndex = options.getPanes(root, sessionId).findIndex((item) => item.id === pane.id);
    const current = terminalPaneLabelForDisplay(
      pane.label, pane.profile.label, currentIndex >= 0 ? currentIndex : pane.slot,
    );
    const value = options.promptLabel(current);
    if (value == null) return;
    const nextLabel = normalizeTerminalPaneLabel(value);
    const nextPanes = options.getPanes(root, sessionId).map((item) =>
      item.id === pane.id ? { ...item, label: nextLabel } : item,
    );
    options.setSessionPanes(root, sessionId, nextPanes, pane.id);
    await options.persistLabel(root, pane.slot, nextLabel);
  };
