import {
  buildFileNodeContextMenuItems,
  buildProjectRailContextMenuItems,
  buildWorkspaceContextMenuItems,
} from "./workspaceContextMenus";
import {
  buildDiffContextMenuItems,
  buildEditorContextMenuItems,
  buildEditorTabContextMenuItems,
} from "./editorContextMenus";
import { buildProjectSessionContextMenuItems } from "./projectSessionContextMenu";
import { deriveProjectSessionMenuState } from "./projectSessionMenuSurface";
import type { ChatConversationRecords } from "./chatConversation";
import type { FileTreeNode } from "./fileTreeTypes";
import type { OpenProject, ProjectSession } from "./workspaceState";

type WorkspaceActions = Parameters<typeof buildFileNodeContextMenuItems>[1];
type EditorActions = Parameters<typeof buildEditorTabContextMenuItems>[1];
type EditorMenuState = Parameters<typeof buildEditorContextMenuItems>[0];
type DiffMenuState = Parameters<typeof buildDiffContextMenuItems>[0];

type ProjectSessionMenuAssemblyOptions = {
  activeSessionId: string | null;
  archiveSession: (projectPath: string, session: ProjectSession, archived: boolean) => unknown;
  captureCheckpoint: (projectPath: string, session: ProjectSession) => unknown;
  chatIdForSession: (root: string, sessionId: string) => string;
  conversations: () => ChatConversationRecords;
  copyText: (text: string) => Promise<unknown>;
  deleteSession: (projectPath: string, session: ProjectSession) => unknown;
  notify: (message: string) => void;
  pinSession: (projectPath: string, session: ProjectSession, pinned: boolean) => unknown;
  projectSessionsFor: (projectPath: string) => ProjectSession[];
  removeChildWorktree: (projectPath: string, session: ProjectSession) => unknown;
  renameSession: (projectPath: string, session: ProjectSession) => unknown;
  restoreCheckpoint: (projectPath: string, session: ProjectSession, checkpointId: string) => unknown;
  returnChildResult: (projectPath: string, session: ProjectSession) => unknown;
  stopChildRun: (projectPath: string, session: ProjectSession) => unknown;
  switchSession: (projectPath: string, sessionId: string) => unknown;
  workspacePath: string | null;
};

export const createWorkspaceContextMenuAssembly = (actions: WorkspaceActions) => ({
  actions,
  fileNodeItems: (node: FileTreeNode) => buildFileNodeContextMenuItems(node, actions),
  projectRailItems: (project: OpenProject, workspacePath: string | null) =>
    buildProjectRailContextMenuItems(project, workspacePath, actions),
  workspaceItems: (workspacePath: string | null) =>
    buildWorkspaceContextMenuItems(workspacePath, actions),
});

export const createEditorContextMenuAssembly = (actions: EditorActions) => ({
  diffItems: (state: DiffMenuState) => buildDiffContextMenuItems(state, actions),
  editorItems: (state: EditorMenuState) => buildEditorContextMenuItems(state, actions),
  editorTabItems: (tab: FileTreeNode) => buildEditorTabContextMenuItems(tab, actions),
});

export const createProjectSessionContextMenuAssembly = (options: ProjectSessionMenuAssemblyOptions) => ({
  items: (projectPath: string, session: ProjectSession) => buildProjectSessionContextMenuItems({
    ...deriveProjectSessionMenuState({
      activeSessionId: options.activeSessionId,
      chatIdForSession: options.chatIdForSession,
      conversations: options.conversations(),
      projectPath,
      session,
      sessions: options.projectSessionsFor(projectPath),
      workspacePath: options.workspacePath,
    }),
    session,
    actions: {
      archive: () => options.archiveSession(projectPath, session, !session.archived),
      captureCheckpoint: () => options.captureCheckpoint(projectPath, session),
      copyName: async () => { await options.copyText(session.title); options.notify("Copied chat name"); },
      delete: () => options.deleteSession(projectPath, session),
      pin: () => options.pinSession(projectPath, session, !session.pinnedAt),
      removeChildWorktree: () => options.removeChildWorktree(projectPath, session),
      rename: () => options.renameSession(projectPath, session),
      restoreCheckpoint: () => session.checkpointId
        ? options.restoreCheckpoint(projectPath, session, session.checkpointId) : undefined,
      restoreRecoveryCheckpoint: () => session.recoveryCheckpointId
        ? options.restoreCheckpoint(projectPath, session, session.recoveryCheckpointId) : undefined,
      returnChildResult: () => options.returnChildResult(projectPath, session),
      stopChildRun: () => options.stopChildRun(projectPath, session),
      switchChat: () => options.switchSession(projectPath, session.id),
    },
  }),
});
