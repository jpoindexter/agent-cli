import { useState, type RefObject } from "react";
import type { BackgroundExit } from "./backgroundExits";
import { DEFAULT_COMMAND_PALETTE_SOURCES } from "./commandPaletteSources";
import { DEFAULT_AI_CONNECTION_SETTINGS, type AiConnectionSettings } from "./connectionSettings";
import type { KeybindingOverrides } from "./shortcuts";
import { useAppChromeState } from "./useAppChromeState";
import { useChatSearch } from "./useChatSearch";
import { useFilesRailHeight } from "./useFilesRailHeight";
import { useGitStatus } from "./useGitStatus";
import { useMcpOAuthStatus } from "./useMcpOAuthStatus";
import { usePaneTranscriptController } from "./usePaneTranscriptController";
import { useSettingsRuntimeStatus } from "./useSettingsRuntimeStatus";
import { useShellLayout } from "./useShellLayout";
import type { WorktreeRecord } from "./worktrees";

type AppShellDomainOptions = {
  commandPalette: { open: boolean; query: string };
  railBodyRef: RefObject<HTMLDivElement | null>;
  storeRef: { current: { save: () => Promise<unknown>; set: (key: string, value: unknown) => Promise<unknown> } | null };
  treeRefreshKey: number;
  workspacePath: string | null;
  workspacePathRef: { current: string | null };
};

export const useAppShellDomain = (options: AppShellDomainOptions) => {
  const { storeRef, workspacePath, workspacePathRef } = options;
  const [commandPaletteSources, setCommandPaletteSources] = useState({ ...DEFAULT_COMMAND_PALETTE_SOURCES });
  const [orchestrationOpen, setOrchestrationOpen] = useState(false);
  const [orchestrationLaunching, setOrchestrationLaunching] = useState(false);
  const [orchestrationError, setOrchestrationError] = useState<string | null>(null);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const chrome = useAppChromeState();
  const settingsRuntime = useSettingsRuntimeStatus(settingsOpen, workspacePath);
  const [aiConnectionSettings, setAiConnectionSettings] = useState<AiConnectionSettings>(DEFAULT_AI_CONNECTION_SETTINGS);
  const mcpOAuth = useMcpOAuthStatus();
  const [worktrees, setWorktrees] = useState<WorktreeRecord[]>([]);
  const [backgroundExits, setBackgroundExits] = useState<BackgroundExit[]>([]);
  const paneTranscripts = usePaneTranscriptController({
    saveStore: () => { void storeRef.current?.save(); },
    setStoreValue: (key, value) => { void storeRef.current?.set(key, value); },
  });
  const [keybindingOverrides, setKeybindingOverrides] = useState<KeybindingOverrides>({});
  const [composerSending, setComposerSending] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const shellLayout = useShellLayout(() => setSettingsOpen(false));
  const railHeight = useFilesRailHeight(shellLayout.sideDrawerMode === "files", options.railBodyRef);
  const [drawerSearchQuery, setDrawerSearchQuery] = useState("");
  const chatSearch = useChatSearch({ open: options.commandPalette.open, query: options.commandPalette.query });
  const [focusedChatMessageId, setFocusedChatMessageId] = useState<string | null>(null);
  const gitStatusHook = useGitStatus({
    active: Boolean(workspacePath),
    refreshKey: options.treeRefreshKey,
    resolveRoot: () => workspacePathRef.current ?? workspacePath, workspacePath,
  });
  return {
    aiConnectionSettings, backgroundExits, chatSearch, chrome, commandPaletteSources,
    composerError, composerNotice, composerSending, drawerSearchQuery, focusedChatMessageId,
    gitStatusHook, keybindingOverrides, mcpOAuth, orchestrationError, orchestrationLaunching,
    orchestrationOpen, paneTranscripts, railHeight, setAiConnectionSettings, setBackgroundExits,
    setCommandPaletteSources, setComposerError, setComposerNotice, setComposerSending,
    setDrawerSearchQuery, setFocusedChatMessageId, setKeybindingOverrides, setOrchestrationError,
    setOrchestrationLaunching, setOrchestrationOpen, setSettingsOpen, setWorktrees,
    settingsOpen, settingsRuntime, shellLayout, worktrees,
  };
};
