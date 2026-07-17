import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import {
  createEditorContextMenuAssembly, createProjectSessionContextMenuAssembly,
  createWorkspaceContextMenuAssembly,
} from "./appContextMenuAssembly";
import type { createComposerSurface } from "./composerSurfaceController";
import type { deriveEditorWorkspaceState } from "./editorWorkspaceState";
import type { FileTreeNode } from "./fileTreeTypes";
import type { ContextMenuItem } from "./ContextMenu";
import type { createProjectEntryActions } from "./projectEntryActions";
import type { createProjectSessionDeletionController } from "./projectSessionDeletionController";
import type { createProjectSessionMetadataActions } from "./projectSessionMetadataActions";
import type { createProjectSessionNavigationActions } from "./projectSessionNavigationActions";
import { shortcutKeys } from "./shortcuts";
import { wireSessionCheckpointActions } from "./sessionCheckpointSurface";
import type { useAppEditorSurfaceRuntime } from "./useAppEditorSurfaceRuntime";
import type { useAppShellDomain } from "./useAppShellDomain";
import type { useComposerWorkspaceState } from "./useComposerWorkspaceState";
import type { useConversationRuntime } from "./useConversationRuntime";
import type { ProjectEditorSnapshot, useEditorSessionController } from "./useEditorSessionController";
import type { useGitDiffReview } from "./useGitDiffReview";
import type { useWorkspacePersistenceController } from "./useWorkspacePersistenceController";
import type { useWorkspaceTree } from "./useWorkspaceTree";
import type { OpenProject } from "./workspaceState";

type AppShell = ReturnType<typeof useAppShellDomain>;
type Conversation = ReturnType<typeof useConversationRuntime>;
type EditorRuntime = ReturnType<typeof useAppEditorSurfaceRuntime>;
type Persistence = ReturnType<typeof useWorkspacePersistenceController<ProjectEditorSnapshot>>;

type AppEditorMenuInput = {
  activeChat: Conversation["activeChat"];
  agentActivityHook: Conversation["agentActivityHook"];
  chrome: AppShell["chrome"];
  composerHarnessSessionKey: (root: string, sessionId: string) => string;
  composerSurface: ReturnType<typeof createComposerSurface>;
  composerWorkspace: ReturnType<typeof useComposerWorkspaceState>;
  deleteSession: ReturnType<typeof createProjectSessionDeletionController>["deleteProjectSession"];
  diffReview: ReturnType<typeof useGitDiffReview>;
  editor: EditorRuntime;
  editorSession: ReturnType<typeof useEditorSessionController>;
  editorWorkspace: ReturnType<typeof deriveEditorWorkspaceState>;
  fileNodeItemsRef: { current: (node: FileTreeNode) => ContextMenuItem[] };
  gitStatus: AppShell["gitStatusHook"];
  persistence: Persistence;
  projectEntry: ReturnType<typeof createProjectEntryActions>;
  projectSessionMetadata: ReturnType<typeof createProjectSessionMetadataActions>;
  projectSessions: ReturnType<typeof createProjectSessionNavigationActions>;
  requestCloseProject: (project: OpenProject) => unknown;
  setError: (message: string | null) => void;
  workspacePath: string | null;
  workspacePathRef: { current: string | null };
  workspaceTree: ReturnType<typeof useWorkspaceTree>;
};

const workspaceMenusFrom = (input: AppEditorMenuInput) => createWorkspaceContextMenuAssembly({
  closeProject: input.requestCloseProject,
  copyPath: input.editor.editorSurface.copyPath,
  deleteNode: input.editor.workspaceFileActions.delete,
  duplicateNode: input.editor.workspaceFileActions.duplicate,
  newFile: input.editor.workspaceFileActions.createFile,
  newFolder: input.editor.workspaceFileActions.createFolder,
  openDiff: input.diffReview.open,
  openWorkspace: input.projectEntry.openProject,
  renameNode: input.editor.workspaceFileActions.rename,
  revealNode: input.editor.workspaceFileActions.reveal,
  revealPath: revealItemInDir,
  runGitAction: input.diffReview.runFileAction,
  shortcut: shortcutKeys,
  switchProject: (project: OpenProject) => input.projectEntry.switchProject(project.path),
});

const projectSessionMenusFrom = (input: AppEditorMenuInput) => {
  const metadata = input.projectSessionMetadata;
  const checkpoints = wireSessionCheckpointActions(input.editorSession, {
    gateAction: input.agentActivityHook.gateAppAction,
    getDirtyTabPaths: () => input.editorWorkspace.dirtyTabPaths,
    getWorkspacePath: () => input.workspacePathRef.current,
    onMetadata: metadata.updateSessionMetadata,
    openFileDirect: input.editor.editorFileWorkflow.openDirect,
    refreshFiles: input.workspaceTree.refresh,
    refreshGit: input.gitStatus.refresh,
    setError: input.setError,
    setNotice: input.chrome.setActionNotice,
  });
  return createProjectSessionContextMenuAssembly({
    activeSessionId: input.activeChat.activeSessionId,
    archiveSession: metadata.archiveSession, captureCheckpoint: checkpoints.capture,
    chatIdForSession: input.composerHarnessSessionKey,
    conversations: () => input.composerWorkspace.chatConversationsRef.current,
    copyText: writeText, deleteSession: input.deleteSession, notify: input.chrome.setActionNotice,
    pinSession: metadata.pinSession,
    projectSessionsFor: (path) => input.persistence.projectSessionsRef.current[path] ?? [],
    removeChildWorktree: input.composerSurface.removeChildWorktree,
    renameSession: input.projectSessions.renameSession, restoreCheckpoint: checkpoints.restore,
    returnChildResult: input.composerSurface.returnChildResult,
    stopChildRun: input.composerSurface.stopChildChatRun,
    switchSession: input.projectSessions.switchSession, workspacePath: input.workspacePath,
  });
};

const editorMenusFrom = (input: AppEditorMenuInput) => createEditorContextMenuAssembly({
  closeDiff: input.diffReview.close,
  closeTab: input.editor.editorNavigation.closeTab,
  copyDiff: input.diffReview.copy,
  copyPath: input.editor.editorSurface.copyPath,
  find: input.editor.editorSurface.openEditorSearch,
  openDiffFile: input.editor.editorSurface.openDiffFile,
  openExternal: input.editor.editorSurface.openExternally,
  openTab: (tab) => input.editor.editorFileWorkflow.requestOpen(tab, { focusEditor: true }),
  revealNode: input.editor.workspaceFileActions.reveal,
  revealSelected: input.editor.editorSurface.reveal,
  runGitAction: input.diffReview.runFileAction,
  save: input.editor.saveEditorFile,
  shortcut: shortcutKeys,
});

export const appEditorMenusFrom = (input: AppEditorMenuInput) => {
  const workspaceMenus = workspaceMenusFrom(input);
  const projectSessionMenus = projectSessionMenusFrom(input);
  const editorMenus = editorMenusFrom(input);
  input.fileNodeItemsRef.current = workspaceMenus.fileNodeItems;
  return {
    workspaceContextMenuActions: workspaceMenus.actions,
    workspaceContextMenuItems: () => workspaceMenus.workspaceItems(input.workspacePath),
    projectRailContextMenuItems: (project: OpenProject) => workspaceMenus.projectRailItems(project, input.workspacePath),
    projectSessionContextMenuItems: projectSessionMenus.items,
    editorTabContextMenuItems: editorMenus.editorTabItems,
    editorContextMenuItems: () => editorMenus.editorItems({
      editorDirty: input.editorWorkspace.editorDirty,
      editorLoading: input.editorSession.editorLoading,
      editorSaving: input.editorSession.editorSaving,
      selectedFile: input.editorSession.selectedFile,
    }),
    diffContextMenuItems: () => editorMenus.diffItems({
      canDiscard: input.editorWorkspace.diffReviewCanDiscard,
      canOpenFile: input.editorWorkspace.diffReviewCanOpenFile,
      canStage: input.editorWorkspace.diffReviewCanStage,
      canUnstage: input.editorWorkspace.diffReviewCanUnstage,
      loading: input.diffReview.loading,
      review: input.diffReview.review,
    }),
  };
};
