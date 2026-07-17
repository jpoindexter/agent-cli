import { useMemo } from "react";
import { mergeChatDiscoveryResults, type ChatSearchViewResult } from "./chatDiscovery";
import type { deriveEditorWorkspaceState } from "./editorWorkspaceState";
import type { useAppShellDomain } from "./useAppShellDomain";
import type { useCommandPalette } from "./useCommandPalette";
import type { useContextMenuHost } from "./useContextMenuHost";
import { useQuickOpen } from "./useQuickOpen";
import type { useWorkspaceDomain } from "./useWorkspaceDomain";
import { filterWorkspaceFiles } from "./workspaceSearch";

type AppShell = ReturnType<typeof useAppShellDomain>;
type CommandPalette = ReturnType<typeof useCommandPalette>;
type ContextMenuHost = ReturnType<typeof useContextMenuHost>;
type EditorWorkspace = ReturnType<typeof deriveEditorWorkspaceState>;
type Workspace<TSnapshot> = ReturnType<typeof useWorkspaceDomain<TSnapshot>>;

type AppSearchRuntimeInput<TSnapshot> = {
  chatSearch: AppShell["chatSearch"];
  commandPalette: CommandPalette;
  composerWorkspace: Workspace<TSnapshot>["composerWorkspace"];
  contextMenuHost: ContextMenuHost;
  drawerSearchQuery: string;
  editorWorkspace: EditorWorkspace;
  persistence: Workspace<TSnapshot>["persistence"];
};

export const useAppSearchRuntime = <TSnapshot,>(input: AppSearchRuntimeInput<TSnapshot>) => {
  const drawerSearchResults = useMemo(() => filterWorkspaceFiles(
    input.editorWorkspace.searchableFiles,
    input.drawerSearchQuery,
    input.drawerSearchQuery.trim() ? 80 : 40,
  ), [input.drawerSearchQuery, input.editorWorkspace.searchableFiles]);
  const chatSearchViewResults = useMemo<ChatSearchViewResult[]>(() => mergeChatDiscoveryResults(
    input.chatSearch.results,
    input.persistence.projectSessions,
    input.composerWorkspace.chatConversations,
    input.commandPalette.query,
    false,
  ), [
    input.chatSearch.results, input.commandPalette.query,
    input.composerWorkspace.chatConversations, input.persistence.projectSessions,
  ]);
  return {
    chatSearchViewResults,
    drawerSearchResults,
    quickOpen: useQuickOpen(
      input.editorWorkspace.searchableFiles,
      () => input.contextMenuHost.setContextMenu(null),
    ),
  };
};
