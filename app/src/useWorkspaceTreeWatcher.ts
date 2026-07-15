import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";

export type WorkspaceTreeChange = { root: string; count: number };
export type WorkspaceTreeSubscriber = (
  handler: (change: WorkspaceTreeChange) => void,
) => Promise<() => void>;

type WorkspaceTreeWatcherOptions = {
  getActiveRoot: () => string | null;
  onChange: () => void;
  onError: (error: string) => void;
  subscribe?: WorkspaceTreeSubscriber;
  watch?: (path: string) => Promise<unknown>;
  workspacePath: string | null;
};

const subscribeNative: WorkspaceTreeSubscriber = (handler) =>
  listen<WorkspaceTreeChange>("workspace-tree-changed", (event) => handler(event.payload));
const watchNative = (path: string) => invoke("watch_workspace_tree", { path });

export function useWorkspaceTreeWatcher(options: WorkspaceTreeWatcherOptions) {
  const latest = useRef(options);
  latest.current = options;
  const subscribe = options.subscribe ?? subscribeNative;
  const watch = options.watch ?? watchNative;
  useEffect(() => {
    if (!options.workspacePath) return;
    let cancelled = false;
    void watch(options.workspacePath).catch((error) => {
      if (!cancelled) latest.current.onError(String(error));
    });
    return () => { cancelled = true; };
  }, [options.workspacePath, watch]);
  useEffect(() => {
    let disposed = false;
    let removeListener: (() => void) | null = null;
    void subscribe((change) => {
      if (latest.current.getActiveRoot() === change.root) latest.current.onChange();
    }).then((remove) => {
      if (disposed) remove();
      else removeListener = remove;
    });
    return () => {
      disposed = true;
      removeListener?.();
    };
  }, [subscribe]);
}
