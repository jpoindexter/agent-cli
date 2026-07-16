import type { EditorFileBuffer, EditorFileLoadState } from "./editorFileLoadState";
import { createEditorFileWorkflow } from "./editorFileWorkflow";
import { upsertEditorTab } from "./editorTabs";
import type { CursorPosition, EditorViewState } from "./editorState";
import type { FileTreeNode } from "./fileTreeTypes";

type Ref<T> = { current: T };

type EditorSessionState = {
  captureCurrentEditorBuffer: () => void;
  captureCurrentEditorViewState: () => void;
  editorBuffersRef: Ref<Record<string, EditorFileBuffer>>;
  editorBytes: number | null;
  editorLoadSeq: Ref<number>;
  editorModifiedMs: number | null;
  editorRecoveryError: string | null;
  editorSaving: boolean;
  editorText: string;
  editorViewRef: Ref<{ focus: () => void } | null>;
  editorViewStatesRef: Ref<Record<string, EditorViewState>>;
  pendingEditorFocusRef: Ref<boolean>;
  savedEditorText: string;
  selectedFile: FileTreeNode | null;
  selectedFileRef: Ref<FileTreeNode | null>;
  setEditorBufferRevision: (update: (value: number) => number) => void;
  setEditorBytes: (bytes: number | null) => void;
  setEditorCursor: (cursor: CursorPosition) => void;
  setEditorError: (error: string | null) => void;
  setEditorLoading: (loading: boolean) => void;
  setEditorModifiedMs: (modifiedMs: number | null) => void;
  setEditorRecoveryError: (error: string | null) => void;
  setEditorSaving: (saving: boolean) => void;
  setEditorTabs: (update: (tabs: FileTreeNode[]) => FileTreeNode[]) => void;
  setEditorText: (text: string) => void;
  setSavedEditorText: (text: string) => void;
  setSelectedFile: (file: FileTreeNode | null) => void;
};

type EditorFileWorkflowDeps = {
  closeDiffReview: () => void;
  gateAction: Parameters<typeof createEditorFileWorkflow>[0]["gateAction"];
  getDirty: () => boolean;
  getRoot: () => string | null;
  persistActiveFile: Parameters<typeof createEditorFileWorkflow>[0]["persistActiveFile"];
  recordEdit: (file: FileTreeNode) => void;
};

const stateHandlers = (editor: EditorSessionState) => ({
  applyState: (state: EditorFileLoadState) => {
    editor.setEditorText(state.text);
    editor.setSavedEditorText(state.savedText);
    editor.setEditorBytes(state.bytes);
    editor.setEditorModifiedMs(state.modifiedMs);
    editor.setEditorError(state.error);
    editor.setEditorRecoveryError(state.recoveryError);
    editor.setEditorCursor(state.cursor);
  },
  onSaveSuccess: (result: { bytes: number | null; content: string; modifiedMs: number | null }) => {
    editor.setSavedEditorText(result.content);
    editor.setEditorBytes(result.bytes);
    editor.setEditorModifiedMs(result.modifiedMs);
  },
  prepareRead: () => {
    editor.setEditorError(null);
    editor.setEditorRecoveryError(null);
    editor.setEditorBytes(null);
    editor.setEditorModifiedMs(null);
    editor.setEditorCursor({ line: 1, column: 1 });
  },
  prepareSave: () => { editor.setEditorError(null); editor.setEditorRecoveryError(null); },
});

const openHandlers = (editor: EditorSessionState, deps: EditorFileWorkflowDeps) => ({
  beginOpen: (file: FileTreeNode, focusEditor: boolean) => {
    deps.closeDiffReview();
    editor.captureCurrentEditorViewState();
    editor.captureCurrentEditorBuffer();
    editor.pendingEditorFocusRef.current = focusEditor;
    editor.setEditorTabs((tabs) => upsertEditorTab(tabs, file));
    editor.setSelectedFile(file);
    editor.setEditorSaving(false);
  },
  onCurrentFile: (focusEditor: boolean) => {
    deps.closeDiffReview();
    if (focusEditor) requestAnimationFrame(() => editor.editorViewRef.current?.focus());
  },
});

const saveStateFrom = (editor: EditorSessionState, deps: EditorFileWorkflowDeps) => ({
  bytes: editor.editorBytes,
  dirty: deps.getDirty(),
  file: editor.selectedFile,
  modifiedMs: editor.editorModifiedMs,
  recoveryError: editor.editorRecoveryError,
  root: deps.getRoot(),
  savedText: editor.savedEditorText,
  saving: editor.editorSaving,
  text: editor.editorText,
});

export const wireEditorFileWorkflow = (
  editor: EditorSessionState,
  deps: EditorFileWorkflowDeps,
) => createEditorFileWorkflow({
  ...stateHandlers(editor),
  ...openHandlers(editor, deps),
  buffers: editor.editorBuffersRef,
  bumpBufferRevision: () => editor.setEditorBufferRevision((value) => value + 1),
  focusEditor: () => editor.editorViewRef.current?.focus(),
  gateAction: deps.gateAction,
  getActiveFilePath: () => editor.selectedFileRef.current?.path ?? null,
  getRoot: deps.getRoot,
  getSaveState: () => saveStateFrom(editor, deps),
  loadSequence: editor.editorLoadSeq,
  onSaveError: editor.setEditorError,
  persistActiveFile: deps.persistActiveFile,
  recordEdit: deps.recordEdit,
  setLoading: editor.setEditorLoading,
  setSaving: editor.setEditorSaving,
  viewStates: editor.editorViewStatesRef,
});
