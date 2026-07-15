import { describe, expect, it, vi } from "vitest";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { executeTerminalPaneRestart } from "./terminalPaneRestartWorkflow";

const pane: ManagedTerminalPane = {
  createdAt: 1,
  cwd: "/repo",
  exitCode: 3,
  id: 7,
  label: "Dev",
  profile: { args: ["-l"], command: "/bin/zsh", id: "shell", label: "Shell", useLoginShell: false },
  slot: 1,
  state: "exited",
};

const createWorkflow = (decision: "approved" | "denied" = "approved") => {
  const calls: string[] = [];
  return {
    calls,
    workflow: {
      clearLatestSnapshot: vi.fn(() => { calls.push("latest"); }),
      clearPaneSnapshot: vi.fn(() => { calls.push("snapshot"); }),
      currentPanes: vi.fn(() => [pane]),
      gateAction: vi.fn(async () => decision),
      now: vi.fn(() => 1234),
      pane,
      projectStatus: vi.fn(() => "running" as const),
      recordRestarted: vi.fn(() => { calls.push("activity"); }),
      requestPaint: vi.fn(() => { calls.push("paint"); }),
      restartPane: vi.fn(async () => { calls.push("restart"); return 9; }),
      scheduleResize: vi.fn(() => { calls.push("resize"); }),
      sessionStatus: vi.fn(() => "running" as const),
      setChanging: vi.fn((changing: boolean) => { calls.push(`changing:${changing}`); }),
      setError: vi.fn((error: string | null) => { calls.push(`error:${error}`); }),
      setSessionPanes: vi.fn(() => { calls.push("panes"); }),
      updateProjectStatus: vi.fn(async () => { calls.push("project"); }),
      updateSessionStatus: vi.fn(async () => { calls.push("session"); }),
    },
  };
};

describe("executeTerminalPaneRestart", () => {
  it("does nothing when restart approval is denied", async () => {
    const { workflow } = createWorkflow("denied");

    const restarted = await executeTerminalPaneRestart(workflow);

    expect(restarted).toBe(false);
    expect(workflow.restartPane).not.toHaveBeenCalled();
    expect(workflow.setChanging).not.toHaveBeenCalled();
  });

  it("replaces the pane and synchronizes the successful restart in order", async () => {
    const { calls, workflow } = createWorkflow();

    const restarted = await executeTerminalPaneRestart(workflow);

    expect(restarted).toBe(true);
    expect(calls).toEqual([
      "changing:true", "restart", "snapshot", "latest", "panes", "paint", "error:null",
      "resize", "project", "session", "activity", "changing:false",
    ]);
    expect(workflow.gateAction).toHaveBeenCalledWith(expect.objectContaining({
      kind: "restart-process",
      risk: "high",
      target: "Dev · /bin/zsh -l",
    }));
    expect(workflow.setSessionPanes).toHaveBeenCalledWith([
      expect.objectContaining({ createdAt: 1234, exitCode: null, id: 9, state: "running" }),
    ], 9);
    expect(workflow.recordRestarted).toHaveBeenCalledWith(
      expect.objectContaining({ id: 9 }),
      "Dev",
    );
  });

  it("marks statuses for attention and always clears the changing state after failure", async () => {
    const { calls, workflow } = createWorkflow();
    workflow.restartPane.mockRejectedValueOnce(new Error("restart failed"));

    const restarted = await executeTerminalPaneRestart(workflow);

    expect(restarted).toBe(false);
    expect(workflow.setError).toHaveBeenCalledWith("Error: restart failed");
    expect(workflow.updateProjectStatus).toHaveBeenCalledWith("attention");
    expect(workflow.updateSessionStatus).toHaveBeenCalledWith("attention");
    expect(calls[calls.length - 1]).toBe("changing:false");
  });
});
