import { describe, expect, it } from "vitest";
import {
  agentActivityStatusFromProcess,
  agentCurrentActivity,
  createAgentActivityEvent,
  pushAgentActivityEvent,
} from "./agentActivity";
import type { AgentSessionHandleDescriptor } from "./agentSessionHandle";

const handle: AgentSessionHandleDescriptor = {
  id: "pane:4",
  paneId: 4,
  projectId: "/repo",
  projectSessionId: "session-1",
  cwd: "/repo",
  label: "API fix",
  agentProfileId: "claude",
  agentProfileLabel: "Claude",
  processState: "running",
  approvalMode: "ask",
  exitCode: null,
  createdAt: 100,
  activity: {
    label: "Running",
    status: "running",
    updatedAt: 120,
  },
};

describe("agent activity", () => {
  it("maps process state to visible activity status", () => {
    expect(agentActivityStatusFromProcess("starting")).toBe("waiting");
    expect(agentActivityStatusFromProcess("running")).toBe("running");
    expect(agentActivityStatusFromProcess("waiting")).toBe("waiting");
    expect(agentActivityStatusFromProcess("exited")).toBe("exited");
    expect(agentActivityStatusFromProcess("errored")).toBe("error");
  });

  it("creates the current activity row from a handle without hidden reasoning", () => {
    expect(agentCurrentActivity(handle)).toEqual({
      id: "pane:4:current",
      projectId: "/repo",
      projectSessionId: "session-1",
      paneId: "pane:4",
      kind: "process",
      label: "Running",
      detail: "API fix - Claude",
      status: "running",
      timestamp: 120,
    });
  });

  it("creates and bounds recent activity rows", () => {
    const event = createAgentActivityEvent(handle, {
      kind: "file",
      label: "Edited a file",
      detail: "App.tsx",
      status: "complete",
      timestamp: 200,
    });
    expect(event.id).toBe("pane:4:file:200");
    expect(pushAgentActivityEvent([event], event)).toEqual([event]);
    expect(pushAgentActivityEvent([], event, 0)).toEqual([]);
  });
});
