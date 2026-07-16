import { createSessionCheckpointActions } from "./sessionCheckpointActions";
import type { FileTreeNode } from "./fileTreeTypes";

type Ref<T> = { current: T };

type CheckpointEditorState = {
  editorBuffersRef: Ref<Record<string, unknown>>;
  selectedFileRef: Ref<FileTreeNode | null>;
  setEditorBufferRevision: (update: (value: number) => number) => void;
  setEditorText: (text: string) => void;
  setSavedEditorText: (text: string) => void;
  setSelectedFile: (file: FileTreeNode | null) => void;
};

type ReconcileDeps = {
  openFileDirect: (file: FileTreeNode) => Promise<unknown>;
};

export const checkpointClearBuffersHandler = (editor: CheckpointEditorState) =>
  (paths: Set<string>) => {
    for (const path of paths) delete editor.editorBuffersRef.current[path];
    editor.setEditorBufferRevision((revision) => revision + 1);
  };

export const checkpointReconcileHandler = (editor: CheckpointEditorState, deps: ReconcileDeps) =>
  async (activeFile: FileTreeNode | null, action: "write" | "delete" | null) => {
    if (!activeFile || !action) return;
    if (action === "delete") {
      editor.setSelectedFile(null);
      editor.setEditorText("");
      editor.setSavedEditorText("");
      return;
    }
    await deps.openFileDirect(activeFile);
  };

type WireDeps = ReconcileDeps & {
  gateAction: Parameters<typeof createSessionCheckpointActions>[0]["gateAction"];
  getDirtyTabPaths: () => string[];
  getWorkspacePath: () => string | null;
  onMetadata: Parameters<typeof createSessionCheckpointActions>[0]["onMetadata"];
  refreshFiles: () => void;
  refreshGit: () => Promise<unknown>;
  setError: (error: string | null) => void;
  setNotice: (notice: string | null) => void;
};

export const wireSessionCheckpointActions = (
  editor: CheckpointEditorState,
  deps: WireDeps,
) => createSessionCheckpointActions({
  gateAction: deps.gateAction,
  getDirtyTabPaths: deps.getDirtyTabPaths,
  getSelectedFile: () => editor.selectedFileRef.current,
  getWorkspacePath: deps.getWorkspacePath,
  onClearBuffers: checkpointClearBuffersHandler(editor),
  onMetadata: deps.onMetadata,
  onReconcile: checkpointReconcileHandler(editor, deps),
  refreshFiles: deps.refreshFiles,
  refreshGit: deps.refreshGit,
  setError: deps.setError,
  setNotice: deps.setNotice,
});
