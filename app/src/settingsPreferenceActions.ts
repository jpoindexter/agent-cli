import type { CommandPaletteSourceId, CommandPaletteSourceSettings } from "./commandPaletteSources";
import type { KeybindingOverrides } from "./shortcuts";

type AppTheme = "graphite" | "mono-ghost";
type SettingKey = "appTheme" | "commandPaletteSources" | "keybindingOverrides" | "notificationsEnabled";

type SettingsPreferenceWorkflow = {
  commandPaletteSources: CommandPaletteSourceSettings;
  keybindingOverrides: KeybindingOverrides;
  requestNotificationPermission: () => Promise<unknown>;
  saveSetting: (key: SettingKey, value: unknown) => void;
  setCommandPaletteSources: (sources: CommandPaletteSourceSettings) => void;
  setKeybindingOverrides: (overrides: KeybindingOverrides) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setTheme: (theme: AppTheme) => void;
};

export const createSettingsPreferenceActions = (workflow: SettingsPreferenceWorkflow) => ({
  onCommandPaletteSourceChange: (source: CommandPaletteSourceId, enabled: boolean) => {
    const next = { ...workflow.commandPaletteSources, [source]: enabled };
    workflow.setCommandPaletteSources(next);
    workflow.saveSetting("commandPaletteSources", next);
  },
  onKeybindingOverrideChange: (id: string, keys: string[] | null) => {
    const next = { ...workflow.keybindingOverrides };
    if (keys) next[id] = keys;
    else delete next[id];
    workflow.setKeybindingOverrides(next);
    workflow.saveSetting("keybindingOverrides", next);
  },
  onNotificationsChange: (enabled: boolean) => {
    workflow.setNotificationsEnabled(enabled);
    workflow.saveSetting("notificationsEnabled", enabled);
    if (enabled) void workflow.requestNotificationPermission().catch(() => {});
  },
  onThemeChange: (theme: AppTheme) => {
    workflow.setTheme(theme);
    workflow.saveSetting("appTheme", theme);
  },
});
