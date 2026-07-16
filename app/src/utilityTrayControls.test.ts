import { describe, expect, it, vi } from "vitest";
import type { LaunchProfile } from "./launchProfiles";
import { createUtilityTrayControls } from "./utilityTrayControls";

const profile: LaunchProfile = {
  id: "zsh", label: "zsh", command: "zsh", args: [], useLoginShell: true,
};

const createOptions = () => ({
  closeSettings: vi.fn(),
  createTerminalPane: vi.fn(async () => true),
  defaultProfile: () => profile,
  getRoot: vi.fn(() => "/repo" as string | null),
  getSessionId: vi.fn(() => "chat" as string | null),
  getSurfaceMode: vi.fn(() => "chat" as "chat" | "terminal"),
  getTrayMode: vi.fn(() => "terminal" as const),
  hasTerminalPanes: vi.fn(() => true),
  pickWorkspace: vi.fn(async () => true),
  resolveProfile: vi.fn(() => profile),
  setSurfaceMode: vi.fn(),
  setTrayMode: vi.fn(),
});

describe("createUtilityTrayControls", () => {
  it("collapses the open terminal tray back to chat", async () => {
    const options = createOptions();
    options.getSurfaceMode.mockReturnValue("terminal");
    const controls = createUtilityTrayControls(options);

    await controls.toggleRawTerminal();

    expect(options.setSurfaceMode).toHaveBeenCalledWith("chat");
    expect(options.createTerminalPane).not.toHaveBeenCalled();
  });

  it("opens the folder picker with a terminal when no workspace is active", async () => {
    const options = createOptions();
    options.getRoot.mockReturnValue(null);
    const controls = createUtilityTrayControls(options);

    await controls.toggleRawTerminal();

    expect(options.setTrayMode).toHaveBeenCalledWith("terminal");
    expect(options.setSurfaceMode).toHaveBeenCalledWith("terminal");
    expect(options.pickWorkspace).toHaveBeenCalledWith({ openTerminal: true });
  });

  it("creates a shell first when the session has no panes and aborts on failure", async () => {
    const options = createOptions();
    options.hasTerminalPanes.mockReturnValue(false);
    options.createTerminalPane.mockResolvedValue(false);
    const controls = createUtilityTrayControls(options);

    await controls.toggleRawTerminal();

    expect(options.createTerminalPane).toHaveBeenCalledWith(profile);
    expect(options.setSurfaceMode).not.toHaveBeenCalled();
  });

  it("routes tray tabs: same mode closes, terminal delegates, others open", async () => {
    const options = createOptions();
    options.getSurfaceMode.mockReturnValue("terminal");
    options.getTrayMode.mockReturnValue("activity" as never);
    const controls = createUtilityTrayControls(options);

    await controls.openUtilityTray("activity" as never);
    expect(options.setSurfaceMode).toHaveBeenLastCalledWith("chat");

    await controls.openUtilityTray("shell" as never);
    expect(options.setTrayMode).toHaveBeenLastCalledWith("shell");
    expect(options.setSurfaceMode).toHaveBeenLastCalledWith("terminal");
  });

  it("opens an agent connection pane from settings", async () => {
    const options = createOptions();
    const controls = createUtilityTrayControls(options);

    await controls.openAgentConnection("codex");

    expect(options.closeSettings).toHaveBeenCalled();
    expect(options.resolveProfile).toHaveBeenCalledWith("codex");
    expect(options.setTrayMode).toHaveBeenCalledWith("terminal");
    expect(options.setSurfaceMode).toHaveBeenCalledWith("terminal");
  });
});
