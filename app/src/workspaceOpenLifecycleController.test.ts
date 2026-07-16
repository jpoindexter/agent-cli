import { describe, expect, it, vi } from "vitest";
import { defaultTerminalLaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { createWorkspaceOpenLifecycleController } from "./workspaceOpenLifecycleController";

const binding = <T,>(current: T) => ({ ref: { current }, set: vi.fn() });
const profile = defaultTerminalLaunchProfile();
const pane: ManagedTerminalPane = {
  createdAt: 1, cwd: "/repo", exitCode: null, id: 7, label: null,
  profile, slot: 0, state: "running",
};

const createOptions = () => ({
  clearCurrentWorkspace: vi.fn(),
  deleteProjectChats: vi.fn(async () => {}),
  logHealthEvent: vi.fn(async () => {}),
  now: vi.fn(() => 100),
  persistPaneLayout: vi.fn(),
  projectStatus: vi.fn(() => "running" as const),
  records: {
    activePanes: binding<Record<string, number>>({}),
    activeSessions: binding<Record<string, string>>({}),
    browserProjects: binding<Record<string, string>>({}),
    browserSessions: binding<Record<string, string>>({}),
    conversations: binding<Record<string, { id: string }>>({}),
    editorSnapshots: binding<Record<string, { id: string }>>({}),
    harnessRecords: binding<Record<string, { id: string }>>({}),
    openProjects: binding<Array<{ path: string; status: "running" | "attention" | "exited" }>>([]),
    paneLayouts: binding<Record<string, { id: string }>>({}),
    projectPanes: binding<Record<string, ManagedTerminalPane[]>>({}),
    recentProjects: binding<string[]>([]),
    sessions: binding<Record<string, Array<{
      id: string; status: "running" | "attention" | "exited"; title: string; updatedAt: number;
    }>>>({}),
  },
  restoreBrowser: vi.fn(),
  restoreEditor: vi.fn(),
  sessionStatus: vi.fn(() => "running" as const),
  setFocusedPane: vi.fn(),
  setLaunchError: vi.fn(),
  setManagedPanes: vi.fn(),
});

describe("createWorkspaceOpenLifecycleController", () => {
  it("persists successful project state and restores session surfaces", async () => {
    const options = createOptions();
    const controller = createWorkspaceOpenLifecycleController(options);

    await controller.completeOpenedWorkspace({
      activePaneId: 7, panes: [pane], requestedSessionId: "session-one", root: "/repo",
    }, profile, null, null);

    expect(options.records.openProjects.ref.current).toEqual([
      expect.objectContaining({ path: "/repo", status: "running" }),
    ]);
    expect(options.records.recentProjects.ref.current).toEqual(["/repo"]);
    const sessionId = options.records.activeSessions.ref.current["/repo"];
    expect(options.persistPaneLayout).toHaveBeenCalledWith("/repo", sessionId, [pane]);
    expect(options.restoreEditor).toHaveBeenCalledWith("/repo", sessionId);
    expect(options.restoreBrowser).toHaveBeenCalledWith("/repo", sessionId);
  });

  it("restores previous panes and marks an ordinary open failure for attention", async () => {
    const options = createOptions();
    const controller = createWorkspaceOpenLifecycleController(options);

    await controller.handleWorkspaceOpenError(
      new Error("Cannot launch terminal profile"), "/repo", [pane], 7, null,
    );

    expect(options.setLaunchError).toHaveBeenCalledWith("Error: Cannot launch terminal profile");
    expect(options.setManagedPanes).toHaveBeenCalledWith([pane]);
    expect(options.setFocusedPane).toHaveBeenCalledWith(7);
    expect(options.logHealthEvent).toHaveBeenCalledWith(
      "open_workspace failed: Error: Cannot launch terminal profile",
    );
    expect(options.records.openProjects.ref.current).toEqual([
      expect.objectContaining({ path: "/repo", status: "attention" }),
    ]);
  });

  it("removes every project-scoped record when the workspace is missing", async () => {
    const options = createOptions();
    const key = "/missing\nsession-one";
    options.records.activePanes.ref.current = { [key]: 7 };
    options.records.activeSessions.ref.current = { "/missing": "session-one" };
    options.records.browserProjects.ref.current = { "/missing": "http://localhost:3000" };
    options.records.browserSessions.ref.current = { [key]: "http://localhost:3000" };
    options.records.conversations.ref.current = { [key]: { id: "conversation" } };
    options.records.editorSnapshots.ref.current = { [key]: { id: "editor" } };
    options.records.harnessRecords.ref.current = { [key]: { id: "harness" } };
    options.records.openProjects.ref.current = [{ path: "/missing", status: "attention" }];
    options.records.paneLayouts.ref.current = { [key]: { id: "layout" } };
    options.records.projectPanes.ref.current = { [key]: [pane] };
    options.records.recentProjects.ref.current = ["/missing"];
    options.records.sessions.ref.current = { "/missing": [{
      id: "session-one", status: "attention", title: "Missing", updatedAt: 1,
    }] };
    const controller = createWorkspaceOpenLifecycleController(options);

    await controller.handleWorkspaceOpenError(
      new Error("Workspace folder does not exist: /missing"), "/missing", [], null, null,
    );

    expect(options.records.activeSessions.ref.current).toEqual({});
    expect(options.records.openProjects.ref.current).toEqual([]);
    expect(options.records.projectPanes.ref.current).toEqual({});
    expect(options.records.conversations.ref.current).toEqual({});
    expect(options.clearCurrentWorkspace).toHaveBeenCalledWith("/missing");
    expect(options.deleteProjectChats).toHaveBeenCalledWith("/missing");
  });
});
