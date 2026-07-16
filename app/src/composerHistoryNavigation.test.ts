import { describe, expect, it, vi } from "vitest";
import { createComposerHistoryNavigation } from "./composerHistoryNavigation";

const createOptions = (historyIndex: number | null = null) => ({
  getChatId: () => "/repo\nchat" as string | null,
  getHistory: () => ["first", "second", "third"],
  getHistoryIndex: vi.fn(() => historyIndex),
  setHistoryIndex: vi.fn(),
  setLocalState: vi.fn(),
});

describe("createComposerHistoryNavigation", () => {
  it("steps back into the most recent history entry", () => {
    const options = createOptions(null);
    const navigation = createComposerHistoryNavigation(options);

    navigation.showPrevious();

    expect(options.setHistoryIndex).toHaveBeenCalledWith(2);
    expect(options.setLocalState).toHaveBeenCalledWith(
      "/repo\nchat", "third", ["first", "second", "third"],
    );
  });

  it("stays clamped on the oldest entry when stepping back from it", () => {
    const options = createOptions(0);
    const navigation = createComposerHistoryNavigation(options);

    navigation.showPrevious();

    expect(options.setHistoryIndex).toHaveBeenCalledWith(0);
    expect(options.setLocalState).toHaveBeenCalledWith(
      "/repo\nchat", "first", ["first", "second", "third"],
    );
  });

  it("steps forward and clears the draft past the newest entry", () => {
    const options = createOptions(2);
    const navigation = createComposerHistoryNavigation(options);

    navigation.showNext();

    expect(options.setHistoryIndex).toHaveBeenCalledWith(null);
    expect(options.setLocalState).toHaveBeenCalledWith(
      "/repo\nchat", "", ["first", "second", "third"],
    );
  });
});
