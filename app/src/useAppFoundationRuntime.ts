import type { AppActionAuditEvent, AppActionDescriptor } from "./appActions";
import { deriveActiveAgentSessionState } from "./activeAgentSessionState";
import { deriveEditorWorkspaceState } from "./editorWorkspaceState";
import { useAppRootState } from "./useAppRootState";
import { useAppSearchRuntime } from "./useAppSearchRuntime";
import { useAppShellDomain } from "./useAppShellDomain";
import { useCommandPalette } from "./useCommandPalette";
import { useComposerRuntime } from "./useComposerRuntime";
import { useContextMenuHost } from "./useContextMenuHost";
import { useConversationRuntime } from "./useConversationRuntime";
import { useGitDiffReview } from "./useGitDiffReview";
import { useSyncRef } from "./useSyncRef";
import { useTerminalFind } from "./useTerminalFind";
import { useWorkspaceDomain } from "./useWorkspaceDomain";

type FoundationRuntimeOptions = {
  gateAction: (action: AppActionDescriptor) => Promise<AppActionAuditEvent>;
  hasUnsaved: (path: string) => boolean;
  logComposerEvent: (label: string, detail: string) => void;
};

const editorWorkspaceFrom = (
  workspace: ReturnType<typeof useWorkspaceDomain>,
  shell: ReturnType<typeof useAppShellDomain>,
  diffReview: ReturnType<typeof useGitDiffReview>,
  workspacePath: string | null,
) => deriveEditorWorkspaceState({
  diffReview: diffReview.review, editorBuffers: workspace.editorSession.editorBuffersRef.current,
  editorError: workspace.editorSession.editorError, editorTabs: workspace.editorSession.editorTabs,
  editorText: workspace.editorSession.editorText, fileTree: workspace.workspaceTree.tree,
  gitStatus: shell.gitStatusHook.status, gitStatusRoot: shell.gitStatusHook.root,
  savedEditorText: workspace.editorSession.savedEditorText,
  selectedFile: workspace.editorSession.selectedFile, workspacePath,
});

const activeAgentSessionFrom = (
  conversation: ReturnType<typeof useConversationRuntime>,
  workspace: ReturnType<typeof useWorkspaceDomain>,
  workspacePath: string | null,
) => deriveActiveAgentSessionState({
  activeSessionId: conversation.activeChat.activeSessionId,
  activeTerminalPaneId: workspace.terminal.activePaneId,
  agentActivityEvents: conversation.agentActivityHook.agentActivityEvents,
  agentActivityFilter: conversation.agentActivityHook.agentActivityFilter,
  agentApprovalMode: conversation.agentApprovalMode,
  terminalPanes: workspace.terminal.panes, workspacePath,
});

export const useAppFoundationRuntime = <TSnapshot,>(options: FoundationRuntimeOptions) => {
  const root = useAppRootState<TSnapshot>();
  const workspace = useWorkspaceDomain<TSnapshot>({
    activeSessionLookupRef: root.activeSessionLookupRef, persistPaneLayoutRef: root.persistPaneLayoutRef,
    storeRef: root.storeRef, workspacePath: root.workspacePath, workspacePathRef: root.workspacePathRef,
  });
  const contextMenuHost = useContextMenuHost({
    buildFileNodeItems: (node) => root.fileNodeContextMenuItemsRef.current(node),
    onActionError: (item, error) => root.setLaunchError(`${item.label} failed: ${String(error)}`),
  });
  const commandPalette = useCommandPalette(() => contextMenuHost.setContextMenu(null));
  const shell = useAppShellDomain({
    commandPalette: { open: commandPalette.open, query: commandPalette.query },
    railBodyRef: root.railBodyRef, storeRef: root.storeRef,
    treeRefreshKey: workspace.workspaceTree.refreshKey,
    workspacePath: root.workspacePath, workspacePathRef: root.workspacePathRef,
  });
  const diffReviewHook = useGitDiffReview({
    gateAction: options.gateAction, getRoot: () => root.workspacePathRef.current ?? root.workspacePath,
    hasUnsaved: options.hasUnsaved, onRefreshFiles: workspace.workspaceTree.refresh,
    onStatus: (status, projectRoot) => { shell.gitStatusHook.setStatus(status); shell.gitStatusHook.setRoot(projectRoot); },
  });
  const editorWorkspace = editorWorkspaceFrom(workspace, shell, diffReviewHook, root.workspacePath);
  const search = useAppSearchRuntime<TSnapshot>({
    chatSearch: shell.chatSearch, commandPalette, composerWorkspace: workspace.composerWorkspace,
    contextMenuHost, drawerSearchQuery: shell.drawerSearchQuery, editorWorkspace,
    persistence: workspace.persistence,
  });
  const conversation = useConversationRuntime({
    activeAgentSessionDescriptorRef: root.activeAgentSessionDescriptorRef,
    composerWorkspace: workspace.composerWorkspace, persistence: workspace.persistence,
    profiles: workspace.profiles, shellLayout: shell.shellLayout, storeRef: root.storeRef,
    workspacePath: root.workspacePath, workspacePathRef: root.workspacePathRef,
  });
  const composer = useComposerRuntime({
    ...conversation, composerWorkspace: workspace.composerWorkspace,
    editorSession: workspace.editorSession, logEvent: options.logComposerEvent,
    profiles: workspace.profiles, searchableFiles: editorWorkspace.searchableFiles,
    setError: shell.setComposerError, setNotice: shell.setComposerNotice,
    shellLayout: shell.shellLayout, workspacePathRef: root.workspacePathRef,
  });
  const activeAgentSession = activeAgentSessionFrom(conversation, workspace, root.workspacePath);
  const terminalFind = useTerminalFind(activeAgentSession.activeTerminalPane != null);
  useSyncRef(root.activeAgentSessionDescriptorRef, activeAgentSession.activeAgentSessionDescriptor);
  return {
    activeAgentSession, activeTerminalProfile: activeAgentSession.activeTerminalPane?.profile ?? workspace.profiles.terminalProfile,
    commandPalette, composer, contextMenuHost, conversation, diffReviewHook, editorWorkspace,
    root, search, shell, terminalFind, workspace,
  };
};
