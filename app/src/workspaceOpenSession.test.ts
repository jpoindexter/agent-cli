import { describe, expect, it } from "vitest";
import {
  prepareWorkspaceOpenSession,
  workspaceOpenLayoutForRoot,
} from "./workspaceOpenSession";

describe("prepareWorkspaceOpenSession", () => {
  it("creates an active session with a fallback pane layout", () => {
    const prepared = prepareWorkspaceOpenSession({
      activeSessions: {},
      defaultProfileId: "terminal",
      now: 100,
      paneLayouts: {},
      path: "/repo",
      savedLabel: "Shell 1",
      sessions: {},
    });

    expect(prepared.sessionId).toBe("session-2s");
    expect(prepared.activeSessions).toEqual({ "/repo": "session-2s" });
    expect(prepared.sessions["/repo"]).toHaveLength(1);
    expect(prepared.layout).toEqual([
      { slot: 0, profileId: "terminal", label: "Shell 1" },
    ]);
  });
});

describe("workspaceOpenLayoutForRoot", () => {
  it("uses the restored layout for the resolved workspace root", () => {
    const initialLayout = [{ slot: 0, profileId: "terminal", label: null }];
    const restoredLayout = [{ slot: 1, profileId: "server", label: "Dev" }];

    expect(workspaceOpenLayoutForRoot({
      initialLayout,
      paneLayouts: { "/resolved\nsession-1": restoredLayout },
      root: "/resolved",
      sessionId: "session-1",
    })).toBe(restoredLayout);
  });
});
