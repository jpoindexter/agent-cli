import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

import type { GitStatusFile } from "./fileGitStatus";

export type GitStatusResponse = {
  isRepository: boolean;
  branch: string | null;
  ahead: number;
  behind: number;
  staged: number;
  unstaged: number;
  untracked: number;
  files: GitStatusFile[];
};

type UseGitStatusOptions = {
  active: boolean;
  readStatus?: (root: string) => Promise<GitStatusResponse>;
  refreshKey: number;
  resolveRoot: () => string | null;
  workspacePath: string | null;
};

const readNativeGitStatus = (root: string) => invoke<GitStatusResponse>("git_status", { root });

export function useGitStatus(options: UseGitStatusOptions) {
  const [status, setStatus] = useState<GitStatusResponse | null>(null);
  const [root, setRoot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    const nextRoot = options.resolveRoot();
    if (!nextRoot) {
      setStatus(null);
      setRoot(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setStatus(await (options.readStatus ?? readNativeGitStatus)(nextRoot));
      setRoot(nextRoot);
    } catch (nextError) {
      setError(String(nextError));
      setStatus(null);
      setRoot(nextRoot);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (options.active) void refresh();
  }, [options.active, options.refreshKey, options.workspacePath]);
  return { error, loading, refresh, root, setRoot, setStatus, status };
}
