import type { AgentActivityEvent } from "./agentActivity";

const PANE_TAIL_LINES = 20;

type Ref<T> = { current: T };
type ActivityInput = Pick<AgentActivityEvent, "kind" | "label" | "status">
  & Partial<Pick<AgentActivityEvent, "detail">>;

type TerminalClipboardActionsOptions<TSnapshot, TSelection> = {
  copyText: (text: string) => Promise<unknown>;
  getActivePaneId: () => number | null;
  getSnapshot: () => TSnapshot | null;
  paste: (text: string) => Promise<unknown>;
  readClipboard: () => Promise<string | null>;
  readTail: (lines: number) => Promise<string | null | undefined>;
  recordActivity: (event: ActivityInput) => void;
  selection: Ref<TSelection | null>;
  selectionText: (snapshot: TSnapshot, selection: TSelection) => string;
  sendClearKey: () => Promise<unknown>;
};

const terminalSelectedText = <TSnapshot, TSelection>(
  options: TerminalClipboardActionsOptions<TSnapshot, TSelection>,
) => {
  const snapshot = options.getSnapshot();
  const selection = options.selection.current;
  return snapshot && selection ? options.selectionText(snapshot, selection) : "";
};

const copyActivePaneTail = async <TSnapshot, TSelection>(
  options: TerminalClipboardActionsOptions<TSnapshot, TSelection>,
) => {
  const tail = await options.readTail(PANE_TAIL_LINES);
  if (!tail) return;
  await options.copyText(tail);
  options.recordActivity({
    kind: "app",
    label: "Copied output",
    detail: `Last ${PANE_TAIL_LINES} lines`,
    status: "complete",
  });
};

const pasteIntoTerminal = async <TSnapshot, TSelection>(
  options: TerminalClipboardActionsOptions<TSnapshot, TSelection>,
) => {
  if (options.getActivePaneId() == null) return;
  const text = await options.readClipboard();
  if (!text) return;
  options.selection.current = null;
  await options.paste(text);
};

const clearActiveTerminal = async <TSnapshot, TSelection>(
  options: TerminalClipboardActionsOptions<TSnapshot, TSelection>,
) => {
  if (options.getActivePaneId() == null) return;
  options.selection.current = null;
  await options.sendClearKey();
};

export const createTerminalClipboardActions = <TSnapshot, TSelection>(
  options: TerminalClipboardActionsOptions<TSnapshot, TSelection>,
) => ({
  clearActiveTerminal: () => clearActiveTerminal(options),
  copyActivePaneTail: () => copyActivePaneTail(options),
  copyTerminalSelection: async () => {
    const selectedText = terminalSelectedText(options);
    if (!selectedText) return;
    await options.copyText(selectedText);
  },
  pasteIntoTerminal: () => pasteIntoTerminal(options),
  terminalSelectedText: () => terminalSelectedText(options),
});
