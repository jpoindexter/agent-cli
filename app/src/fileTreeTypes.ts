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
