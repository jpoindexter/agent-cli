import { describe, expect, it, vi } from "vitest";
import { DEFAULT_COMMAND_PALETTE_SOURCES } from "./commandPaletteSources";
import { createSettingsPreferenceActions } from "./settingsPreferenceActions";

const createWorkflow = () => {
  const saveSetting = vi.fn();
  const setCommandPaletteSources = vi.fn();
  const setKeybindingOverrides = vi.fn();
  const setNotificationsEnabled = vi.fn();
  const setTheme = vi.fn();
  const requestNotificationPermission = vi.fn().mockResolvedValue("granted");
  const actions = createSettingsPreferenceActions({
    commandPaletteSources: { ...DEFAULT_COMMAND_PALETTE_SOURCES },
    keybindingOverrides: { "app.settings": ["Cmd+,"] },
    requestNotificationPermission,
    saveSetting,
    setCommandPaletteSources,
    setKeybindingOverrides,
    setNotificationsEnabled,
    setTheme,
  });
  return {
    actions,
    requestNotificationPermission,
    saveSetting,
    setCommandPaletteSources,
    setKeybindingOverrides,
    setNotificationsEnabled,
    setTheme,
  };
};

describe("settings preference actions", () => {
  it("updates and persists command palette sources", () => {
    const workflow = createWorkflow();

    workflow.actions.onCommandPaletteSourceChange("files", false);

    const expected = { ...DEFAULT_COMMAND_PALETTE_SOURCES, files: false };
    expect(workflow.setCommandPaletteSources).toHaveBeenCalledWith(expected);
    expect(workflow.saveSetting).toHaveBeenCalledWith("commandPaletteSources", expected);
  });

  it("requests notification permission only when enabling", () => {
    const workflow = createWorkflow();

    workflow.actions.onNotificationsChange(false);
    expect(workflow.requestNotificationPermission).not.toHaveBeenCalled();
    workflow.actions.onNotificationsChange(true);

    expect(workflow.setNotificationsEnabled).toHaveBeenNthCalledWith(1, false);
    expect(workflow.setNotificationsEnabled).toHaveBeenNthCalledWith(2, true);
    expect(workflow.saveSetting).toHaveBeenNthCalledWith(1, "notificationsEnabled", false);
    expect(workflow.saveSetting).toHaveBeenNthCalledWith(2, "notificationsEnabled", true);
    expect(workflow.requestNotificationPermission).toHaveBeenCalledOnce();
  });

  it("updates and persists the theme", () => {
    const workflow = createWorkflow();

    workflow.actions.onThemeChange("mono-ghost");

    expect(workflow.setTheme).toHaveBeenCalledWith("mono-ghost");
    expect(workflow.saveSetting).toHaveBeenCalledWith("appTheme", "mono-ghost");
  });

  it("adds and removes keybinding overrides without mutating the current value", () => {
    const workflow = createWorkflow();

    workflow.actions.onKeybindingOverrideChange("app.command-palette", ["Cmd+K"]);
    expect(workflow.setKeybindingOverrides).toHaveBeenNthCalledWith(1, {
      "app.command-palette": ["Cmd+K"],
      "app.settings": ["Cmd+,"],
    });
    workflow.actions.onKeybindingOverrideChange("app.settings", null);

    expect(workflow.setKeybindingOverrides).toHaveBeenNthCalledWith(2, {});
    expect(workflow.saveSetting).toHaveBeenNthCalledWith(2, "keybindingOverrides", {});
  });
});
