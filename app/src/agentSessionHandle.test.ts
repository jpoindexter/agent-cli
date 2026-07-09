import { describe, expect, it } from "vitest";
import {
  DEFAULT_AGENT_APPROVAL_MODE,
  agentSessionHandleId,
  buildAgentSessionHandleDescriptor,
  processStateFromTerminalPane,
  readTailFromSnapshot,
} from "./agentSessionHandle";

describe("agent session handles", () => {
  it("uses stable pane-backed handle ids", () => {
    expect(agentSessionHandleId(42)).toBe("pane:42");
  });

  it("maps terminal lifecycle into agent process state", () => {
    expect(processStateFromTerminalPane("idle")).toBe("waiting");
    expect(processStateFromTerminalPane("starting")).toBe("starting");
    expect(processStateFromTerminalPane("running")).toBe("running");
    expect(processStateFromTerminalPane("exited")).toBe("exited");
    expect(processStateFromTerminalPane("error")).toBe("errored");
  });

  it("builds a descriptor with project, session, profile, approval, and activity metadata", () => {
    expect(
      buildAgentSessionHandleDescriptor({
        pane: {
          id: 7,
          cwd: "/repo",
          profile: { id: "codex", label: "Codex" },
          state: "running",
          exitCode: null,
          createdAt: 100,
        },
        projectId: "/repo",
        projectSessionId: "session-1",
        label: "review pass",
        approvalMode: DEFAULT_AGENT_APPROVAL_MODE,
        updatedAt: 250,
      }),
    ).toEqual({
      id: "pane:7",
      paneId: 7,
      projectId: "/repo",
      projectSessionId: "session-1",
      cwd: "/repo",
      label: "review pass",
      agentProfileId: "codex",
      agentProfileLabel: "Codex",
      processState: "running",
      approvalMode: "ask",
      exitCode: null,
      createdAt: 100,
      activity: {
        label: "Running",
        status: "running",
        updatedAt: 250,
      },
    });
  });

  it("reads a trimmed terminal tail from the current snapshot", () => {
    const cells = Array.from("one  two  tre  for  ").map((t) => ({ t }));
    expect(readTailFromSnapshot({ cols: 5, rows: 4, cells }, 2)).toBe("tre\nfor");
    expect(readTailFromSnapshot({ cols: 5, rows: 4, cells }, 20)).toBe("one\ntwo\ntre\nfor");
    expect(readTailFromSnapshot(null, 2)).toBe("");
  });
});
