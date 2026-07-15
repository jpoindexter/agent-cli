import { describe, expect, it, vi } from "vitest";
import type { AgentSessionHandle } from "./agentSessionHandle";
import { executeAgentPaneInterrupt } from "./agentPaneInterrupt";

const createHandle = (interrupt: () => Promise<void>): AgentSessionHandle => ({
  activity: { label: "Running", status: "running", updatedAt: 1 },
  agentProfileId: "codex",
  agentProfileLabel: "Codex",
  approvalMode: "ask",
  close: async () => undefined,
  createdAt: 1,
  cwd: "/repo",
  exitCode: null,
  id: "pane:7",
  interrupt,
  label: "Codex pane",
  paneId: 7,
  processState: "running",
  projectId: "/repo",
  projectSessionId: "session",
  readTail: async () => "",
  send: async () => undefined,
});

describe("executeAgentPaneInterrupt", () => {
  it("does nothing when interrupt approval is denied", async () => {
    const interrupt = vi.fn(async () => undefined);
    const recordActivity = vi.fn();

    const interrupted = await executeAgentPaneInterrupt({
      gateAction: async () => "denied",
      handle: createHandle(interrupt),
      recordActivity,
      setError: vi.fn(),
    });

    expect(interrupted).toBe(false);
    expect(interrupt).not.toHaveBeenCalled();
    expect(recordActivity).not.toHaveBeenCalled();
  });

  it("clears the error, interrupts, and records the approved action in order", async () => {
    const calls: string[] = [];
    const interrupt = vi.fn(async () => { calls.push("interrupt"); });
    const recordActivity = vi.fn(() => { calls.push("activity"); });
    const setError = vi.fn(() => { calls.push("error"); });
    const handle = createHandle(interrupt);

    const interrupted = await executeAgentPaneInterrupt({
      gateAction: async (action) => {
        expect(action).toMatchObject({ kind: "interrupt-process", risk: "high", target: "Codex pane" });
        return "approved";
      },
      handle,
      recordActivity,
      setError,
    });

    expect(interrupted).toBe(true);
    expect(calls).toEqual(["error", "interrupt", "activity"]);
    expect(setError).toHaveBeenCalledWith(null);
    expect(recordActivity).toHaveBeenCalledWith({
      detail: "Codex pane",
      kind: "process",
      label: "Stop sent",
      status: "waiting",
    });
  });
});
