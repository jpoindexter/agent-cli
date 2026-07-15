import { describe, expect, it, vi } from "vitest";
import { requestProjectClose } from "./projectCloseRequest";

describe("requestProjectClose", () => {
  it("defers closing the active project when one selected editor tab is dirty", async () => {
    const closeProject = vi.fn(async () => true);
    const deferNavigation = vi.fn();

    const closed = await requestProjectClose({
      activeProjectPath: "/repo",
      closeProject,
      confirmDirtyTabs: vi.fn(async () => true),
      confirmRunningTasks: vi.fn(async () => true),
      conversations: {},
      deferNavigation,
      dirtyTabCount: 1,
      hasSelectedFile: true,
      panes: [],
      projectPath: "/repo",
    });

    expect(closed).toBe(false);
    expect(deferNavigation).toHaveBeenCalledOnce();
    expect(closeProject).not.toHaveBeenCalled();
  });
});
