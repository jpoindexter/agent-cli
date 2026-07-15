import { describe, expect, it, vi } from "vitest";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { executeTerminalPaneFocus } from "./terminalPaneFocusWorkflow";

const pane: ManagedTerminalPane = {
  createdAt: 1,
  cwd: "/repo",
  exitCode: null,
  id: 7,
  label: "Dev",
  profile: {
    args: [],
    command: "/bin/zsh",
    id: "shell",
    label: "Shell",
    useLoginShell: false,
  },
  slot: 0,
  state: "running",
};

const createWorkflow = (decision: "approved" | "denied" = "approved") => {
  const calls: string[] = [];
  const workflow = {
    activePaneId: vi.fn(() => 3 as number | null),
    currentPanes: vi.fn(() => [pane]),
    focusPane: vi.fn(async () => { calls.push("focus"); }),
    gateAction: vi.fn(async () => decision),
    paneId: pane.id,
    recordActivePane: vi.fn(() => { calls.push("record"); }),
    requestedBy: "user" as const,
    restoreSnapshot: vi.fn(() => { calls.push("snapshot"); }),
    scheduleResize: vi.fn(() => { calls.push("resize"); }),
    setError: vi.fn((error: string) => { calls.push(`error:${error}`); }),
    setFocusedPane: vi.fn(() => { calls.push("focused"); }),
  };
  return { calls, workflow };
};

describe("executeTerminalPaneFocus", () => {
  it("does nothing when the pane is already active", async () => {
    const { workflow } = createWorkflow();
    workflow.activePaneId.mockReturnValueOnce(pane.id);

    const focused = await executeTerminalPaneFocus(workflow);

    expect(focused).toBe(false);
    expect(workflow.gateAction).not.toHaveBeenCalled();
    expect(workflow.focusPane).not.toHaveBeenCalled();
  });

  it("does nothing when focus approval is denied", async () => {
    const { workflow } = createWorkflow("denied");

    const focused = await executeTerminalPaneFocus(workflow);

    expect(focused).toBe(false);
    expect(workflow.focusPane).not.toHaveBeenCalled();
  });

  it("focuses the pane and synchronizes its active render state in order", async () => {
    const { calls, workflow } = createWorkflow();

    const focused = await executeTerminalPaneFocus(workflow);

    expect(focused).toBe(true);
    expect(workflow.gateAction).toHaveBeenCalledWith(expect.objectContaining({
      kind: "focus-pane",
      requestedBy: "user",
      risk: "low",
      target: "Dev",
    }));
    expect(workflow.focusPane).toHaveBeenCalledWith(pane.id);
    expect(calls).toEqual(["focus", "record", "focused", "snapshot", "resize"]);
  });

  it("uses a stable fallback target and reports backend failures", async () => {
    const { workflow } = createWorkflow();
    workflow.currentPanes.mockReturnValueOnce([]);
    workflow.focusPane.mockRejectedValueOnce(new Error("backend unavailable"));

    const focused = await executeTerminalPaneFocus(workflow);

    expect(focused).toBe(false);
    expect(workflow.gateAction).toHaveBeenCalledWith(expect.objectContaining({ target: "pane:7" }));
    expect(workflow.setError).toHaveBeenCalledWith("Error: backend unavailable");
    expect(workflow.recordActivePane).not.toHaveBeenCalled();
  });
});
