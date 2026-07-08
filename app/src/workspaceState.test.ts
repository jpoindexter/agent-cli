import { describe, expect, it } from "vitest";
import {
  isMissingWorkspaceError,
  normalizeRecentProjects,
  pushRecentProject,
  removeRecentProject,
} from "./workspaceState";

describe("workspace state helpers", () => {
  it("normalizes recent projects by removing invalid values and duplicates", () => {
    expect(normalizeRecentProjects(["/a", "", "/b", "/a", 42, null])).toEqual(["/a", "/b"]);
  });

  it("promotes opened projects and caps the recent list", () => {
    const projects = ["/a", "/b", "/c", "/d", "/e", "/f", "/g", "/h"];
    expect(pushRecentProject(projects, "/c")).toEqual(["/c", "/a", "/b", "/d", "/e", "/f", "/g", "/h"]);
    expect(pushRecentProject(projects, "/i")).toEqual(["/i", "/a", "/b", "/c", "/d", "/e", "/f", "/g"]);
  });

  it("removes missing projects without touching the rest of the list", () => {
    expect(removeRecentProject(["/a", "/b", "/c"], "/b")).toEqual(["/a", "/c"]);
  });

  it("only treats workspace path failures as pruneable", () => {
    expect(isMissingWorkspaceError("Workspace folder does not exist: /missing")).toBe(true);
    expect(isMissingWorkspaceError("Workspace path is not a folder: /tmp/file")).toBe(true);
    expect(isMissingWorkspaceError("Cannot find `claude` in the login-shell PATH.")).toBe(false);
  });
});
