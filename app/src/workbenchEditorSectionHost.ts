import type { MouseEvent } from "react";
import type { ContextMenuItem } from "./ContextMenu";
import type { GitStatusFile } from "./fileGitStatus";
import type { FileTreeNode } from "./fileTreeTypes";
import type { WorkbenchEditorSectionProps } from "./WorkbenchEditorSection";

type Handlers = WorkbenchEditorSectionProps["handlers"];

export const formatBytes = (bytes: number | null) => {
  if (bytes == null) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type WorkbenchEditorSectionInput = {
  contextMenuHost: { openContextMenu: (event: MouseEvent, items: ContextMenuItem[]) => void };
  diffContextMenuItems: () => ContextMenuItem[];
  diffReviewHook: {
    close: () => void; copy: () => Promise<unknown>; error: string | null; loading: boolean;
    review: WorkbenchEditorSectionProps["diff"]["review"];
    runFileAction: (action: "discard" | "stage" | "unstage", file: GitStatusFile) => unknown;
  };
  editorContextMenuItems: () => ContextMenuItem[];
  editorFileWorkflow: { requestOpen: (tab: FileTreeNode, options: { focusEditor: boolean }) => void };
  editorNavigation: { closeActiveTab: () => Promise<unknown>; closeTab: (tab: FileTreeNode) => Promise<unknown> };
  editorSession: {
    editorBytes: number | null; editorCursor: { column: number; line: number }; editorError: string | null;
    editorLoading: boolean; editorRecoveryError: string | null; editorSaving: boolean;
    editorTabs: FileTreeNode[]; editorText: string; selectedFile: FileTreeNode | null;
    setEditorText: Handlers["onChange"];
  };
  editorSurface: {
    openDiffFile: (line: number | null) => Promise<unknown>; openEditorSearch: () => void;
    openExternally: () => Promise<unknown>; overwrite: () => Promise<unknown>;
    reloadFromDisk: () => Promise<unknown>; restoreEditorView: Handlers["onCreateEditor"];
  };
  editorTabContextMenuItems: (tab: FileTreeNode) => ContextMenuItem[];
  editorWorkspace: {
    activeFileMissing: boolean; diffBreadcrumbs: WorkbenchEditorSectionProps["diff"]["breadcrumbs"];
    diffReviewCanDiscard: boolean; diffReviewCanOpenFile: boolean; diffReviewCanStage: boolean;
    diffReviewCanUnstage: boolean; editorBreadcrumbs: WorkbenchEditorSectionProps["editorBreadcrumbs"];
    editorDirty: boolean; editorLanguage: WorkbenchEditorSectionProps["editorLanguage"];
    editorSaveConflict: WorkbenchEditorSectionProps["code"]["conflict"];
  };
  handleEditorUpdate: Handlers["onUpdate"];
  saveEditorFile: () => Promise<unknown>;
  tabIsDirty: (path: string) => boolean;
};

const editorSectionHandlersFrom = (input: WorkbenchEditorSectionInput): Handlers => ({
  closeActiveTab: () => void input.editorNavigation.closeActiveTab(),
  closeDiff: input.diffReviewHook.close,
  closeTab: (tab) => void input.editorNavigation.closeTab(tab),
  copyDiff: () => void input.diffReviewHook.copy(),
  find: input.editorSurface.openEditorSearch,
  onChange: input.editorSession.setEditorText,
  onCreateEditor: input.editorSurface.restoreEditorView,
  onUpdate: input.handleEditorUpdate,
  openContextMenu: (kind, event) => input.contextMenuHost.openContextMenu(
    event, kind === "diff" ? input.diffContextMenuItems() : input.editorContextMenuItems(),
  ),
  openDiff: (line = null) => void input.editorSurface.openDiffFile(line),
  openExternally: () => void input.editorSurface.openExternally(),
  overwrite: () => void input.editorSurface.overwrite(),
  reload: () => void input.editorSurface.reloadFromDisk(),
  runDiffAction: (action) => {
    if (input.diffReviewHook.review) void input.diffReviewHook.runFileAction(action, input.diffReviewHook.review.file);
  },
  save: () => void input.saveEditorFile(),
  selectTab: (tab) => void input.editorFileWorkflow.requestOpen(tab, { focusEditor: true }),
  tabContextMenu: (event, tab) => input.contextMenuHost.openContextMenu(event, input.editorTabContextMenuItems(tab)),
});

export const workbenchEditorSectionPropsFrom = (
  input: WorkbenchEditorSectionInput,
): WorkbenchEditorSectionProps => ({
  activeFileMissing: input.editorWorkspace.activeFileMissing,
  code: {
    conflict: input.editorWorkspace.editorSaveConflict, error: input.editorSession.editorError, loading: input.editorSession.editorLoading,
    recoveryError: input.editorSession.editorRecoveryError, saving: input.editorSession.editorSaving, text: input.editorSession.editorText,
  },
  cursor: input.editorSession.editorCursor,
  diff: {
    breadcrumbs: input.editorWorkspace.diffBreadcrumbs, canDiscard: input.editorWorkspace.diffReviewCanDiscard,
    canOpenFile: input.editorWorkspace.diffReviewCanOpenFile, canStage: input.editorWorkspace.diffReviewCanStage,
    canUnstage: input.editorWorkspace.diffReviewCanUnstage, error: input.diffReviewHook.error,
    loading: input.diffReviewHook.loading, review: input.diffReviewHook.review,
  },
  editorBreadcrumbs: input.editorWorkspace.editorBreadcrumbs,
  editorBytesLabel: formatBytes(input.editorSession.editorBytes),
  editorDirty: input.editorWorkspace.editorDirty,
  editorLanguage: input.editorWorkspace.editorLanguage,
  editorLoading: input.editorSession.editorLoading,
  editorSaving: input.editorSession.editorSaving,
  handlers: editorSectionHandlersFrom(input),
  selectedFile: input.editorSession.selectedFile,
  tabIsDirty: input.tabIsDirty,
  tabs: input.editorSession.editorTabs,
});
