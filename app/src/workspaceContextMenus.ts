import type { ContextMenuItem } from "./ContextMenu";
import type { GitStatusFile } from "./fileGitStatus";
import type { FileTreeNode } from "./fileTreeTypes";
import type { AppIconName } from "./icons";
import type { OpenProject } from "./workspaceState";
import { PROJECT_ENTRY_LABELS } from "./projectEntryActions";

type MenuOptions = {
  danger?: boolean;
  disabled?: boolean;
  icon?: AppIconName;
  shortcut?: string;
};

type FileGitAction = "stage" | "unstage" | "discard";

export type WorkspaceContextMenuActions = {
  closeProject: (project: OpenProject) => unknown;
  copyPath: (path: string) => unknown;
  deleteNode: (node: FileTreeNode) => unknown;
  duplicateNode: (node: FileTreeNode) => unknown;
  newFile: (node?: FileTreeNode) => unknown;
  newFolder: (node?: FileTreeNode) => unknown;
  openDiff: (file: GitStatusFile) => unknown;
  openWorkspace: () => unknown;
  renameNode: (node: FileTreeNode) => unknown;
  revealNode: (node: FileTreeNode) => unknown;
  revealPath: (path: string) => unknown;
  runGitAction: (action: FileGitAction, file: GitStatusFile) => unknown;
  shortcut: (id: string) => string;
  switchProject: (project: OpenProject) => unknown;
};

const menuItem = (
  id: string,
  label: string,
  onSelect: () => unknown,
  options: MenuOptions = {},
): ContextMenuItem => ({ id, label, onSelect, ...options });

export const buildGitFileContextMenuItems = (
  file: GitStatusFile,
  actions: WorkspaceContextMenuActions,
): ContextMenuItem[] => [
  menuItem("git.diff", "Open Diff", () => actions.openDiff(file), { icon: "git" }),
  menuItem("git.stage", "Stage File", () => actions.runGitAction("stage", file), {
    icon: "git", disabled: !(file.index === "?" || file.worktree !== " "),
  }),
  menuItem("git.unstage", "Unstage File", () => actions.runGitAction("unstage", file), {
    icon: "git", disabled: file.index === " " || file.index === "?",
  }),
  menuItem("git.discard", "Discard Unstaged Changes", () => actions.runGitAction("discard", file), {
    icon: "error", danger: true, disabled: !(file.index === "?" || file.worktree !== " "),
  }),
];

export const buildFileNodeContextMenuItems = (
  node: FileTreeNode,
  actions: WorkspaceContextMenuActions,
): ContextMenuItem[] => {
  const gitItems = node.gitStatus ? buildGitFileContextMenuItems({
    path: node.gitStatus.relativePath,
    index: node.gitStatus.index,
    worktree: node.gitStatus.worktree,
  }, actions) : [];
  return [
    ...gitItems,
    menuItem("file.new", "New File", () => actions.newFile(node), { icon: "filePlus" }),
    menuItem("folder.new", "New Folder", () => actions.newFolder(node), { icon: "folderPlus" }),
    menuItem("file.rename", "Rename", () => actions.renameNode(node), { icon: "file" }),
    menuItem("file.duplicate", "Duplicate", () => actions.duplicateNode(node), { icon: "file" }),
    menuItem("file.reveal", "Reveal in Finder", () => actions.revealNode(node), { icon: "folderOpen" }),
    menuItem("file.copy-path", "Copy Path", () => actions.copyPath(node.path), { icon: "file" }),
    menuItem("file.delete", "Delete", () => actions.deleteNode(node), { icon: "error", danger: true }),
  ];
};

export const buildWorkspaceContextMenuItems = (
  workspacePath: string | null,
  actions: WorkspaceContextMenuActions,
): ContextMenuItem[] => [
  menuItem("workspace.open", PROJECT_ENTRY_LABELS.openProject, actions.openWorkspace, {
    icon: "folderOpen", shortcut: actions.shortcut("workspace.open"),
  }),
  menuItem("workspace.new-file", "New File", () => actions.newFile(), {
    icon: "filePlus", disabled: !workspacePath,
  }),
  menuItem("workspace.new-folder", "New Folder", () => actions.newFolder(), {
    icon: "folderPlus", disabled: !workspacePath,
  }),
  menuItem("workspace.reveal", "Reveal in Finder", () => workspacePath && actions.revealPath(workspacePath), {
    icon: "folderOpen", disabled: !workspacePath,
  }),
  menuItem("workspace.copy-path", "Copy Workspace Path", () => workspacePath && actions.copyPath(workspacePath), {
    icon: "workspace", disabled: !workspacePath,
  }),
];

export const buildProjectRailContextMenuItems = (
  project: OpenProject,
  workspacePath: string | null,
  actions: WorkspaceContextMenuActions,
): ContextMenuItem[] => [
  menuItem("project.switch", "Switch to Project", () => actions.switchProject(project), {
    icon: "workspace", disabled: project.path === workspacePath,
  }),
  menuItem("project.reveal", "Reveal in Finder", () => actions.revealPath(project.path), { icon: "folderOpen" }),
  menuItem("project.copy-path", "Copy Path", () => actions.copyPath(project.path), { icon: "file" }),
  menuItem("project.close", "Close Project", () => actions.closeProject(project), {
    icon: "close", danger: true,
  }),
];
