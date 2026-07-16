import { useMemo } from "react";
import { composerMentionQuery as composerMentionQueryFrom } from "./agentComposer";
import type { FileTreeNode } from "./fileTreeTypes";
import { useComposerAttachments } from "./useComposerAttachments";
import { useComposerLocalState } from "./useComposerLocalState";
import type { useConversationRuntime } from "./useConversationRuntime";
import type { useShellLayout } from "./useShellLayout";
import type { useWorkspaceDomain } from "./useWorkspaceDomain";
import { filterWorkspaceFiles } from "./workspaceSearch";

type Ref<T> = { current: T };
type ConversationRuntime = ReturnType<typeof useConversationRuntime>;
type WorkspaceDomain = ReturnType<typeof useWorkspaceDomain>;

type ComposerRuntimeOptions = {
  activeChat: ConversationRuntime["activeChat"];
  agentActivityHook: ConversationRuntime["agentActivityHook"];
  browser: ConversationRuntime["browser"];
  composerWorkspace: WorkspaceDomain["composerWorkspace"];
  editorSession: WorkspaceDomain["editorSession"];
  logEvent: (label: string, detail: string) => void;
  profiles: WorkspaceDomain["profiles"];
  searchableFiles: FileTreeNode[];
  setError: (error: string | null) => void;
  setNotice: (notice: string | null) => void;
  shellLayout: ReturnType<typeof useShellLayout>;
  workspacePathRef: Ref<string | null>;
};

export const useComposerRuntime = (options: ComposerRuntimeOptions) => {
  const { activeChat, agentActivityHook, browser, composerWorkspace, editorSession, profiles } = options;
  const composerLocal = useComposerLocalState({
    activeHarness: activeChat.activeComposerHarness, activeKey: activeChat.activeComposerHarnessKey,
    getDefaultProfileId: () => profiles.launchProfileRef.current.id,
    getRecords: () => composerWorkspace.composerHarnessBySessionRef.current,
    persistRecords: (records) => composerWorkspace.persistComposerHarnessRecords(records),
  });
  const composerAttachments = useComposerAttachments({
    active: options.shellLayout.agentSurfaceMode === "chat",
    activeHarness: activeChat.activeComposerHarness,
    activeKey: activeChat.activeComposerHarnessKey,
    draft: composerLocal.draft,
    gateAction: (action) => agentActivityHook.gateAppAction(action),
    getBrowserUrl: () => browser.urlRef.current,
    getRoot: () => options.workspacePathRef.current,
    logEvent: (label, detail) => options.logEvent(label, detail),
    setError: options.setError,
    setNotice: options.setNotice,
    updateHarness: composerLocal.updateHarness,
  });
  const attachSelectedFileToComposer = async () => composerAttachments.attachWorkspaceFile(editorSession.selectedFile);
  const composerMentionQuery = composerMentionQueryFrom(composerLocal.draft);
  const composerMentionResults = useMemo(
    () => composerMentionQuery == null ? [] : filterWorkspaceFiles(options.searchableFiles, composerMentionQuery, 8),
    [composerMentionQuery, options.searchableFiles],
  );
  return { attachSelectedFileToComposer, composerAttachments, composerLocal, composerMentionQuery, composerMentionResults };
};
