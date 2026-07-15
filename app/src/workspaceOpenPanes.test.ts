import { describe, expect, it, vi } from "vitest";
import { buildWorkspaceOpenPane, openWorkspaceTerminalPanes } from "./workspaceOpenPanes";
import type { LaunchProfile } from "./launchProfiles";

const shellProfile: LaunchProfile = {
  id: "shell",
  label: "Shell",
  command: "/bin/zsh",
  args: ["-l"],
  useLoginShell: false,
};

const serverProfile: LaunchProfile = {
  ...shellProfile,
  id: "server",
  label: "Server",
};

describe("buildWorkspaceOpenPane", () => {
  it("builds a running pane from a restored layout record", () => {
    const pane = buildWorkspaceOpenPane({
      createdAt: 55,
      cwd: "/repo",
      layout: { slot: 2, profileId: "shell", label: "Server" },
      paneId: 9,
      profile: shellProfile,
      savedLabel: "Saved label",
    });

    expect(pane).toEqual({
      createdAt: 55,
      cwd: "/repo",
      exitCode: null,
      id: 9,
      label: "Server",
      profile: shellProfile,
      slot: 2,
      state: "running",
    });
  });

  it("falls back to the saved label when the layout has no label", () => {
    const pane = buildWorkspaceOpenPane({
      createdAt: 56,
      cwd: "/repo",
      layout: { slot: 0, profileId: "shell", label: null },
      paneId: 10,
      profile: shellProfile,
      savedLabel: "Shell 1",
    });

    expect(pane.label).toBe("Shell 1");
  });
});

describe("openWorkspaceTerminalPanes", () => {
  it("opens the workspace and restores every pane from the resolved-root layout", async () => {
    const createPane = vi.fn(async () => ({ paneId: 10 }));
    const openWorkspace = vi.fn(async () => ({ paneId: 9, root: "/resolved" }));
    const restoredLayout = [
      { slot: 0, profileId: "shell", label: "Primary" },
      { slot: 1, profileId: "server", label: null },
    ];

    const opened = await openWorkspaceTerminalPanes({
      createPane,
      fallbackLayout: [{ slot: 0, profileId: "shell", label: null }],
      initialLayout: restoredLayout,
      now: () => 55,
      openWorkspace,
      paneLayouts: { "/resolved\nsession-1": restoredLayout },
      path: "/requested",
      requestedSessionId: "session-1",
      resolveProfile: (id) => id === "server" ? serverProfile : shellProfile,
      savedLabelForSlot: (_root, slot) => `Saved ${slot + 1}`,
    });

    expect(openWorkspace).toHaveBeenCalledWith("/requested", shellProfile);
    expect(createPane).toHaveBeenCalledWith("/resolved", serverProfile);
    expect(opened.root).toBe("/resolved");
    expect(opened.activePaneId).toBe(9);
    expect(opened.panes.map((pane) => ({ id: pane.id, label: pane.label, slot: pane.slot }))).toEqual([
      { id: 9, label: "Primary", slot: 0 },
      { id: 10, label: "Saved 2", slot: 1 },
    ]);
  });
});
