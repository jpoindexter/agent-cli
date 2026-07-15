import { describe, expect, it, vi } from "vitest";
import { createProjectSessionNavigationActions } from "./projectSessionNavigationActions";
import type { ProjectSession } from "./workspaceState";

const current: ProjectSession = {
  id: "one",
  status: "running",
  title: "Current work",
  updatedAt: 1,
};

const target: ProjectSession = {
  id: "two",
  status: "exited",
  title: "Target chat",
  updatedAt: 2,
};

const other: ProjectSession = {
  id: "other",
  status: "exited",
  title: "Other project",
  updatedAt: 3,
};

const createActions = () => {
  const calls: string[] = [];
  const dependencies = {
    captureCurrentSession: vi.fn(() => { calls.push("capture"); }),
    defaultBrowserUrl: "http://localhost:3000",
    flushComposer: vi.fn(async () => { calls.push("flush"); }),
    getPreviousStatus: vi.fn(() => "attention" as const),
    getState: vi.fn(() => ({
      activeSessions: { "/repo": "one" },
      browserUrl: "http://localhost:5173",
      browserUrlsByProject: { "/other": "http://localhost:4173" },
      currentRoot: "/repo",
      sessions: { "/other": [other], "/repo": [current, target] },
    })),
    getTargetStatus: vi.fn(() => "running" as const),
    now: vi.fn(() => 100),
    openProject: vi.fn(async (_path: string, sameProject: boolean) => {
      calls.push(sameProject ? "open:direct" : "open:request");
    }),
    persistBrowserUrl: vi.fn(async () => { calls.push("browser"); }),
    persistSessions: vi.fn(async () => { calls.push("persist"); }),
    promptTitle: vi.fn(() => "  Renamed chat  "),
    setFocusedMessage: vi.fn(() => { calls.push("focus"); }),
  };
  return { actions: createProjectSessionNavigationActions(dependencies), calls, dependencies };
};

describe("createProjectSessionNavigationActions", () => {
  it("switches the current project session after flushing and persisting state", async () => {
    const { actions, calls, dependencies } = createActions();

    await actions.switchSession("/repo", "two");

    expect(calls).toEqual(["focus", "flush", "capture", "persist", "open:direct"]);
    expect(dependencies.persistSessions).toHaveBeenCalledWith(
      expect.objectContaining({
        "/other": [other],
        "/repo": expect.arrayContaining([
          expect.objectContaining({ id: "one", status: "attention" }),
          expect.objectContaining({ id: "two", status: "running" }),
        ]),
      }),
      { "/repo": "two" },
    );
  });

  it("creates a session for another project before requesting that project", async () => {
    const { actions, calls, dependencies } = createActions();

    await actions.createSession("/other");

    expect(calls).toEqual(["capture", "persist", "browser", "open:request"]);
    expect(dependencies.persistBrowserUrl).toHaveBeenCalledWith(
      "/other", expect.stringMatching(/^session-/), "http://localhost:4173",
    );
    expect(dependencies.persistSessions).toHaveBeenCalledWith(
      expect.objectContaining({
        "/repo": [current, target],
        "/other": expect.arrayContaining([expect.objectContaining({ title: "New chat 2" })]),
      }),
      expect.objectContaining({ "/other": expect.stringMatching(/^session-/) }),
    );
  });

  it("renames one session while preserving every project", async () => {
    const { actions, dependencies } = createActions();

    await actions.renameSession("/repo", target);

    expect(dependencies.promptTitle).toHaveBeenCalledWith("Target chat");
    expect(dependencies.persistSessions).toHaveBeenCalledWith({
      "/other": [other],
      "/repo": [current, { ...target, title: "Renamed chat", updatedAt: 100 }],
    }, { "/repo": "one" });
  });
});
