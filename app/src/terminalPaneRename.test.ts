import { describe, expect, it, vi } from "vitest";
import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { createTerminalPaneRename } from "./terminalPaneRename";

const profile: LaunchProfile = {
  id: "zsh", label: "zsh", command: "zsh", args: [], useLoginShell: true,
};
const pane = (id: number, label: string | null = null): ManagedTerminalPane => ({
  createdAt: id, cwd: "/repo", exitCode: null, id, label, profile, slot: id - 1, state: "running",
});

const createOptions = () => ({
  getPanes: vi.fn(() => [pane(1), pane(2)]),
  getRoot: vi.fn(() => "/repo" as string | null),
  getSessionId: vi.fn(() => "chat" as string | null),
  persistLabel: vi.fn(async () => {}),
  promptLabel: vi.fn(() => "  Build shell  " as string | null),
  setSessionPanes: vi.fn(),
});

describe("createTerminalPaneRename", () => {
  it("renames the pane, keeps others untouched, and persists the label", async () => {
    const options = createOptions();
    const rename = createTerminalPaneRename(options);

    await rename(pane(2));

    expect(options.promptLabel).toHaveBeenCalledWith("zsh 2");
    expect(options.setSessionPanes).toHaveBeenCalledWith(
      "/repo", "chat",
      [pane(1), { ...pane(2), label: "Build shell" }],
      2,
    );
    expect(options.persistLabel).toHaveBeenCalledWith("/repo", 1, "Build shell");
  });

  it("does nothing when the prompt is cancelled or no session is active", async () => {
    const options = createOptions();
    options.promptLabel.mockReturnValue(null);
    const rename = createTerminalPaneRename(options);

    await rename(pane(1));
    expect(options.setSessionPanes).not.toHaveBeenCalled();

    options.getSessionId.mockReturnValue(null);
    await rename(pane(1));
    expect(options.getPanes).toHaveBeenCalledTimes(1);
    expect(options.persistLabel).not.toHaveBeenCalled();
  });
});
