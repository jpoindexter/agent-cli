import { describe, expect, it, vi } from "vitest";
import { executeWorkspaceOpenDirect } from "./workspaceOpenDirectWorkflow";

const createWorkflow = () => {
  const calls: string[] = [];
  const opened = { root: "/next" };
  const previousPanes = [{ id: 7 }];
  const store = { id: "store" };
  const workflow = {
    applyOpened: vi.fn(() => { calls.push("apply"); }),
    captureCurrentSession: vi.fn(() => { calls.push("capture"); }),
    completeOpened: vi.fn(async () => { calls.push("complete"); }),
    flushComposer: vi.fn(async () => { calls.push("flush"); }),
    getPreviousActivePaneId: vi.fn(() => 7 as number | null),
    getPreviousPanes: vi.fn(() => previousPanes),
    getPreviousRoot: vi.fn(() => "/previous" as string | null),
    getStore: vi.fn(() => { calls.push("store"); return store; }),
    handleError: vi.fn(async () => { calls.push("error"); }),
    openTarget: vi.fn(async () => { calls.push("open"); return opened; }),
    path: "/next",
    profile: { id: "shell" },
    setFocusedPane: vi.fn(() => { calls.push("clear-focus"); }),
  };
  return { calls, opened, previousPanes, store, workflow };
};

describe("executeWorkspaceOpenDirect", () => {
  it("flushes and captures before opening and completing the workspace", async () => {
    const { calls, opened, store, workflow } = createWorkflow();

    const succeeded = await executeWorkspaceOpenDirect(workflow);

    expect(succeeded).toBe(true);
    expect(calls).toEqual([
      "flush", "capture", "store", "clear-focus", "open", "apply", "complete",
    ]);
    expect(workflow.completeOpened).toHaveBeenCalledWith(
      opened, workflow.profile, "/previous", store,
    );
    expect(workflow.handleError).not.toHaveBeenCalled();
  });

  it("can skip capturing the current session", async () => {
    const { workflow } = createWorkflow();

    await executeWorkspaceOpenDirect({ ...workflow, captureCurrentSessionBeforeOpen: false });

    expect(workflow.captureCurrentSession).not.toHaveBeenCalled();
  });

  it("passes the pre-open pane state to recovery after an open failure", async () => {
    const { calls, previousPanes, store, workflow } = createWorkflow();
    const failure = new Error("workspace unavailable");
    workflow.openTarget.mockImplementationOnce(async () => {
      calls.push("open");
      throw failure;
    });

    const succeeded = await executeWorkspaceOpenDirect(workflow);

    expect(succeeded).toBe(false);
    expect(workflow.handleError).toHaveBeenCalledWith(
      failure, "/next", previousPanes, 7, store,
    );
    expect(calls).toEqual(["flush", "capture", "store", "clear-focus", "open", "error"]);
  });
});
