import {
  composerHistoryAt,
  nextComposerHistoryIndex,
  previousComposerHistoryIndex,
} from "./agentComposer";

type ComposerHistoryNavigationOptions = {
  getChatId: () => string | null;
  getHistory: () => string[];
  getHistoryIndex: () => number | null;
  setHistoryIndex: (index: number | null) => void;
  setLocalState: (chatId: string | null, draft: string, history: string[]) => void;
};

const showPrevious = (options: ComposerHistoryNavigationOptions) => {
  const history = options.getHistory();
  const nextIndex = previousComposerHistoryIndex(history, options.getHistoryIndex());
  if (nextIndex == null) return;
  options.setHistoryIndex(nextIndex);
  options.setLocalState(options.getChatId(), composerHistoryAt(history, nextIndex), history);
};

const showNext = (options: ComposerHistoryNavigationOptions) => {
  const history = options.getHistory();
  const nextIndex = nextComposerHistoryIndex(history, options.getHistoryIndex());
  options.setHistoryIndex(nextIndex);
  options.setLocalState(
    options.getChatId(),
    nextIndex == null ? "" : composerHistoryAt(history, nextIndex),
    history,
  );
};

export const createComposerHistoryNavigation = (options: ComposerHistoryNavigationOptions) => ({
  showNext: () => showNext(options),
  showPrevious: () => showPrevious(options),
});
