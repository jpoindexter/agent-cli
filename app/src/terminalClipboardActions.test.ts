import { describe, expect, it, vi } from "vitest";
import { createTerminalClipboardActions } from "./terminalClipboardActions";

type Snapshot = { cells: string[]; cols: number };

const createOptions = () => ({
  copyText: vi.fn(async () => {}),
  getActivePaneId: vi.fn(() => 1 as number | null),
  getSnapshot: vi.fn(() => ({ cells: ["a"], cols: 1 }) as Snapshot | null),
  paste: vi.fn(async () => {}),
  readClipboard: vi.fn(async () => "clip" as string | null),
  readTail: vi.fn(async () => "tail lines" as string | null),
  recordActivity: vi.fn(),
  selection: { current: { anchor: 0 } as { anchor: number } | null },
  selectionText: vi.fn(() => "selected"),
  sendClearKey: vi.fn(async () => {}),
});

describe("createTerminalClipboardActions", () => {
  it("reads selected text only when a snapshot and selection exist", () => {
    const options = createOptions();
    const actions = createTerminalClipboardActions(options);

    expect(actions.terminalSelectedText()).toBe("selected");

    options.selection.current = null;
    expect(actions.terminalSelectedText()).toBe("");
  });

  it("copies the selection and skips the clipboard when empty", async () => {
    const options = createOptions();
    const actions = createTerminalClipboardActions(options);

    await actions.copyTerminalSelection();
    expect(options.copyText).toHaveBeenCalledWith("selected");

    options.selectionText.mockReturnValue("");
    options.copyText.mockClear();
    await actions.copyTerminalSelection();
    expect(options.copyText).not.toHaveBeenCalled();
  });

  it("copies the pane tail and records the activity", async () => {
    const options = createOptions();
    const actions = createTerminalClipboardActions(options);

    await actions.copyActivePaneTail();

    expect(options.copyText).toHaveBeenCalledWith("tail lines");
    expect(options.recordActivity).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Copied output", detail: "Last 20 lines" }),
    );
  });

  it("pastes clipboard text into the active pane and clears the selection", async () => {
    const options = createOptions();
    const actions = createTerminalClipboardActions(options);

    await actions.pasteIntoTerminal();

    expect(options.selection.current).toBeNull();
    expect(options.paste).toHaveBeenCalledWith("clip");

    options.paste.mockClear();
    options.getActivePaneId.mockReturnValue(null);
    await actions.pasteIntoTerminal();
    expect(options.paste).not.toHaveBeenCalled();
  });

  it("clears the active terminal with the clear chord", async () => {
    const options = createOptions();
    const actions = createTerminalClipboardActions(options);

    await actions.clearActiveTerminal();

    expect(options.selection.current).toBeNull();
    expect(options.sendClearKey).toHaveBeenCalled();

    options.sendClearKey.mockClear();
    options.getActivePaneId.mockReturnValue(null);
    await actions.clearActiveTerminal();
    expect(options.sendClearKey).not.toHaveBeenCalled();
  });
});
