// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAppShellDomain } from "./useAppShellDomain";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(async () => null) }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn(async () => () => {}) }));

const createOptions = () => ({
  commandPalette: { open: false, query: "" },
  railBodyRef: { current: null as HTMLDivElement | null },
  storeRef: { current: null },
  treeRefreshKey: 0,
  workspacePath: null as string | null,
  workspacePathRef: { current: null as string | null },
});

describe("useAppShellDomain", () => {
  it("returns shell state bundles with closed defaults", () => {
    const { result } = renderHook(() => useAppShellDomain(createOptions()));

    expect(result.current.settingsOpen).toBe(false);
    expect(result.current.orchestrationOpen).toBe(false);
    expect(result.current.worktrees).toEqual([]);
    expect(result.current.backgroundExits).toEqual([]);
    expect(result.current.chrome.setAppTheme).toBeTypeOf("function");
    expect(result.current.shellLayout.sideDrawerMode).toBeDefined();
    expect(result.current.gitStatusHook.setStatus).toBeTypeOf("function");
    expect(result.current.paneTranscripts.setTranscriptsOpen).toBeTypeOf("function");
  });

  it("closes settings through the shell layout escape hook", () => {
    const { result } = renderHook(() => useAppShellDomain(createOptions()));

    act(() => result.current.setSettingsOpen(true));
    expect(result.current.settingsOpen).toBe(true);
    act(() => result.current.setSettingsOpen(false));
    expect(result.current.settingsOpen).toBe(false);
  });
});
