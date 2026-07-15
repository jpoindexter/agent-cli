// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultScopedSettings } from "./scopedSettings";
import { useBrowserPreviewController } from "./useBrowserPreviewController";

const createOptions = () => {
  const scopedSettings = { current: defaultScopedSettings() };
  const stored = new Map<string, unknown>();
  const options = {
    activeRoot: "/repo" as string | null,
    activeSessionId: "session-1" as string | null,
    ensureVisible: vi.fn(),
    gateAction: vi.fn(async () => "approved" as const),
    getCurrentRoot: vi.fn(() => "/repo" as string | null),
    getCurrentSessionId: vi.fn(() => "session-1" as string | null),
    saveStore: vi.fn(async () => undefined),
    scopedSettings,
    setScopedSettings: vi.fn((next) => { scopedSettings.current = next; }),
    setStoreValue: vi.fn(async (key: string, value: unknown) => { stored.set(key, value); }),
  };
  return { options, stored };
};

describe("useBrowserPreviewController", () => {
  it("navigates while synchronizing persisted project and session records", async () => {
    const { options, stored } = createOptions();
    const { result } = renderHook(() => useBrowserPreviewController(options));

    await act(async () => { await result.current.navigate("localhost:5173"); });

    expect(result.current.url).toBe("http://localhost:5173/");
    expect(result.current.projectRecordsRef.current).toEqual({
      "/repo": "http://localhost:5173/",
    });
    expect(result.current.sessionRecordsRef.current).toEqual({
      "/repo\nsession-1": "http://localhost:5173/",
    });
    expect(stored.has("scopedSettings")).toBe(true);
    expect(options.saveStore).toHaveBeenCalledOnce();
  });

  it("opens only the detected server for the active project session", async () => {
    const { options } = createOptions();
    const { result } = renderHook(() => useBrowserPreviewController(options));
    act(() => result.current.setDetectedServer({
      detectedAt: 10,
      paneId: 7,
      paneLabel: "Dev",
      projectId: "/repo",
      projectSessionId: "session-1",
      url: "http://localhost:4173/",
    }));

    await act(async () => { await result.current.openDetectedServer(); });

    expect(options.ensureVisible).toHaveBeenCalledOnce();
    expect(result.current.url).toBe("http://localhost:4173/");
    expect(result.current.activeDetectedServer?.paneLabel).toBe("Dev");
  });

  it("hides a detected server owned by another session", () => {
    const { options } = createOptions();
    const { result } = renderHook(() => useBrowserPreviewController(options));
    act(() => result.current.setDetectedServer({
      detectedAt: 10,
      paneId: 7,
      paneLabel: "Other",
      projectId: "/repo",
      projectSessionId: "session-2",
      url: "http://localhost:3000/",
    }));

    expect(result.current.activeDetectedServer).toBeNull();
  });

  it("submits the editable address through approved navigation", async () => {
    const { options } = createOptions();
    const { result } = renderHook(() => useBrowserPreviewController(options));
    const preventDefault = vi.fn();
    act(() => result.current.setAddress("localhost:8080"));

    await act(async () => { await result.current.submitAddress({ preventDefault }); });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(result.current.url).toBe("http://localhost:8080/");
  });
});
