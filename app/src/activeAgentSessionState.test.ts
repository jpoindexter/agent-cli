import { describe, expect, it } from "vitest";
import type { AgentActivityEvent } from "./agentActivity";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { deriveActiveAgentSessionState } from "./activeAgentSessionState";

const pane = (id: number, label: string | null = null): ManagedTerminalPane => ({
  createdAt: id,
  cwd: "/repo",
  exitCode: null,
  id,
  label,
  profile: { id: "codex", label: "Codex", command: "codex", args: [], useLoginShell: true },
  slot: id - 1,
  state: "running",
});

const event = (id: string, paneId: string, projectId = "/repo"): AgentActivityEvent => ({
  id,
  projectId,
  projectSessionId: "session-1",
  paneId,
  kind: "command",
  label: id,
  status: "complete",
  timestamp: 10,
});

describe("deriveActiveAgentSessionState", () => {
  it("selects the active pane and its pane-backed descriptor", () => {
    const result = deriveActiveAgentSessionState({
      activeSessionId: "session-1",
      activeTerminalPaneId: 2,
      agentActivityEvents: [],
      agentActivityFilter: "all",
      agentApprovalMode: "ask",
      terminalPanes: [pane(1), pane(2, "Review")],
      workspacePath: "/repo",
    });

    expect(result.activeTerminalPane?.id).toBe(2);
    expect(result.agentSessionDescriptors).toHaveLength(2);
    expect(result.activeAgentSessionDescriptor).toMatchObject({
      id: "pane:2",
      label: "Review",
      projectId: "/repo",
      projectSessionId: "session-1",
    });
  });

  it("keeps activity from the active chat and active pane only", () => {
    const result = deriveActiveAgentSessionState({
      activeSessionId: "session-1",
      activeTerminalPaneId: 2,
      agentActivityEvents: [
        event("chat", "chat:session-1"),
        event("active-pane", "pane:2"),
        event("other-pane", "pane:1"),
        event("other-project", "pane:2", "/other"),
      ],
      agentActivityFilter: "all",
      agentApprovalMode: "ask",
      terminalPanes: [pane(1), pane(2)],
      workspacePath: "/repo",
    });

    expect(result.selectedAgentActivityLog.map((item) => item.id)).toEqual(["chat", "active-pane"]);
  });
});
