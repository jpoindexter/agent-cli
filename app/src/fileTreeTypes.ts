import type { FileGitStatus } from "./fileGitStatus";

export type FileTreeNode = {
  id: string;
  name: string;
  path: string;
  kind: "directory" | "file";
  dirty?: boolean;
  gitStatus?: FileGitStatus;
  children?: FileTreeNode[];
};

export type FileTreeResponse = { root: string; nodes: FileTreeNode[]; truncated: boolean };

export const pathBasename = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;

export const fileTreeNodeFromPath = (path: string, kind: FileTreeNode["kind"]): FileTreeNode => ({
  id: path, kind, name: pathBasename(path), path,
});
