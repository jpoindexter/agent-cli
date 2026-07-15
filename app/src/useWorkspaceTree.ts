import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";

import type { FileTreeNode, FileTreeResponse } from "./fileTreeTypes";

type UseWorkspaceTreeOptions = {
  onClearWorkspace: () => void;
  onRootResolved: (root: string) => void;
  readTree?: (path: string) => Promise<FileTreeResponse>;
  workspacePath: string | null;
};

const readNativeTree = (path: string) => invoke<FileTreeResponse>("list_workspace_tree", { path });

export function useWorkspaceTree(options: UseWorkspaceTreeOptions) {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [revision, setRevision] = useState(0);
  const latest = useRef(options);
  latest.current = options;
  const readTree = options.readTree ?? readNativeTree;
  useEffect(() => {
    const path = options.workspacePath;
    if (!path) {
      setTree([]);
      setError(null);
      setTruncated(false);
      latest.current.onClearWorkspace();
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void readTree(path).then((result) => {
      if (cancelled) return;
      latest.current.onRootResolved(result.root);
      setTree(result.nodes);
      setTruncated(result.truncated);
    }).catch((nextError) => {
      if (cancelled) return;
      setTree([]);
      setError(String(nextError));
      setTruncated(false);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [options.workspacePath, readTree, revision]);
  return {
    error, loading, refresh: () => setRevision((value) => value + 1),
    refreshKey: revision, setError, setTree, tree, truncated,
  };
}
