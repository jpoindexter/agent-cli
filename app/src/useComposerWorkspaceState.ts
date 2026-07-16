import { useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { ChatConversationRecords } from "./chatConversation";
import type { ComposerHarnessRecords } from "./composerHarness";
import {
  defaultScopedSettings,
  resetScopedSetting,
  setScopedSetting,
  type ScopedSettingKey,
  type ScopedSettingsState,
  type SettingsScope,
} from "./scopedSettings";

type ComposerWorkspaceStateOptions = {
  getRoot: () => string | null;
  getSessionId: (root: string | null) => string | null;
  saveStore: () => Promise<unknown>;
  setStoreValue: (key: string, value: unknown) => Promise<unknown>;
};

const syncState = <T,>(ref: RefObject<T>, setState: Dispatch<SetStateAction<T>>, value: T) => {
  ref.current = value;
  setState(value);
};

export function useComposerWorkspaceState(options: ComposerWorkspaceStateOptions) {
  const composerHarnessBySessionRef = useRef<ComposerHarnessRecords>({});
  const scopedSettingsRef = useRef<ScopedSettingsState>(defaultScopedSettings());
  const chatConversationsRef = useRef<ChatConversationRecords>({});
  const [composerHarnessBySession, setHarnessState] = useState<ComposerHarnessRecords>({});
  const [scopedSettings, setScopedState] = useState<ScopedSettingsState>(defaultScopedSettings);
  const [chatConversations, setConversationState] = useState<ChatConversationRecords>({});
  const setComposerHarnessBySession = (records: ComposerHarnessRecords) =>
    syncState(composerHarnessBySessionRef, setHarnessState, records);
  const setScopedSettings = (settings: ScopedSettingsState) =>
    syncState(scopedSettingsRef, setScopedState, settings);
  const setChatConversations = (records: ChatConversationRecords) =>
    syncState(chatConversationsRef, setConversationState, records);
  const persistComposerHarnessRecords = async (records: ComposerHarnessRecords) => {
    setComposerHarnessBySession(records);
    await options.setStoreValue("composerHarnessBySession", records); await options.saveStore();
  };
  const persistScopedSettings = async (settings: ScopedSettingsState) => {
    setScopedSettings(settings);
    await options.setStoreValue("scopedSettings", settings); await options.saveStore();
  };
  const updateScopedSetting = async <K extends ScopedSettingKey>(
    scope: SettingsScope, key: K, value: ScopedSettingsState["global"][K],
  ) => {
    const root = options.getRoot();
    const next = setScopedSetting(
      scopedSettingsRef.current, scope, key, value, root, options.getSessionId(root),
    );
    if (next === scopedSettingsRef.current) return false;
    await persistScopedSettings(next); return true;
  };
  const clearScopedSetting = async (
    scope: Exclude<SettingsScope, "global">, key: ScopedSettingKey,
  ) => {
    const root = options.getRoot();
    const next = resetScopedSetting(
      scopedSettingsRef.current, scope, key, root, options.getSessionId(root),
    );
    if (next === scopedSettingsRef.current) return false;
    await persistScopedSettings(next); return true;
  };
  return {
    chatConversations, chatConversationsRef, clearScopedSetting, composerHarnessBySession,
    composerHarnessBySessionRef, persistComposerHarnessRecords,
    persistScopedSettings, scopedSettings, scopedSettingsRef, setChatConversations,
    setComposerHarnessBySession, setScopedSettings, updateScopedSetting,
  };
}
