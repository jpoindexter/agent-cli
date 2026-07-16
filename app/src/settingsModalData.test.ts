import { describe, expect, it } from "vitest";

import {
  filterSettingsRows,
  settingsAgentProfileOptions,
  SETTINGS_CATEGORIES,
  SETTINGS_CATEGORY_GROUPS,
  SETTINGS_ROWS,
  settingsRowsForCategory,
} from "./settingsModalData";

describe("settings modal data", () => {
  it("only exposes categories whose rows exist and map to real behavior", () => {
    const ids = SETTINGS_CATEGORIES.map((category) => category.id);
    expect(ids).toEqual(["general", "appearance", "shortcuts", "layout", "agents", "browser", "connections", "git", "app"]);
    expect(SETTINGS_CATEGORY_GROUPS.map((group) => group.id)).toEqual(["personal", "workbench", "integrations"]);
    for (const id of ids) {
      expect(settingsRowsForCategory(SETTINGS_ROWS, id).length).toBeGreaterThan(0);
    }
    // Dropped Codex categories (account Profile, Pets, billing, chat) and
    // not-yet-real categories (MCP servers) must not appear. "profile" as a
    // row id is fine — agents.profile is the launch profile, not identity.
    for (const dropped of ["mcp", "pets", "billing", "chat"]) {
      expect(SETTINGS_ROWS.some((row) => row.id.includes(dropped))).toBe(false);
      expect(SETTINGS_CATEGORIES.some((category) => category.label.toLowerCase().includes(dropped))).toBe(false);
    }
  });

  it("filters rows across categories by label, hint, and keywords", () => {
    expect(filterSettingsRows(SETTINGS_ROWS, "").length).toBe(SETTINGS_ROWS.length);
    const byKeyword = filterSettingsRows(SETTINGS_ROWS, "localhost");
    expect(byKeyword.map((row) => row.id)).toEqual(["browser.url"]);
    const byLabel = filterSettingsRows(SETTINGS_ROWS, "permission");
    expect(byLabel.map((row) => row.id)).toEqual(["agents.permission"]);
    expect(filterSettingsRows(SETTINGS_ROWS, "oauth").map((row) => row.id)).toEqual(["agents.connections", "connections.manage"]);
    expect(filterSettingsRows(SETTINGS_ROWS, "zzz-none")).toEqual([]);
  });
});

describe("settingsAgentProfileOptions", () => {
  it("keeps chat providers selectable and labels the rest as terminal-only", () => {
    const options = settingsAgentProfileOptions([
      { id: "codex", label: "Codex" },
      { id: "claude", label: "Claude" },
      { id: "shell", label: "Shell" },
      { id: "gemini", label: "Gemini" },
    ]);

    expect(options).toEqual([
      { disabled: false, id: "codex", label: "Codex" },
      { disabled: false, id: "claude", label: "Claude" },
      { disabled: true, id: "shell", label: "Shell · not a chat provider" },
      { disabled: true, id: "gemini", label: "Gemini · raw terminal only" },
    ]);
  });
});
