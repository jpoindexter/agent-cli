import { describe, expect, it, vi } from "vitest";
import { defaultScopedSettings } from "./scopedSettings";
import { defaultTerminalLaunchProfile, type LaunchProfile } from "./launchProfiles";
import { createLaunchProfileActions } from "./launchProfileActions";

const codex: LaunchProfile = {
  args: [], command: "codex", id: "codex", label: "Codex", useLoginShell: false,
};

const custom: LaunchProfile = {
  args: [], command: "npm run dev", id: "custom-1", label: "Dev", useLoginShell: false,
};

const createActions = () => {
  const calls: string[] = [];
  const state = {
    changing: false,
    customProfiles: [custom],
    launchProfile: defaultTerminalLaunchProfile(),
    root: "/repo" as string | null,
    scopedSettings: defaultScopedSettings(),
    sessionId: "session-1" as string | null,
    terminalProfile: custom,
  };
  const dependencies = {
    createCustomProfile: vi.fn(() => custom),
    getState: vi.fn(() => state),
    randomId: vi.fn(() => "custom-1"),
    saveStore: vi.fn(async () => { calls.push("save"); }),
    setCustomProfiles: vi.fn((profiles: LaunchProfile[]) => {
      calls.push("custom");
      state.customProfiles = profiles;
    }),
    setLaunchProfile: vi.fn((profile: LaunchProfile) => {
      calls.push("launch");
      state.launchProfile = profile;
    }),
    setScopedSettings: vi.fn((settings) => {
      calls.push("scoped");
      state.scopedSettings = settings;
    }),
    setStoreValue: vi.fn(async (key: string) => { calls.push(`store:${key}`); }),
    setTerminalProfile: vi.fn((profile: LaunchProfile) => {
      calls.push("terminal");
      state.terminalProfile = profile;
    }),
  };
  return { actions: createLaunchProfileActions(dependencies), calls, dependencies, state };
};

describe("createLaunchProfileActions", () => {
  it("switches the agent profile and persists its global scoped setting", async () => {
    const { actions, calls, dependencies } = createActions();

    await actions.switchLaunchProfile(codex);

    expect(calls).toEqual([
      "launch", "scoped", "store:launchProfile", "store:scopedSettings", "save",
    ]);
    expect(dependencies.setScopedSettings).toHaveBeenCalledWith(expect.objectContaining({
      global: expect.objectContaining({ agentProfileId: "codex" }),
    }));
  });

  it("adds a normalized custom terminal profile and persists it", async () => {
    const { actions, calls, dependencies } = createActions();

    await actions.addCustomProfile("Dev", "npm run dev");

    expect(dependencies.createCustomProfile).toHaveBeenCalledWith("custom-1", "Dev", "npm run dev");
    expect(calls).toEqual(["custom", "store:customLaunchProfiles", "save"]);
  });

  it("removes the active custom profile and falls back to the default terminal", async () => {
    const { actions, calls, state } = createActions();

    await actions.removeCustomProfile("custom-1");

    expect(state.customProfiles).toEqual([]);
    expect(state.terminalProfile.id).toBe(defaultTerminalLaunchProfile().id);
    expect(calls).toEqual([
      "custom", "store:customLaunchProfiles", "terminal", "store:terminalLaunchProfile", "save",
    ]);
  });
});
