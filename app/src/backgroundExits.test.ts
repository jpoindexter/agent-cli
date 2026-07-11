import { describe, expect, it } from "vitest";

import {
  addBackgroundExit,
  backgroundExitCountForProject,
  clearBackgroundExitsForProject,
  isBackgroundExit,
  notificationBody,
} from "./backgroundExits";

const exit = (paneId: string, projectPath: string, failed = false) => ({
  paneId,
  projectPath,
  label: "Codex",
  failed,
});

describe("background exit tracking", () => {
  it("counts an exit as background only outside the focused project", () => {
    expect(isBackgroundExit("/a", "/b")).toBe(true);
    expect(isBackgroundExit("/a", "/a")).toBe(false);
    expect(isBackgroundExit("/a", null)).toBe(true);
  });

  it("accumulates per project, dedupes by pane, and clears on focus", () => {
    let state = addBackgroundExit([], exit("p1", "/a"));
    state = addBackgroundExit(state, exit("p2", "/a"));
    state = addBackgroundExit(state, exit("p3", "/b"));
    state = addBackgroundExit(state, exit("p1", "/a", true)); // same pane re-exit replaces

    expect(backgroundExitCountForProject(state, "/a")).toBe(2);
    expect(backgroundExitCountForProject(state, "/b")).toBe(1);

    const cleared = clearBackgroundExitsForProject(state, "/a");
    expect(backgroundExitCountForProject(cleared, "/a")).toBe(0);
    expect(backgroundExitCountForProject(cleared, "/b")).toBe(1);
  });

  it("bodies the notification with project name and outcome", () => {
    expect(notificationBody(exit("p1", "/Users/j/repos/keelhouse", true))).toBe("Codex failed in keelhouse");
    expect(notificationBody(exit("p1", "/Users/j/repos/keelhouse"))).toBe("Codex finished in keelhouse");
  });
});
