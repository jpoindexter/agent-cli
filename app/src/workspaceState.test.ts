import { describe, expect, it } from "vitest";
import {
  forgetActiveFile,
  isMissingWorkspaceError,
  normalizeActiveFileByWorkspace,
  normalizeOpenProjects,
  normalizeRecentProjects,
  openProjectsFromRecent,
  pushRecentProject,
  removeOpenProject,
  rememberActiveFile,
  removeRecentProject,
  setOpenProjectStatus,
  upsertOpenProject,
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

  it("normalizes active file metadata by workspace", () => {
    expect(normalizeActiveFileByWorkspace({ "/a": "/a/src/App.tsx", "/b": 42, "": "/bad" })).toEqual({
      "/a": "/a/src/App.tsx",
    });
  });

  it("remembers and forgets active files without touching other workspaces", () => {
    const remembered = rememberActiveFile({ "/a": "/a/old.ts" }, "/b", "/b/src/main.ts");
    expect(remembered).toEqual({ "/a": "/a/old.ts", "/b": "/b/src/main.ts" });
    expect(forgetActiveFile(remembered, "/a")).toEqual({ "/b": "/b/src/main.ts" });
  });

  it("normalizes open projects from current and legacy store shapes", () => {
    expect(normalizeOpenProjects([{ path: "/a", status: "running" }, "/b", { path: "/a", status: "attention" }, { path: "", status: "running" }, 7])).toEqual([
      { path: "/a", status: "running" },
      { path: "/b", status: "exited" },
    ]);
  });

  it("promotes and updates open project rail entries", () => {
    const open = openProjectsFromRecent(["/a", "/b"]);
    expect(open).toEqual([
      { path: "/a", status: "exited" },
      { path: "/b", status: "exited" },
    ]);
    expect(upsertOpenProject(open, "/b", "running")).toEqual([
      { path: "/b", status: "running" },
      { path: "/a", status: "exited" },
    ]);
    expect(setOpenProjectStatus(open, "/a", "attention")).toEqual([
      { path: "/a", status: "attention" },
      { path: "/b", status: "exited" },
    ]);
    expect(removeOpenProject(open, "/a")).toEqual([{ path: "/b", status: "exited" }]);
  });
});
