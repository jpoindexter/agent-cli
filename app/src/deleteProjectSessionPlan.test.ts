import { describe, expect, it } from "vitest";
import { planProjectSessionDelete } from "./deleteProjectSessionPlan";
import type { ProjectSession } from "./workspaceState";

const session = (id: string, title = id): ProjectSession => ({
  id,
  status: "exited",
  title,
  updatedAt: 1,
});

describe("project session delete plan", () => {
  it("refuses to delete the only project chat", () => {
    const plan = planProjectSessionDelete({
      activeSessionByProject: { "/repo": "one" },
      activeSessionId: "one",
      activeWorkspacePath: "/repo",
      projectPath: "/repo",
      projectSessions: { "/repo": [session("one")] },
      sessionId: "one",
    });

    expect(plan.canDelete).toBe(false);
  });

  it("removes owned records and selects a fallback active session", () => {
    const plan = planProjectSessionDelete({
      activeSessionByProject: { "/repo": "two" },
      activeSessionId: "two",
      activeWorkspacePath: "/repo",
      projectPath: "/repo",
      projectSessions: { "/repo": [session("one"), session("two")] },
      sessionId: "two",
    });

    expect(plan).toMatchObject({
      browserSessionKey: "/repo\ntwo",
      canDelete: true,
      chatSessionKey: "/repo\ntwo",
      contextKey: "/repo\ntwo",
      shouldReopenActiveWorkspace: true,
    });
    if (!plan.canDelete) throw new Error("expected a deletable plan");
    expect(plan.nextSessions["/repo"].map((item) => item.id)).toEqual(["one"]);
    expect(plan.nextActiveSessions["/repo"]).toBe("one");
  });
});
