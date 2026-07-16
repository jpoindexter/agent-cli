import type { AppActionDecision, AppActionDescriptor } from "./appActions";
import { createAppAction } from "./appActions";
import type { WorktreeRecord } from "./worktrees";

type TerminalWorktreePaneCloseWorkflow = {
  closePane: () => Promise<boolean>;
  gateAction: (action: AppActionDescriptor) => Promise<AppActionDecision>;
  persistRemoval: () => void;
  removeWorktree: () => Promise<unknown>;
  setError: (error: string) => void;
  worktree: WorktreeRecord;
};

export const executeTerminalWorktreePaneClose = async (
  workflow: TerminalWorktreePaneCloseWorkflow,
) => {
  const decision = await workflow.gateAction(createAppAction({
    kind: "remove-worktree",
    label: "Remove worktree",
    target: workflow.worktree.branch,
    risk: "destructive",
    requestedBy: "user",
    undoHint: "The worktree branch and files are deleted; recreate from the context menu if needed.",
  }));
  if (decision !== "approved") return false;
  if (!await workflow.closePane()) return false;
  try {
    await workflow.removeWorktree();
  } catch (error) {
    workflow.setError(String(error));
  }
  workflow.persistRemoval();
  return true;
};
