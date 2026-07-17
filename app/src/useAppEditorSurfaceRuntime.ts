import { openSearchPanel } from "@codemirror/search";
import { EditorView, type ViewUpdate } from "@codemirror/view";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { confirm as confirmDialog } from "@tauri-apps/plugin-dialog";
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import type { deriveActiveAgentSessionState } from "./activeAgentSessionState";
import type { createProjectCloseController } from "./projectCloseController";
import type { deriveEditorWorkspaceState } from "./editorWorkspaceState";
import { createEditorSurfaceActions } from "./editorSurfaceActions";
import { wireEditorFileWorkflow } from "./editorFileWorkflowSurface";
import { fileTreeNodeFromPath, type FileTreeNode } from "./fileTreeTypes";
import type { GitStatusFile } from "./fileGitStatus";
import { useEditorNavigationLifecycle } from "./useEditorNavigationLifecycle";
import type { useAppShellDomain } from "./useAppShellDomain";
import type { useConversationRuntime } from "./useConversationRuntime";
import type { useEditorSessionController } from "./useEditorSessionController";
import type { ProjectEditorSnapshot } from "./useEditorSessionController";
import type { useGitDiffReview } from "./useGitDiffReview";
import type { useWorkspacePersistenceController } from "./useWorkspacePersistenceController";
import type { useWorkspaceTree } from "./useWorkspaceTree";
import { wireWorkspaceFileActions } from "./workspaceFileActionsSurface";
import type { createWorkspaceOpenSurface } from "./workspaceOpenSurface";

type AppShell = ReturnType<typeof useAppShellDomain>;
type Conversation = ReturnType<typeof useConversationRuntime>;
type EditorSession = ReturnType<typeof useEditorSessionController>;
type EditorWorkspace = ReturnType<typeof deriveEditorWorkspaceState>;
type Persistence = ReturnType<typeof useWorkspacePersistenceController<ProjectEditorSnapshot>>;

type AppEditorSurfaceInput = {
  activeAgentSession: ReturnType<typeof deriveActiveAgentSessionState>;
  agentActivityHook: Conversation["agentActivityHook"];
  chrome: AppShell["chrome"];
  diffReview: ReturnType<typeof useGitDiffReview>;
  editorSession: EditorSession;
  editorWorkspace: EditorWorkspace;
  gitStatus: AppShell["gitStatusHook"];
  persistence: Persistence;
  projectClose: ReturnType<typeof createProjectCloseController>;
  shellLayout: AppShell["shellLayout"];
  workspaceOpen: ReturnType<typeof createWorkspaceOpenSurface>;
  workspacePath: string | null;
  workspacePathRef: { current: string | null };
  workspaceTree: ReturnType<typeof useWorkspaceTree>;
};

const editorWorkflowFrom = (input: AppEditorSurfaceInput) => wireEditorFileWorkflow(input.editorSession, {
  closeDiffReview: input.diffReview.close,
  gateAction: input.agentActivityHook.gateAppAction,
  getDirty: () => input.editorWorkspace.editorDirty,
  getRoot: () => input.workspacePathRef.current ?? input.workspacePath,
  persistActiveFile: input.persistence.persistActiveFile,
  recordEdit: (file) => input.agentActivityHook.recordAgentActivity(
    input.activeAgentSession.activeAgentSessionDescriptor,
    { kind: "file", label: "Edited a file", detail: file.name, status: "complete" },
  ),
});

const editorSurfaceFrom = (
  input: AppEditorSurfaceInput,
  workflow: ReturnType<typeof editorWorkflowFrom>,
  save: (options?: { force?: boolean }) => Promise<boolean>,
) => createEditorSurfaceActions<
  FileTreeNode, EditorView, GitStatusFile, ReturnType<typeof EditorView.scrollIntoView>
>(input.editorSession, {
  copyText: writeText,
  getDiffReviewPath: () => input.diffReview.review?.absolutePath ?? null,
  getGitFiles: () => input.gitStatus.status?.files ?? [],
  getRoot: () => input.workspacePathRef.current,
  makeFileNode: (path) => fileTreeNodeFromPath(path, "file"),
  notify: input.chrome.setActionNotice,
  openExternal: openPath,
  openFileDirect: workflow.openDirect,
  openGitDiff: async (file) => Boolean(await input.diffReview.open(file)),
  openSearchPanel,
  requestOpenFile: async (file, options) => Boolean(await workflow.requestOpen(file, options)),
  revealEditorTools: () => {
    if (input.shellLayout.workbenchLayout === "hidden") input.shellLayout.setWorkbenchLayout("right");
    input.shellLayout.setToolTrayMode("editor");
  },
  revealInDir: revealItemInDir,
  saveFile: save,
  schedule: window.setTimeout,
  scheduleFrame: (callback) => window.requestAnimationFrame(callback),
  scrollEffect: (position) => EditorView.scrollIntoView(position, { y: "center" }),
});

const workspaceFileActionsFrom = (
  input: AppEditorSurfaceInput,
  workflow: ReturnType<typeof editorWorkflowFrom>,
) => wireWorkspaceFileActions(input.editorSession, {
  clearPersistedActiveFile: input.persistence.clearActiveFile,
  getDirty: () => input.editorWorkspace.editorDirty,
  getPersistRoot: () => input.workspacePathRef.current,
  getRoot: () => input.workspacePathRef.current ?? input.workspacePath,
  getSelectedFile: () => input.editorSession.selectedFile,
  openFileDirect: workflow.openDirect,
  refresh: input.workspaceTree.refresh,
  requestOpenFile: workflow.requestOpen,
  setError: input.editorSession.setFileOpError,
});

const useEditorNavigationFrom = (
  input: AppEditorSurfaceInput,
  workflow: ReturnType<typeof editorWorkflowFrom>,
  save: () => Promise<boolean>,
) => useEditorNavigationLifecycle({
  activeFile: input.editorSession.selectedFile,
  captureEditor: () => {
    input.editorSession.captureCurrentEditorViewState();
    input.editorSession.captureCurrentEditorBuffer();
  },
  closeProject: async (projectPath) => { await input.projectClose.closeProjectDirect(projectPath); },
  confirmClose: (message) => confirmDialog(message),
  editorTabs: input.editorSession.editorTabs,
  isDirty: (path) => input.editorWorkspace.dirtyTabPathSet.has(path),
  onActivateTab: async (tab) => {
    input.editorSession.selectedFileRef.current = null;
    input.editorSession.setSelectedFile(null);
    await workflow.openDirect(tab, { focusEditor: true });
  },
  onRemoveTab: (path) => {
    delete input.editorSession.editorBuffersRef.current[path];
    delete input.editorSession.editorViewStatesRef.current[path];
    input.editorSession.setEditorBufferRevision((value) => value + 1);
  },
  onResetAfterClose: () => {
    if (input.workspacePathRef.current) void input.persistence.clearActiveFile(input.workspacePathRef.current);
    input.editorSession.resetEditor();
  },
  openFile: workflow.openDirect,
  openWorkspace: async (path) => { await input.workspaceOpen.openWorkspaceDirect(path); },
  saveEditorFile: save,
  setEditorTabs: input.editorSession.setEditorTabs,
});

export const useAppEditorSurfaceRuntime = (input: AppEditorSurfaceInput) => {
  const editorFileWorkflow = editorWorkflowFrom(input);
  const saveEditorFile = (options: { force?: boolean } = {}) => editorFileWorkflow.save(options.force ?? false);
  const editorSurface = editorSurfaceFrom(input, editorFileWorkflow, saveEditorFile);
  const workspaceFileActions = workspaceFileActionsFrom(input, editorFileWorkflow);
  const editorNavigation = useEditorNavigationFrom(input, editorFileWorkflow, saveEditorFile);
  input.editorSession.saveEditorFileRef.current = saveEditorFile;
  input.editorSession.openEditorSearchRef.current = editorSurface.openEditorSearch;
  input.editorSession.closeActiveEditorTabRef.current = editorNavigation.closeActiveTab;
  return {
    editorFileWorkflow, editorNavigation, editorSurface, saveEditorFile, workspaceFileActions,
    handleEditorUpdate: (update: ViewUpdate) => editorSurface.handleEditorUpdate(update),
    tabIsDirty: (path: string) => input.editorWorkspace.dirtyTabPathSet.has(path),
  };
};
