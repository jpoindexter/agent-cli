import { describe, expect, it } from "vitest";
import { buildCreatedWorktreePaneState } from "./terminalWorktreePaneCreate";
import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";

const shellProfile: LaunchProfile = {
  id: "shell",
  label: "Shell",
  command: "/bin/zsh",
  args: ["-l"],
  useLoginShell: false,
};

const existingPane: ManagedTerminalPane = {
  id: 4,
  profile: shellProfile,
  cwd: "/repo",
  slot: 0,
  label: "Shell 1",
  state: "running",
  exitCode: null,
  createdAt: 10,
};

describe("buildCreatedWorktreePaneState", () => {
  it("builds the terminal pane and persisted worktree record from one timestamp", () => {
    const state = buildCreatedWorktreePaneState({
      branch: "feature/checkout",
      createdAt: 44,
      existingPanes: [existingPane],
      label: " Checkout UI ",
      paneId: 12,
      path: "/repo/.worktrees/checkout-ui",
      profile: shellProfile,
      projectRoot: "/repo",
    });

    expect(state.pane).toMatchObject({
      createdAt: 44,
      cwd: "/repo/.worktrees/checkout-ui",
      exitCode: null,
      id: 12,
      label: "Checkout UI",
      slot: 1,
      state: "running",
    });
    expect(state.record).toEqual({
      branch: "feature/checkout",
      createdAt: 44,
      label: "Checkout UI",
      paneId: "12",
      path: "/repo/.worktrees/checkout-ui",
      projectRoot: "/repo",
    });
  });

  it("falls back to the raw label when normalization removes it", () => {
    const state = buildCreatedWorktreePaneState({
      branch: "scratch",
      createdAt: 12,
      existingPanes: [],
      label: "   ",
      paneId: 2,
      path: "/repo/.worktrees/scratch",
      profile: shellProfile,
      projectRoot: "/repo",
    });

    expect(state.pane.label).toBeNull();
    expect(state.record.label).toBe("   ");
  });
});
