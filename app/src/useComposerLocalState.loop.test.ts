// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { defaultComposerHarnessState } from "./composerHarness";
import { useComposerLocalState } from "./useComposerLocalState";

// Reproduces the mount crash: when the active session key has no stored harness,
// deriveActiveChatState hands a FRESH default harness (new history array) every
// render. useActiveComposerSync must not re-sync/setState on a new-but-equal
// history reference, or it loops until "Maximum update depth exceeded".
describe("useComposerLocalState mount stability", () => {
  it("does not loop when the active harness is a fresh default each render", () => {
    expect(() =>
      renderHook(() =>
        // fresh default harness object every render, non-null key, empty records
        useComposerLocalState({
          activeHarness: defaultComposerHarnessState("codex"),
          activeKey: "/repo\nchat",
          getDefaultProfileId: () => "codex",
          getRecords: () => ({}),
          persistRecords: vi.fn(async () => {}),
        }),
      ),
    ).not.toThrow();
  });
});
