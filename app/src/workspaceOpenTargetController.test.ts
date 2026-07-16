import { describe, expect, it, vi } from "vitest";
import { defaultTerminalLaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { createWorkspaceOpenTargetController } from "./workspaceOpenTargetController";

const ref = <T,>(current: T) => ({ current });
const profile = defaultTerminalLaunchProfile();
const pane: ManagedTerminalPane = {
  createdAt: 1, cwd: "/repo", exitCode: null, id: 7, label: null,
  profile, slot: 0, state: "running",
};

const createOptions = () => ({
  activePaneForSession: vi.fn(() => 7 as number | null),
  activePaneIds: ref<Record<string, number>>({}),
  activeSessions: ref<Record<string, string>>({}),
  createPane: vi.fn(async () => ({ paneId: 8 })),
  defaultProfileId: profile.id,
  focusPane: vi.fn(async () => {}),
  getEnvironment: vi.fn(() => ({})),
  getSurfaceMode: vi.fn(() => "chat"),
  latest: ref<string | null>(null),
  now: vi.fn(() => 42),
  openWorkspace: vi.fn(async () => ({ paneId: 7, root: "/repo" })),
  paneLayouts: ref({}),
  panesByContext: ref<Record<string, ManagedTerminalPane[]>>({}),
  panesForSession: vi.fn(() => [pane]),
  requestPaint: vi.fn(),
  resetEditor: vi.fn(),
  resolveProfile: vi.fn(() => profile),
  resolveWorkspace: vi.fn(async () => ({ root: "/repo" })),
  restoredActiveFileWorkspace: ref<string | null>("/previous"),
  savedLabelForSlot: vi.fn(() => null),
  scheduleResize: vi.fn(),
  sessions: ref({}),
  setFocusedPane: vi.fn(),
  setLaunchError: vi.fn(),
  setManagedPanes: vi.fn(),
  setWorkspacePath: vi.fn(),
  snapshots: ref<Record<number, string>>({ 7: "snapshot-seven" }),
  workspacePath: ref<string | null>(null),
});

describe("createWorkspaceOpenTargetController", () => {
  it("reuses and focuses panes from the prepared project session", async () => {
    const options = createOptions();
    const controller = createWorkspaceOpenTargetController(options);

    const opened = await controller.prepareAndOpenWorkspaceTarget("/repo");

    expect(opened).toEqual(expect.objectContaining({
      activePaneId: 7, panes: [pane], requestedSessionId: expect.any(String), root: "/repo",
    }));
    expect(options.focusPane).toHaveBeenCalledWith(7);
    expect(options.openWorkspace).not.toHaveBeenCalled();
    expect(Object.keys(options.sessions.current)).toEqual(["/repo"]);
    expect(options.activeSessions.current["/repo"]).toBe(opened.requestedSessionId);
  });

  it("applies an opened target to terminal and workspace state", () => {
    const options = createOptions();
    const controller = createWorkspaceOpenTargetController(options);

    controller.applyOpenedWorkspaceTarget({
      activePaneId: 7, panes: [pane], requestedSessionId: "session-one", root: "/repo",
    });

    expect(options.panesByContext.current["/repo\nsession-one"]).toEqual([pane]);
    expect(options.activePaneIds.current["/repo\nsession-one"]).toBe(7);
    expect(options.setManagedPanes).toHaveBeenCalledWith([pane]);
    expect(options.setFocusedPane).toHaveBeenCalledWith(7);
    expect(options.latest.current).toBe("snapshot-seven");
    expect(options.requestPaint).toHaveBeenCalledOnce();
    expect(options.setLaunchError).toHaveBeenCalledWith(null);
    expect(options.restoredActiveFileWorkspace.current).toBeNull();
    expect(options.workspacePath.current).toBe("/repo");
    expect(options.setWorkspacePath).toHaveBeenCalledWith("/repo");
    expect(options.resetEditor).toHaveBeenCalledOnce();
    expect(options.scheduleResize).toHaveBeenCalledOnce();
  });
});
