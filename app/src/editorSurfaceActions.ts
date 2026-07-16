import { createEditorFileUtilityActions } from "./editorFileUtilityActions";
import { createEditorReviewNavigation } from "./editorReviewNavigation";
import type { CursorPosition, EditorViewState } from "./editorState";
import { createEditorViewLifecycle } from "./editorViewLifecycle";

type Ref<T> = { current: T };

type SurfaceViewLike<TEffect> = {
  dispatch: (spec:
    | { effects: TEffect; selection: { anchor: number } }
    | { scrollIntoView: boolean; selection: { anchor: number; head: number } },
  ) => void;
  focus: () => void;
  hasFocus: boolean;
  scrollDOM: { scrollTop: number };
  state: { doc: { length: number; line: (line: number) => { from: number }; lines: number } };
};

type EditorSurfaceState<TFile extends { name: string; path: string }, TView> = {
  editorBuffersRef: Ref<Record<string, { savedText: string; text: string }>>;
  editorText: string;
  editorViewRef: Ref<TView | null>;
  editorViewStatesRef: Ref<Record<string, EditorViewState>>;
  pendingEditorFocusRef: Ref<boolean>;
  savedEditorText: string;
  selectedFileRef: Ref<TFile | null>;
  setEditorCursor: (cursor: CursorPosition) => void;
  setEditorRecoveryError: (error: string | null) => void;
};

type EditorSurfaceDeps<TFile extends { name: string; path: string }, TView, TGitFile extends { path: string }, TEffect> = {
  copyText: (text: string) => Promise<unknown>;
  getDiffReviewPath: () => string | null;
  getGitFiles: () => TGitFile[];
  getRoot: () => string | null;
  makeFileNode: (path: string) => TFile;
  notify: (message: string) => void;
  openExternal: (path: string) => Promise<unknown>;
  openFileDirect: (file: TFile, options: { focusEditor: boolean }) => Promise<unknown>;
  openGitDiff: (file: TGitFile) => Promise<boolean>;
  openSearchPanel: (view: TView) => void;
  requestOpenFile: (file: TFile, options: { focusEditor: boolean }) => Promise<boolean>;
  revealEditorTools: () => void;
  revealInDir: (path: string) => Promise<unknown>;
  saveFile: (options: { force: boolean }) => Promise<unknown>;
  schedule: (callback: () => void, delayMs: number) => void;
  scheduleFrame: (callback: () => void) => void;
  scrollEffect: (position: number) => TEffect;
};

export const createEditorSurfaceActions = <
  TFile extends { name: string; path: string },
  TView extends SurfaceViewLike<TEffect>,
  TGitFile extends { path: string },
  TEffect,
>(
  editor: EditorSurfaceState<TFile, TView>,
  deps: EditorSurfaceDeps<TFile, TView, TGitFile, TEffect>,
) => {
  const viewLifecycle = wireViewLifecycle(editor, deps);
  const utilities = wireUtilities(editor, deps);
  const navigation = wireNavigation(editor, deps);
  return {
    copyPath: utilities.copyPath,
    editorHasUnsavedBufferForPath: navigation.hasUnsavedBufferForPath,
    handleEditorUpdate: viewLifecycle.handleEditorUpdate,
    openDiffFile: navigation.openDiffFile,
    openEditorSearch: utilities.openSearch,
    openExternally: utilities.openExternally,
    overwrite: utilities.overwrite,
    reloadFromDisk: utilities.reloadFromDisk,
    restoreEditorView: viewLifecycle.restoreEditorView,
    reveal: utilities.reveal,
    reviewRunCardFile: navigation.reviewRunCardFile,
  };
};

const wireViewLifecycle = <
  TFile extends { name: string; path: string },
  TView extends SurfaceViewLike<TEffect>,
  TGitFile extends { path: string },
  TEffect,
>(
  editor: EditorSurfaceState<TFile, TView>,
  deps: EditorSurfaceDeps<TFile, TView, TGitFile, TEffect>,
) => createEditorViewLifecycle<TView>({
  getSelectedFilePath: () => editor.selectedFileRef.current?.path ?? null,
  pendingFocus: editor.pendingEditorFocusRef,
  scheduleFrame: deps.scheduleFrame,
  setCursor: editor.setEditorCursor,
  setView: (view) => { editor.editorViewRef.current = view; },
  viewStates: editor.editorViewStatesRef,
});

const wireUtilities = <
  TFile extends { name: string; path: string },
  TView extends SurfaceViewLike<TEffect>,
  TGitFile extends { path: string },
  TEffect,
>(
  editor: EditorSurfaceState<TFile, TView>,
  deps: EditorSurfaceDeps<TFile, TView, TGitFile, TEffect>,
) => createEditorFileUtilityActions<TFile, TView>({
  copyText: deps.copyText,
  getSelectedFile: () => editor.selectedFileRef.current,
  getView: () => editor.editorViewRef.current,
  notify: deps.notify,
  openExternal: deps.openExternal,
  openFileDirect: deps.openFileDirect,
  openSearchPanel: deps.openSearchPanel,
  revealInDir: deps.revealInDir,
  saveFile: deps.saveFile,
  scheduleFrame: deps.scheduleFrame,
  setRecoveryError: editor.setEditorRecoveryError,
});

const wireNavigation = <
  TFile extends { name: string; path: string },
  TView extends SurfaceViewLike<TEffect>,
  TGitFile extends { path: string },
  TEffect,
>(
  editor: EditorSurfaceState<TFile, TView>,
  deps: EditorSurfaceDeps<TFile, TView, TGitFile, TEffect>,
) => createEditorReviewNavigation<TFile, TGitFile, TEffect>({
  buffers: editor.editorBuffersRef,
  getDiffReviewPath: deps.getDiffReviewPath,
  getEditorText: () => editor.editorText,
  getGitFiles: deps.getGitFiles,
  getRoot: deps.getRoot,
  getSavedText: () => editor.savedEditorText,
  getSelectedPath: () => editor.selectedFileRef.current?.path ?? null,
  getView: () => editor.editorViewRef.current,
  makeFileNode: deps.makeFileNode,
  openGitDiff: deps.openGitDiff,
  requestOpenFile: deps.requestOpenFile,
  revealEditorTools: deps.revealEditorTools,
  schedule: deps.schedule,
  scrollEffect: deps.scrollEffect,
});
