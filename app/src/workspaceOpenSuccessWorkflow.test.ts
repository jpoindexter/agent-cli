import { describe, expect, it, vi } from "vitest";
import { executeWorkspaceOpenSuccess } from "./workspaceOpenSuccessWorkflow";

describe("executeWorkspaceOpenSuccess", () => {
  it("applies and persists the plan before restoring session surfaces", async () => {
    const order: string[] = [];
    const applyPlan = vi.fn(() => order.push("apply"));
    const persistPaneLayout = vi.fn(() => order.push("layout"));
    const persistPlan = vi.fn(async () => { order.push("persist"); });
    const restoreEditor = vi.fn(() => order.push("editor"));
    const restoreBrowser = vi.fn(() => order.push("browser"));

    const plan = await executeWorkspaceOpenSuccess({
      applyPlan,
      now: 100,
      panes: [{ id: 7 }],
      persistPaneLayout,
      persistPlan,
      previousRoot: "/old",
      previousStatus: "exited",
      projectStatus: "running",
      restoreBrowser,
      restoreEditor,
      root: "/new",
      sessionStatus: "running",
      state: {
        activeSessions: { "/old": "old-session" },
        openProjects: [{ path: "/old", status: "running" }],
        recentProjects: ["/old"],
        sessions: { "/old": [{ id: "old-session", title: "Old", status: "running", updatedAt: 1 }] },
      },
    });

    expect(plan.sessionId).toBe("session-2s");
    expect(applyPlan).toHaveBeenCalledWith(plan);
    expect(persistPaneLayout).toHaveBeenCalledWith("/new", "session-2s", [{ id: 7 }]);
    expect(order).toEqual(["apply", "layout", "persist", "editor", "browser"]);
  });
});
