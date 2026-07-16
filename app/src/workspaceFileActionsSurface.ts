import type { EditorFileBuffer } from "./editorFileLoadState";
import type { EditorViewState } from "./editorState";
import {
  removeEditorBuffersWithin,
  removeEditorTabsWithin,
  retargetEditorBuffers,
  retargetEditorTabs,
} from "./editorTabs";
import type { FileTreeNode } from "./fileTreeTypes";
import { createWorkspaceFileActions } from "./workspaceFileActions";

const basename = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;

type Ref<T> = { current: T };

type EditorTabsState = {
  editorBuffersRef: Ref<Record<string, EditorFileBuffer>>;
  editorTabs: FileTreeNode[];
  editorViewStatesRef: Ref<Record<string, EditorViewState>>;
  resetEditor: () => void;
  selectedFileRef: Ref<FileTreeNode | null>;
  setEditorBufferRevision: (update: (value: number) => number) => void;
  setEditorTabs: (tabs: FileTreeNode[] | ((tabs: FileTreeNode[]) => FileTreeNode[])) => void;
  setSelectedFile: (file: FileTreeNode | null) => void;
};

type WorkspaceFileSurfaceDeps = {
  clearPersistedActiveFile: (root: string) => unknown;
  getPersistRoot: () => string | null;
  openFileDirect: (file: FileTreeNode, options: { focusEditor: boolean }) => Promise<unknown>;
};

export const workspaceFileRenameHandler = (
  editor: EditorTabsState, deps: WorkspaceFileSurfaceDeps,
) => async (node: FileTreeNode, nextPath: string, affectedSelectedFile: FileTreeNode | null) => {
  editor.setEditorTabs((tabs) => retargetEditorTabs(tabs, node.path, nextPath, basename));
  editor.editorBuffersRef.current = retargetEditorBuffers(editor.editorBuffersRef.current, node.path, nextPath);
  editor.editorViewStatesRef.current = retargetEditorBuffers(editor.editorViewStatesRef.current, node.path, nextPath);
  editor.setEditorBufferRevision((value) => value + 1);
  if (!affectedSelectedFile) return;
  const selectedPath = affectedSelectedFile.path === node.path
    ? nextPath : `${nextPath}${affectedSelectedFile.path.slice(node.path.length)}`;
  editor.selectedFileRef.current = null;
  editor.setSelectedFile(null);
  await deps.openFileDirect(
    { id: selectedPath, kind: "file", name: basename(selectedPath), path: selectedPath },
    { focusEditor: true },
  );
};

export const workspaceFileDeleteHandler = (
  editor: EditorTabsState, deps: WorkspaceFileSurfaceDeps,
) => async (node: FileTreeNode, affectedSelectedFile: FileTreeNode | null) => {
  const nextTabs = removeEditorTabsWithin(editor.editorTabs, node.path);
  editor.editorBuffersRef.current = removeEditorBuffersWithin(editor.editorBuffersRef.current, node.path);
  editor.editorViewStatesRef.current = removeEditorBuffersWithin(editor.editorViewStatesRef.current, node.path);
  editor.setEditorTabs(nextTabs);
  editor.setEditorBufferRevision((value) => value + 1);
  if (!affectedSelectedFile) return;
  const nextTab = nextTabs[0] ?? null;
  if (nextTab) {
    editor.selectedFileRef.current = null;
    editor.setSelectedFile(null);
    await deps.openFileDirect(nextTab, { focusEditor: true });
    return;
  }
  const persistRoot = deps.getPersistRoot();
  if (persistRoot) void deps.clearPersistedActiveFile(persistRoot);
  editor.resetEditor();
};

type WireDeps = WorkspaceFileSurfaceDeps & {
  getDirty: () => boolean;
  getRoot: () => string | null;
  getSelectedFile: () => FileTreeNode | null;
  refresh: () => void;
  requestOpenFile: (file: FileTreeNode, options: { focusEditor: boolean }) => Promise<unknown>;
  setError: (error: string | null) => void;
};

export const wireWorkspaceFileActions = (editor: EditorTabsState, deps: WireDeps) =>
  createWorkspaceFileActions({
    editorDirty: deps.getDirty(),
    getRoot: deps.getRoot,
    getSelectedFile: deps.getSelectedFile,
    onOpenFile: async (file) => { await deps.requestOpenFile(file, { focusEditor: true }); },
    onRename: workspaceFileRenameHandler(editor, deps),
    onDelete: workspaceFileDeleteHandler(editor, deps),
    refresh: deps.refresh,
    setError: deps.setError,
  });
