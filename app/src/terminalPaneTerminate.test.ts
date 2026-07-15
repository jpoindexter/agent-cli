import { describe, expect, it, vi } from "vitest";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { executeTerminalPaneTerminate } from "./terminalPaneTerminate";

const pane: ManagedTerminalPane = {
  createdAt: 1,
  cwd: "/repo",
  exitCode: null,
  id: 7,
  label: "Dev",
  profile: { args: [], command: "/bin/zsh", id: "shell", label: "Shell", useLoginShell: false },
  slot: 2,
  state: "running",
};

const createWorkflow = (decision: "approved" | "denied" = "approved") => {
  const calls: string[] = [];
  const nextPanes = [{ ...pane, exitCode: null, state: "exited" as const }];
  return {
    calls,
    workflow: {
      gateAction: vi.fn(async () => decision),
      markIntentionallyTerminated: vi.fn(() => { calls.push("mark"); }),
      pane,
      projectStatus: vi.fn(() => "running" as const),
      recordActivity: vi.fn(() => { calls.push("activity"); }),
      sessionStatus: vi.fn(() => "exited" as const),
      setError: vi.fn((error: string | null) => { calls.push(`error:${error}`); }),
      setPaneExited: vi.fn(() => { calls.push("state"); return nextPanes; }),
      terminatePane: vi.fn(async () => { calls.push("terminate"); }),
      updateProjectStatus: vi.fn(async () => { calls.push("project"); }),
      updateSessionStatus: vi.fn(async () => { calls.push("session"); }),
    },
  };
};

describe("executeTerminalPaneTerminate", () => {
  it("does nothing when termination approval is denied", async () => {
    const { workflow } = createWorkflow("denied");

    const terminated = await executeTerminalPaneTerminate(workflow);

    expect(terminated).toBe(false);
    expect(workflow.terminatePane).not.toHaveBeenCalled();
  });

  it("terminates the pane and synchronizes statuses before recording activity", async () => {
    const { calls, workflow } = createWorkflow();

    const terminated = await executeTerminalPaneTerminate(workflow);

    expect(terminated).toBe(true);
    expect(calls).toEqual([
      "terminate", "mark", "state", "project", "session", "activity", "error:null",
    ]);
    expect(workflow.gateAction).toHaveBeenCalledWith(expect.objectContaining({
      kind: "terminate-process",
      risk: "destructive",
      target: "Dev",
    }));
    expect(workflow.recordActivity).toHaveBeenCalledWith({
      detail: "Dev",
      kind: "process",
      label: "Terminate sent",
      status: "waiting",
      target: "/repo",
    });
  });

  it("marks both statuses for attention when termination fails", async () => {
    const { workflow } = createWorkflow();
    workflow.terminatePane.mockRejectedValueOnce(new Error("backend unavailable"));

    const terminated = await executeTerminalPaneTerminate(workflow);

    expect(terminated).toBe(false);
    expect(workflow.setError).toHaveBeenCalledWith("Error: backend unavailable");
    expect(workflow.updateProjectStatus).toHaveBeenCalledWith("attention");
    expect(workflow.updateSessionStatus).toHaveBeenCalledWith("attention");
    expect(workflow.markIntentionallyTerminated).not.toHaveBeenCalled();
  });
});
