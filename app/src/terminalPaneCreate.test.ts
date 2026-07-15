import { describe, expect, it } from "vitest";
import { buildCreatedTerminalPane } from "./terminalPaneCreate";
import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";

const profile: LaunchProfile = {
  args: ["-l"],
  command: "/bin/zsh",
  id: "shell",
  label: "Shell",
  useLoginShell: false,
};

const existingPane: ManagedTerminalPane = {
  createdAt: 1,
  cwd: "/repo",
  exitCode: null,
  id: 1,
  label: null,
  profile,
  slot: 0,
  state: "running",
};

describe("created terminal pane", () => {
  it("assigns the next slot and saved slot label", () => {
    const pane = buildCreatedTerminalPane({
      createdAt: 22,
      existingPanes: [existingPane],
      paneId: 9,
      profile,
      root: "/repo",
      savedLabel: "Shell 2",
    });

    expect(pane).toMatchObject({
      createdAt: 22,
      cwd: "/repo",
      exitCode: null,
      id: 9,
      label: "Shell 2",
      slot: 1,
      state: "running",
    });
  });
});
