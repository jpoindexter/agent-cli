import { describe, expect, it, vi } from "vitest";
import { executeTerminalWorktreePaneClose } from "./terminalWorktreePaneCloseWorkflow";

const worktree = {
  branch: "feature/dev",
  createdAt: 100,
  label: "Dev",
  paneId: "7",
  path: "/repo/.worktrees/dev",
  projectRoot: "/repo",
};

const createWorkflow = (decision: "approved" | "denied" = "approved") => {
  const calls: string[] = [];
  const workflow = {
    closePane: vi.fn(async () => { calls.push("close"); return true; }),
    gateAction: vi.fn(async () => decision),
    persistRemoval: vi.fn(() => { calls.push("persist"); }),
    removeWorktree: vi.fn(async () => { calls.push("remove"); }),
    setError: vi.fn((error: string) => { calls.push(`error:${error}`); }),
    worktree,
  };
  return { calls, workflow };
};

describe("executeTerminalWorktreePaneClose", () => {
  it("closes, removes, and persists an approved worktree in order", async () => {
    const { calls, workflow } = createWorkflow();

    const removed = await executeTerminalWorktreePaneClose(workflow);

    expect(removed).toBe(true);
    expect(workflow.gateAction).toHaveBeenCalledWith(expect.objectContaining({
      kind: "remove-worktree",
      target: "feature/dev",
    }));
    expect(calls).toEqual(["close", "remove", "persist"]);
  });

  it("does not close or remove when approval is denied", async () => {
    const { workflow } = createWorkflow("denied");

    const removed = await executeTerminalWorktreePaneClose(workflow);

    expect(removed).toBe(false);
    expect(workflow.closePane).not.toHaveBeenCalled();
    expect(workflow.removeWorktree).not.toHaveBeenCalled();
    expect(workflow.persistRemoval).not.toHaveBeenCalled();
  });

  it("does not remove the worktree when pane close fails", async () => {
    const { workflow } = createWorkflow();
    workflow.closePane.mockResolvedValueOnce(false);

    const removed = await executeTerminalWorktreePaneClose(workflow);

    expect(removed).toBe(false);
    expect(workflow.removeWorktree).not.toHaveBeenCalled();
    expect(workflow.persistRemoval).not.toHaveBeenCalled();
  });

  it("reports backend removal errors but still clears the persisted record", async () => {
    const { calls, workflow } = createWorkflow();
    workflow.removeWorktree.mockRejectedValueOnce(new Error("worktree busy"));

    const removed = await executeTerminalWorktreePaneClose(workflow);

    expect(removed).toBe(true);
    expect(workflow.setError).toHaveBeenCalledWith("Error: worktree busy");
    expect(calls).toEqual(["close", "error:Error: worktree busy", "persist"]);
  });
});
