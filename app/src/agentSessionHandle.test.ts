import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_AGENT_APPROVAL_MODE,
  agentSessionHandleId,
  buildAgentSessionHandleDescriptor,
  createActiveAgentSessionHandle,
  processStateFromTerminalPane,
  readTailFromSnapshot,
} from "./agentSessionHandle";

const descriptor = buildAgentSessionHandleDescriptor({
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
});

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

  it("focuses the descriptor pane before sending text or an interrupt", async () => {
    const calls: string[] = [];
    const handle = createActiveAgentSessionHandle({
      activePaneId: () => 3,
      closePane: vi.fn(async () => true),
      descriptor,
      focusPane: vi.fn(async (paneId: number) => { calls.push(`focus:${paneId}`); }),
      recordClosed: vi.fn(),
      sendEnter: vi.fn(async () => { calls.push("enter"); }),
      sendInterrupt: vi.fn(async () => { calls.push("interrupt"); }),
      sendText: vi.fn(async (text: string) => { calls.push(`text:${text}`); }),
      snapshot: vi.fn(() => null),
    });

    await handle.send("hello");
    await handle.interrupt();

    expect(calls).toEqual([
      "focus:7", "text:hello", "enter", "focus:7", "interrupt",
    ]);
  });

  it("reads the pane snapshot and records only a successful close", async () => {
    const cells = Array.from("one  two  ").map((t) => ({ t }));
    const closePane = vi.fn(async () => false);
    const recordClosed = vi.fn();
    const handle = createActiveAgentSessionHandle({
      activePaneId: () => 7,
      closePane,
      descriptor,
      focusPane: vi.fn(async () => {}),
      recordClosed,
      sendEnter: vi.fn(async () => {}),
      sendInterrupt: vi.fn(async () => {}),
      sendText: vi.fn(async () => {}),
      snapshot: vi.fn(() => ({ cols: 5, rows: 2, cells })),
    });

    await expect(handle.readTail(1)).resolves.toBe("two");
    await handle.close();
    expect(recordClosed).not.toHaveBeenCalled();
    closePane.mockResolvedValueOnce(true);
    await handle.close();
    expect(recordClosed).toHaveBeenCalledWith(descriptor);
  });
});
