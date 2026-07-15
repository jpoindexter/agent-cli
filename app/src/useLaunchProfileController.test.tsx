// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  defaultTerminalLaunchProfile,
  launchProfileById,
  type LaunchProfile,
} from "./launchProfiles";
import { defaultScopedSettings } from "./scopedSettings";
import { useLaunchProfileController } from "./useLaunchProfileController";

const customProfile: LaunchProfile = {
  args: [],
  command: "npm run dev",
  id: "custom:dev",
  label: "Dev",
  useLoginShell: true,
};

const createOptions = () => {
  const scopedSettings = { current: defaultScopedSettings() };
  const stored = new Map<string, unknown>();
  const options = {
    getCurrentRoot: vi.fn(() => "/repo" as string | null),
    getCurrentSessionId: vi.fn(() => "session-1" as string | null),
    randomId: vi.fn(() => "dev"),
    saveStore: vi.fn(async () => undefined),
    scopedSettings,
    setScopedSettings: vi.fn((next) => { scopedSettings.current = next; }),
    setStoreValue: vi.fn(async (key: string, value: unknown) => { stored.set(key, value); }),
  };
  return { options, stored };
};

describe("useLaunchProfileController", () => {
  it("switches the agent profile while keeping its ref and scoped setting synchronized", async () => {
    const { options, stored } = createOptions();
    const { result } = renderHook(() => useLaunchProfileController(options));

    await act(async () => { await result.current.switchLaunchProfile(launchProfileById("claude")); });

    expect(result.current.launchProfile.id).toBe("claude");
    expect(result.current.launchProfileRef.current.id).toBe("claude");
    expect(options.scopedSettings.current.global.agentProfileId).toBe("claude");
    expect(stored.get("launchProfile")).toMatchObject({ id: "claude" });
  });

  it("hydrates and resolves a custom terminal profile", () => {
    const { options } = createOptions();
    const { result } = renderHook(() => useLaunchProfileController(options));

    act(() => result.current.hydrate({
      customProfiles: [customProfile],
      launchProfile: launchProfileById("codex"),
      terminalProfile: customProfile,
    }));

    expect(result.current.resolveProfile(customProfile.id)).toEqual(customProfile);
    expect(result.current.allProfiles[result.current.allProfiles.length - 1]).toEqual(customProfile);
    expect(result.current.terminalProfileRef.current).toEqual(customProfile);
  });

  it("falls back to the default terminal after removing its active custom profile", async () => {
    const { options } = createOptions();
    const { result } = renderHook(() => useLaunchProfileController(options));
    act(() => result.current.hydrate({
      customProfiles: [customProfile],
      launchProfile: launchProfileById("codex"),
      terminalProfile: customProfile,
    }));

    await act(async () => { await result.current.removeCustomProfile(customProfile.id); });

    expect(result.current.customProfiles).toEqual([]);
    expect(result.current.terminalProfile.id).toBe(defaultTerminalLaunchProfile().id);
  });
});
