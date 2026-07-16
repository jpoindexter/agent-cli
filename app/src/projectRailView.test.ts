import { describe, expect, it } from "vitest";
import { toggleExpandedProject, visibleProjectsFrom } from "./projectRailView";
import type { OpenProject } from "./workspaceState";

const project = (path: string): OpenProject => ({ path, status: "running" });

describe("visibleProjectsFrom", () => {
  it("passes open projects straight through when any exist", () => {
    const projects = [project("/a"), project("/b")];
    expect(visibleProjectsFrom(projects, "/c", () => "exited")).toBe(projects);
  });

  it("falls back to the active workspace as a single synthetic project", () => {
    expect(visibleProjectsFrom([], "/repo", () => "attention")).toEqual([
      { path: "/repo", status: "attention" },
    ]);
    expect(visibleProjectsFrom([], null, () => "running")).toEqual([]);
  });
});

describe("toggleExpandedProject", () => {
  it("flips a project's expansion and defaults collapsed", () => {
    expect(toggleExpandedProject({}, "/repo")).toEqual({ "/repo": true });
    expect(toggleExpandedProject({ "/repo": true }, "/repo")).toEqual({ "/repo": false });
    expect(toggleExpandedProject({ "/other": true }, "/repo")).toEqual({
      "/other": true, "/repo": true,
    });
  });
});
