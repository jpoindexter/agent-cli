// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultComposerHarnessState } from "./composerHarness";
import { useComposerLocalState } from "./useComposerLocalState";

const key = "workspace\nsession";

describe("useComposerLocalState", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("syncs the active session and persists draft edits after the debounce", async () => {
    const stored = { ...defaultComposerHarnessState(), draft: "Saved", history: ["Earlier"] };
    const records = { [key]: stored };
    const persistRecords = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useComposerLocalState({
      activeHarness: stored, activeKey: key, getDefaultProfileId: () => "codex",
      getRecords: () => records, persistRecords,
    }));
    expect(result.current.draft).toBe("Saved");

    act(() => result.current.setLocalState(key, "Edited", stored.history));
    await act(() => vi.advanceTimersByTimeAsync(180));

    expect(persistRecords).toHaveBeenCalledWith({
      [key]: { ...stored, draft: "Edited", history: stored.history },
    });
  });

  it("updates the harness from unsaved local draft state", async () => {
    const stored = defaultComposerHarnessState();
    const records = { [key]: stored };
    const persistRecords = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useComposerLocalState({
      activeHarness: stored, activeKey: key, getDefaultProfileId: () => "codex",
      getRecords: () => records, persistRecords,
    }));
    act(() => result.current.setLocalState(key, "Local draft", []));

    await act(() => result.current.updateHarness((state) => ({ ...state, goal: "Ship" })));

    expect(persistRecords).toHaveBeenLastCalledWith({
      [key]: { ...stored, draft: "Local draft", goal: "Ship" },
    });
  });
});
