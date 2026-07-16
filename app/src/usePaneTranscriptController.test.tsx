// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePaneTranscriptController } from "./usePaneTranscriptController";

describe("usePaneTranscriptController", () => {
  it("owns transcript dialog state", () => {
    const { result } = renderHook(() => usePaneTranscriptController({
      saveStore: vi.fn(), setStoreValue: vi.fn(),
    }));

    act(() => {
      result.current.setOpenTranscriptId("transcript-one");
      result.current.setTranscriptsOpen(true);
    });

    expect(result.current.openTranscriptId).toBe("transcript-one");
    expect(result.current.transcriptsOpen).toBe(true);
  });

  it("builds and durably appends a non-empty pane transcript", () => {
    const setStoreValue = vi.fn();
    const saveStore = vi.fn();
    const { result } = renderHook(() => usePaneTranscriptController({
      saveStore, setStoreValue,
    }));

    act(() => result.current.persistPaneTranscript(
      "/repo", "session-one", { label: "Tests", profile: { label: "Shell" } }, 2, "passed", 42,
    ));

    expect(result.current.paneTranscripts).toEqual([expect.objectContaining({
      id: "transcript-16-2", paneLabel: "Tests", projectId: "/repo",
      projectSessionId: "session-one", text: "passed",
    })]);
    expect(setStoreValue).toHaveBeenCalledWith("paneTranscripts", result.current.paneTranscripts);
    expect(saveStore).toHaveBeenCalledOnce();
  });

  it("keeps empty transcript output out of state", () => {
    const setStoreValue = vi.fn();
    const saveStore = vi.fn();
    const { result } = renderHook(() => usePaneTranscriptController({
      saveStore, setStoreValue,
    }));

    act(() => result.current.persistPaneTranscript(
      "/repo", "session-one", { profile: { label: "Shell" } }, 0, "  ", 42,
    ));

    expect(result.current.paneTranscripts).toEqual([]);
    expect(setStoreValue).toHaveBeenCalledWith("paneTranscripts", []);
    expect(saveStore).toHaveBeenCalledOnce();
  });
});
