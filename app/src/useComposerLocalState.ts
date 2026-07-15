import {
  useEffect, useLayoutEffect, useRef, useState,
  type Dispatch, type MutableRefObject, type SetStateAction,
} from "react";

import {
  defaultComposerHarnessState,
  type ComposerHarnessRecords,
  type ComposerHarnessState,
} from "./composerHarness";

type ComposerLocalState = { key: string | null; draft: string; history: string[] };
type ComposerLocalOptions = {
  activeHarness: ComposerHarnessState;
  activeKey: string | null;
  delayMs?: number;
  getDefaultProfileId: () => string;
  getRecords: () => ComposerHarnessRecords;
  persistRecords: (records: ComposerHarnessRecords) => Promise<void>;
};
type ComposerSetters = {
  setDraft: Dispatch<SetStateAction<string>>;
  setHistory: Dispatch<SetStateAction<string[]>>;
  setHistoryIndex: Dispatch<SetStateAction<number | null>>;
};

const storedHarness = (options: ComposerLocalOptions, key: string) =>
  options.getRecords()[key] ?? defaultComposerHarnessState(options.getDefaultProfileId());

const useActiveComposerSync = (
  options: ComposerLocalOptions,
  localRef: MutableRefObject<ComposerLocalState>,
  setters: ComposerSetters,
) => {
  useLayoutEffect(() => {
    const { activeHarness, activeKey } = options;
    localRef.current = { key: activeKey, draft: activeHarness.draft, history: activeHarness.history };
    setters.setDraft(activeHarness.draft);
    setters.setHistory(activeHarness.history);
    setters.setHistoryIndex(null);
  }, [options.activeHarness.draft, options.activeHarness.history, options.activeKey]);
};

const useComposerDraftPersistence = (
  optionsRef: MutableRefObject<ComposerLocalOptions>,
  localRef: MutableRefObject<ComposerLocalState>,
  draft: string,
  history: string[],
) => {
  useEffect(() => {
    const key = optionsRef.current.activeKey;
    const local = localRef.current;
    if (!key || local.key !== key || local.draft !== draft || local.history !== history) return;
    const timer = window.setTimeout(() => {
      const options = optionsRef.current;
      const current = localRef.current;
      if (current.key !== key || current.draft !== draft || current.history !== history) return;
      const previous = storedHarness(options, key);
      if (previous.draft === draft && previous.history === history) return;
      void options.persistRecords({
        ...options.getRecords(), [key]: { ...previous, draft, history },
      });
    }, optionsRef.current.delayMs ?? 180);
    return () => window.clearTimeout(timer);
  }, [draft, history, optionsRef.current.activeKey]);
};

export function useComposerLocalState(options: ComposerLocalOptions) {
  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const localRef = useRef<ComposerLocalState>({ key: null, draft: "", history: [] });
  const optionsRef = useRef(options);
  optionsRef.current = options;
  useActiveComposerSync(options, localRef, { setDraft, setHistory, setHistoryIndex });
  useComposerDraftPersistence(optionsRef, localRef, draft, history);
  const setLocalState = (key: string | null, nextDraft: string, nextHistory: string[]) => {
    localRef.current = { key, draft: nextDraft, history: nextHistory };
    setDraft(nextDraft);
    setHistory(nextHistory);
  };
  const flush = async () => {
    const local = localRef.current;
    if (!local.key) return;
    const current = optionsRef.current;
    const previous = storedHarness(current, local.key);
    if (previous.draft === local.draft && previous.history === local.history) return;
    await current.persistRecords({
      ...current.getRecords(), [local.key]: { ...previous, draft: local.draft, history: local.history },
    });
  };
  const updateHarness = async (updater: (state: ComposerHarnessState) => ComposerHarnessState) => {
    const current = optionsRef.current;
    const key = current.activeKey;
    if (!key) return null;
    const stored = storedHarness(current, key);
    const local = localRef.current;
    const previous = local.key === key ? { ...stored, draft: local.draft, history: local.history } : stored;
    const nextState = updater(previous);
    await current.persistRecords({ ...current.getRecords(), [key]: nextState });
    return nextState;
  };
  return { draft, flush, history, historyIndex, setHistoryIndex, setLocalState, updateHarness };
}
