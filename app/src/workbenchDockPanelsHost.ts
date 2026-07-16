import type { MouseEvent } from "react";
import { buildGitFileContextMenuItems } from "./workspaceContextMenus";
import type { ContextMenuItem } from "./ContextMenu";
import type { GitStatusFile } from "./fileGitStatus";
import type { FileTreeNode } from "./fileTreeTypes";
import type { WorkbenchDockPanelsProps } from "./WorkbenchDockPanels";
import type { WorkspaceContextMenuActions } from "./workspaceContextMenus";

type WorkbenchDockPanelsInput = {
  activeChat: {
    activeChatConversation: {
      messages: unknown[];
      runStatus: string;
      usage?: { inputTokens: number; outputTokens: number };
    };
    activeComposerProviderLabel: string;
  };
  browser: { url: string };
  contextMenuHost: { openContextMenu: (event: MouseEvent, items: ContextMenuItem[]) => void };
  diffReviewHook: { open: (file: GitStatusFile) => Promise<unknown> };
  drawerSearchQuery: string;
  drawerSearchResults: FileTreeNode[];
  editorFileWorkflow: { requestOpen: (file: FileTreeNode, options: { focusEditor: boolean }) => void };
  editorWorkspace: { searchableFiles: FileTreeNode[] };
  editorSession: { selectedFile: FileTreeNode | null };
  gitStatusHook: { error: string | null; loading: boolean; refresh: () => Promise<unknown>; status: WorkbenchDockPanelsProps["git"]["status"] };
  setDrawerSearchQuery: (query: string) => void;
  surfaceLabels: { activeSessionTitle: string };
  workspaceContextMenuActions: WorkspaceContextMenuActions;
  workspaceFileActions: { createFile: () => Promise<unknown>; createFolder: () => Promise<unknown> };
  workspacePath: string | null;
  workspaceTree: { error: string | null; loading: boolean; refresh: () => unknown };
};

export const workbenchDockPanelsPropsFrom = (input: WorkbenchDockPanelsInput): WorkbenchDockPanelsProps => ({
  context: {
    session: {
      title: input.surfaceLabels.activeSessionTitle,
      provider: input.activeChat.activeComposerProviderLabel,
      status: input.activeChat.activeChatConversation.runStatus,
      messages: input.activeChat.activeChatConversation.messages.length,
      usageTokens: input.activeChat.activeChatConversation.usage
        ? input.activeChat.activeChatConversation.usage.inputTokens + input.activeChat.activeChatConversation.usage.outputTokens
        : null,
    },
    workspace: {
      path: input.workspacePath,
      branch: input.gitStatusHook.status?.branch ?? null,
      changedFiles: input.gitStatusHook.status?.files.length ?? 0,
    },
    tools: {
      activeFile: input.editorSession.selectedFile?.path ?? null,
      browserUrl: input.browser.url || null,
    },
  },
  files: {
    error: input.workspaceTree.error, loading: input.workspaceTree.loading, query: input.drawerSearchQuery,
    results: input.drawerSearchResults, searchable: input.editorWorkspace.searchableFiles,
    selectedFilePath: input.editorSession.selectedFile?.path ?? null,
  },
  git: { error: input.gitStatusHook.error, loading: input.gitStatusHook.loading, status: input.gitStatusHook.status },
  handlers: {
    createFile: () => void input.workspaceFileActions.createFile(),
    createFolder: () => void input.workspaceFileActions.createFolder(),
    gitFileContextMenu: (event, file) => input.contextMenuHost.openContextMenu(
      event, buildGitFileContextMenuItems(file, input.workspaceContextMenuActions),
    ),
    openDiff: (gitFile) => void input.diffReviewHook.open(gitFile),
    openFile: (treeFile) => void input.editorFileWorkflow.requestOpen(treeFile, { focusEditor: true }),
    refreshFiles: input.workspaceTree.refresh,
    refreshGit: () => void input.gitStatusHook.refresh(),
    setQuery: input.setDrawerSearchQuery,
  },
  workspacePath: input.workspacePath,
});
