import { describe, expect, it, vi } from "vitest";
import type { AgentSessionHandle, AgentSessionHandleDescriptor } from "./agentSessionHandle";
import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { createTerminalProcessActionsController } from "./terminalProcessActionsController";

const ref = <T,>(current: T) => ({ current });
const profile: LaunchProfile = {
  id: "codex", label: "Codex", command: "codex", args: [], useLoginShell: false,
};
const pane = (id: number, slot = id - 1): ManagedTerminalPane => ({
  createdAt: id, cwd: "/repo", exitCode: null, id, label: null,
  profile, slot, state: "running",
});
const descriptor: AgentSessionHandleDescriptor = {
  activity: { label: "Running", status: "running", updatedAt: 5 },
  agentProfileId: "codex", agentProfileLabel: "Codex", approvalMode: "ask",
  createdAt: 1, cwd: "/repo", exitCode: null, id: "pane:1", label: "Codex",
  paneId: 1, processState: "running", projectId: "/repo", projectSessionId: "chat",
};
const handle = (): AgentSessionHandle => ({
  ...descriptor,
  close: vi.fn(async () => {}), interrupt: vi.fn(async () => {}),
  readTail: vi.fn(async () => ""), send: vi.fn(async () => {}),
});

const createOptions = () => ({
  approvalMode: vi.fn(() => "ask" as const),
  gateAction: vi.fn(async () => "approved" as const),
  getActiveDescriptor: vi.fn(() => descriptor as AgentSessionHandleDescriptor | null),
  getActiveHandle: vi.fn(() => null as AgentSessionHandle | null),
  getActivePane: vi.fn(() => pane(1) as ManagedTerminalPane | null),
  getChanging: vi.fn(() => false),
  getPanes: vi.fn(() => [pane(1), pane(2)]),
  getProjectStatus: vi.fn(() => "running" as const),
  getSessionId: vi.fn(() => "chat" as string | null),
  getWorkspacePath: vi.fn(() => "/repo" as string | null),
  intentionallyTerminatedPaneIds: new Set<number>(),
  latest: ref<unknown>({ rows: 1 }),
  now: vi.fn(() => 99),
  recordActivity: vi.fn(),
  requestPaint: vi.fn(),
  restartPane: vi.fn(async () => 7),
  scheduleResize: vi.fn(),
  setChanging: vi.fn(),
  setComposerError: vi.fn(),
  setLaunchError: vi.fn(),
  setPaneExited: vi.fn((paneId: number) => [
    { ...pane(1), exitCode: null, state: paneId === 1 ? "exited" as const : "running" as const },
    pane(2),
  ]),
  setSessionPanes: vi.fn(),
  snapshots: ref<Record<number, unknown>>({ 1: { rows: 1 }, 2: { rows: 2 } }),
  statusForPanes: vi.fn(() => "running" as const),
  terminatePane: vi.fn(async () => {}),
  updateProjectStatus: vi.fn(async () => {}),
  updateSessionStatus: vi.fn(async () => {}),
});

describe("createTerminalProcessActionsController", () => {
  it("skips interrupt when no agent session is active", async () => {
    const options = createOptions();
    const actions = createTerminalProcessActionsController(options);

    expect(await actions.interruptActivePane()).toBeUndefined();
    expect(options.gateAction).not.toHaveBeenCalled();
  });

  it("interrupts the active agent pane and records stop activity", async () => {
    const options = createOptions();
    const active = handle();
    options.getActiveHandle.mockReturnValue(active);
    const actions = createTerminalProcessActionsController(options);

    expect(await actions.interruptActivePane()).toBe(true);

    expect(active.interrupt).toHaveBeenCalled();
    expect(options.setComposerError).toHaveBeenCalledWith(null);
    expect(options.recordActivity).toHaveBeenCalledWith(
      active, expect.objectContaining({ label: "Stop sent", status: "waiting" }),
    );
  });

  it("refuses to terminate without a workspace or pane", async () => {
    const options = createOptions();
    options.getWorkspacePath.mockReturnValue(null);
    const actions = createTerminalProcessActionsController(options);

    expect(await actions.terminateTerminalPane()).toBe(false);
    expect(options.terminatePane).not.toHaveBeenCalled();
  });

  it("terminates a pane, marks it intentional, and updates statuses", async () => {
    const options = createOptions();
    const actions = createTerminalProcessActionsController(options);

    expect(await actions.terminateTerminalPane(pane(1))).toBe(true);

    expect(options.terminatePane).toHaveBeenCalledWith(1);
    expect(options.intentionallyTerminatedPaneIds).toContain(1);
    expect(options.setPaneExited).toHaveBeenCalledWith(1);
    expect(options.updateProjectStatus).toHaveBeenCalledWith("/repo", "running");
    expect(options.updateSessionStatus).toHaveBeenCalledWith("/repo", "running");
    expect(options.setLaunchError).toHaveBeenCalledWith(null);
    expect(options.recordActivity).toHaveBeenCalledWith(
      descriptor, expect.objectContaining({ label: "Terminate sent" }),
    );
  });

  it("refuses to restart while a profile change is in flight", async () => {
    const options = createOptions();
    options.getChanging.mockReturnValue(true);
    const actions = createTerminalProcessActionsController(options);

    expect(await actions.restartTerminalPane(pane(1))).toBe(false);
    expect(options.restartPane).not.toHaveBeenCalled();
  });

  it("restarts a pane, clears its snapshots, and attributes restart activity", async () => {
    const options = createOptions();
    const actions = createTerminalProcessActionsController(options);

    expect(await actions.restartTerminalPane(pane(1))).toBe(true);

    expect(options.restartPane).toHaveBeenCalledWith("/repo", expect.objectContaining({ id: 1 }));
    expect(options.snapshots.current[1]).toBeUndefined();
    expect(options.latest.current).toBeNull();
    expect(options.setSessionPanes).toHaveBeenCalledWith(
      "/repo", "chat", expect.arrayContaining([expect.objectContaining({ id: 7 })]), 7,
    );
    expect(options.updateProjectStatus).toHaveBeenCalledWith("/repo", "running");
    expect(options.recordActivity).toHaveBeenCalledWith(
      expect.objectContaining({ paneId: 7, projectId: "/repo", projectSessionId: "chat" }),
      expect.objectContaining({ label: "Restarted process", target: "/repo" }),
    );
  });
});
