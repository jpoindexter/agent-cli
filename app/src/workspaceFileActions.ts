import { invoke } from "@tauri-apps/api/core";
import { confirm as confirmDialog } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";

import type { FileTreeNode } from "./fileTreeTypes";

type FileOpResponse = { path: string };
type ErrorSetter = (value: string | null) => void;

export type WorkspaceFileActionServices = {
  confirm: (message: string) => Promise<boolean>;
  createFile: (root: string, parent: string, name: string) => Promise<FileOpResponse>;
  createFolder: (root: string, parent: string, name: string) => Promise<FileOpResponse>;
  deletePath: (root: string, path: string) => Promise<void>;
  duplicatePath: (root: string, path: string) => Promise<FileOpResponse>;
  prompt: (message: string, value?: string) => string | null;
  renamePath: (root: string, path: string, name: string) => Promise<FileOpResponse>;
  revealPath: (path: string) => Promise<void>;
};

type WorkspaceFileActionOptions = {
  editorDirty: boolean;
  getRoot: () => string | null;
  getSelectedFile: () => FileTreeNode | null;
  onDelete: (node: FileTreeNode, selectedFile: FileTreeNode | null) => Promise<void>;
  onOpenFile: (file: FileTreeNode) => Promise<void>;
  onRename: (node: FileTreeNode, nextPath: string, selectedFile: FileTreeNode | null) => Promise<void>;
  refresh: () => void;
  services?: WorkspaceFileActionServices;
  setError: ErrorSetter;
};

type ActionContext = WorkspaceFileActionOptions & { services: WorkspaceFileActionServices };

const basename = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;
const dirname = (path: string) => path.replace(/[\\/][^\\/]+$/, "");
const fileNode = (path: string, kind: FileTreeNode["kind"]): FileTreeNode => ({
  id: path, kind, name: basename(path), path,
});
const selectedWithin = (node: FileTreeNode, selected: FileTreeNode | null) =>
  selected != null && (selected.path === node.path || selected.path.startsWith(`${node.path}/`));
const parentFor = (root: string, node: FileTreeNode | null) =>
  !node ? root : node.kind === "directory" ? node.path : dirname(node.path);

const nativeServices: WorkspaceFileActionServices = {
  confirm: (message) => confirmDialog(message),
  createFile: (root, parent, name) => invoke<FileOpResponse>("create_workspace_file", { root, parent, name }),
  createFolder: (root, parent, name) => invoke<FileOpResponse>("create_workspace_folder", { root, parent, name }),
  deletePath: (root, path) => invoke<void>("delete_workspace_path", { root, path }),
  duplicatePath: (root, path) => invoke<FileOpResponse>("duplicate_workspace_path", { root, path }),
  prompt: (message, value) => window.prompt(message, value),
  renamePath: (root, path, name) => invoke<FileOpResponse>("rename_workspace_path", { root, path, name }),
  revealPath: (path) => revealItemInDir(path),
};

const createFile = async (context: ActionContext, node: FileTreeNode | null) => {
  const root = context.getRoot();
  if (!root) return;
  const name = context.services.prompt("New file name");
  if (!name) return;
  context.setError(null);
  try {
    const result = await context.services.createFile(root, parentFor(root, node), name);
    context.refresh();
    await context.onOpenFile(fileNode(result.path, "file"));
  } catch (error) {
    context.setError(String(error));
  }
};

const createFolder = async (context: ActionContext, node: FileTreeNode | null) => {
  const root = context.getRoot();
  if (!root) return;
  const name = context.services.prompt("New folder name");
  if (!name) return;
  context.setError(null);
  try {
    await context.services.createFolder(root, parentFor(root, node), name);
    context.refresh();
  } catch (error) {
    context.setError(String(error));
  }
};

const rename = async (context: ActionContext, node: FileTreeNode) => {
  const root = context.getRoot();
  if (!root) return;
  const selected = context.getSelectedFile();
  const affected = selectedWithin(node, selected);
  if (affected && context.editorDirty && !await context.services.confirm("Rename this item and discard the unsaved editor buffer?")) return;
  const name = context.services.prompt("Rename to", node.name);
  if (!name || name === node.name) return;
  context.setError(null);
  try {
    const result = await context.services.renamePath(root, node.path, name);
    await context.onRename(node, result.path, affected ? selected : null);
    context.refresh();
  } catch (error) {
    context.setError(String(error));
  }
};

const deleteNode = async (context: ActionContext, node: FileTreeNode) => {
  const root = context.getRoot();
  if (!root) return;
  const selected = context.getSelectedFile();
  const affected = selectedWithin(node, selected);
  const kind = node.kind === "directory" ? "folder" : "file";
  if (!await context.services.confirm(`Delete ${kind} "${node.name}"? This cannot be undone.`)) return;
  if (affected && context.editorDirty && !await context.services.confirm("The selected file has unsaved changes. Delete anyway?")) return;
  context.setError(null);
  try {
    await context.services.deletePath(root, node.path);
    await context.onDelete(node, affected ? selected : null);
    context.refresh();
  } catch (error) {
    context.setError(String(error));
  }
};

const duplicate = async (context: ActionContext, node: FileTreeNode) => {
  const root = context.getRoot();
  if (!root) return;
  context.setError(null);
  try {
    await context.services.duplicatePath(root, node.path);
    context.refresh();
  } catch (error) {
    context.setError(String(error));
  }
};

const reveal = async (context: ActionContext, node: FileTreeNode) => {
  context.setError(null);
  try {
    await context.services.revealPath(node.path);
  } catch (error) {
    context.setError(`Could not reveal ${node.name}: ${error}`);
  }
};

export const createWorkspaceFileActions = (options: WorkspaceFileActionOptions) => {
  const context = { ...options, services: options.services ?? nativeServices };
  return {
    createFile: (node: FileTreeNode | null = null) => createFile(context, node),
    createFolder: (node: FileTreeNode | null = null) => createFolder(context, node),
    delete: (node: FileTreeNode) => deleteNode(context, node),
    duplicate: (node: FileTreeNode) => duplicate(context, node),
    rename: (node: FileTreeNode) => rename(context, node),
    reveal: (node: FileTreeNode) => reveal(context, node),
  };
};
