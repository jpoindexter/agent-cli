import { describe, expect, it, vi } from "vitest";
import type { FileTreeNode } from "./fileTreeTypes";
import {
  buildFileNodeContextMenuItems,
  buildProjectRailContextMenuItems,
  buildWorkspaceContextMenuItems,
} from "./workspaceContextMenus";

const node: FileTreeNode = {
  gitStatus: {
    code: "modified", index: " ", label: "Modified",
    relativePath: "src/App.tsx", token: "M", worktree: "M",
  },
  id: "/repo/src/App.tsx",
  kind: "file",
  name: "App.tsx",
  path: "/repo/src/App.tsx",
};

const createActions = () => ({
  closeProject: vi.fn(),
  copyPath: vi.fn(),
  deleteNode: vi.fn(),
  duplicateNode: vi.fn(),
  newFile: vi.fn(),
  newFolder: vi.fn(),
  openDiff: vi.fn(),
  openWorkspace: vi.fn(),
  renameNode: vi.fn(),
  revealNode: vi.fn(),
  revealPath: vi.fn(),
  runGitAction: vi.fn(),
  shortcut: vi.fn(() => "Cmd+O"),
  switchProject: vi.fn(),
});

describe("workspace context menus", () => {
  it("builds Git and file actions with destructive affordances", () => {
    const actions = createActions();
    const items = buildFileNodeContextMenuItems(node, actions);

    items.find((item) => item.id === "git.diff")?.onSelect();
    items.find((item) => item.id === "git.stage")?.onSelect();
    items.find((item) => item.id === "file.new")?.onSelect();
    items.find((item) => item.id === "file.delete")?.onSelect();

    expect(actions.openDiff).toHaveBeenCalledWith(expect.objectContaining({ path: "src/App.tsx" }));
    expect(actions.runGitAction).toHaveBeenCalledWith("stage", expect.objectContaining({ path: "src/App.tsx" }));
    expect(actions.newFile).toHaveBeenCalledWith(node);
    expect(actions.deleteNode).toHaveBeenCalledWith(node);
    expect(items.find((item) => item.id === "git.unstage")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "file.delete")?.danger).toBe(true);
  });

  it("disables workspace-dependent actions until a workspace is open", () => {
    const actions = createActions();
    const closed = buildWorkspaceContextMenuItems(null, actions);
    const open = buildWorkspaceContextMenuItems("/repo", actions);

    expect(closed.find((item) => item.id === "workspace.new-file")?.disabled).toBe(true);
    expect(closed.find((item) => item.id === "workspace.reveal")?.disabled).toBe(true);
    open.find((item) => item.id === "workspace.reveal")?.onSelect();
    expect(actions.revealPath).toHaveBeenCalledWith("/repo");
  });

  it("routes project actions and disables switching the active project", () => {
    const actions = createActions();
    const project = { path: "/repo", status: "exited" as const };
    const items = buildProjectRailContextMenuItems(project, "/repo", actions);

    expect(items.find((item) => item.id === "project.switch")?.disabled).toBe(true);
    items.find((item) => item.id === "project.copy-path")?.onSelect();
    items.find((item) => item.id === "project.close")?.onSelect();
    expect(actions.copyPath).toHaveBeenCalledWith("/repo");
    expect(actions.closeProject).toHaveBeenCalledWith(project);
    expect(items.find((item) => item.id === "project.close")?.danger).toBe(true);
  });
});
