// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWorkspacePersistenceController } from "./useWorkspacePersistenceController";

const createOptions = () => {
  const store = { save: vi.fn(async () => undefined), set: vi.fn(async () => undefined) };
  return {
    options: {
      activeFiles: { current: {} },
      getPanes: vi.fn(() => []),
      paneLabels: { current: {} },
      paneLayouts: { current: {} },
      sessionSnapshots: { current: {} },
      setPaneLabels: vi.fn(),
      store: { current: store },
    },
    store,
  };
};

const session = {
  id: "session-1",
  status: "exited" as const,
  title: "Task",
  updatedAt: 100,
};

describe("useWorkspacePersistenceController", () => {
  it("keeps project state and imperative refs synchronized", () => {
    const { options } = createOptions();
    const { result } = renderHook(() => useWorkspacePersistenceController(options));

    act(() => {
      result.current.setRecentProjects(["/repo"]);
      result.current.setOpenProjects([{ path: "/repo", status: "exited" }]);
      result.current.setProjectSessions({ "/repo": [session] });
      result.current.setActiveSessionByProjectState({ "/repo": "session-1" });
    });

    expect(result.current.recentProjectsRef.current).toEqual(["/repo"]);
    expect(result.current.openProjectsRef.current[0]?.path).toBe("/repo");
    expect(result.current.projectSessionsRef.current["/repo"]).toEqual([session]);
    expect(result.current.activeSessionForProject("/repo")).toBe("session-1");
  });

  it("persists and updates project and active-session status", async () => {
    const { options, store } = createOptions();
    const { result } = renderHook(() => useWorkspacePersistenceController(options));

    await act(async () => {
      await result.current.persistOpenProjects([{ path: "/repo", status: "exited" }]);
      await result.current.persistProjectSessions(
        { "/repo": [session] }, { "/repo": "session-1" },
      );
      await result.current.updateOpenProjectStatus("/repo", "running");
      await result.current.updateActiveSessionStatus("/repo", "attention");
    });

    expect(result.current.openProjectsRef.current[0]?.status).toBe("running");
    expect(result.current.projectSessionsRef.current["/repo"]?.[0]?.status).toBe("attention");
    expect(store.set).toHaveBeenCalledWith("openProjects", expect.any(Array));
    expect(store.set).toHaveBeenCalledWith("projectSessions", expect.any(Object));
    expect(store.set).toHaveBeenCalledWith("activeSessionByProject", expect.any(Object));
    expect(store.save).toHaveBeenCalledTimes(4);
  });
});
