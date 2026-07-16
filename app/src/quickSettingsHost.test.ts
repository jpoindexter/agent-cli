import { describe, expect, it, vi } from "vitest";
import type { LaunchProfile } from "./launchProfiles";
import { quickSettingsDrawerPropsFrom } from "./quickSettingsHost";

const profile: LaunchProfile = {
  id: "zsh", label: "zsh", command: "zsh", args: [], useLoginShell: true,
};

const createInput = () => ({
  composer: { approvalMode: "ask" as const, canSetApproval: true },
  handlers: {
    approvalChange: vi.fn(async () => {}),
    layoutChange: vi.fn(),
    openFolder: vi.fn(async () => true),
    refreshFiles: vi.fn(),
    setSurfaceMode: vi.fn(),
    toggleRawTerminal: vi.fn(async () => {}),
    toolModeChange: vi.fn(),
  },
  layout: {
    surfaceMode: "terminal" as const,
    toolMode: "files" as const,
    workbenchLayout: "right" as const,
  },
  profiles: {
    allProfiles: [profile],
    changing: false,
    resolveProfile: vi.fn(() => profile),
    switchTerminalProfile: vi.fn(async () => {}),
    terminalProfile: profile,
  },
  workspacePath: "/repo" as string | null,
});

describe("quickSettingsDrawerPropsFrom", () => {
  it("maps the drawer state from the controller bundles", () => {
    const props = quickSettingsDrawerPropsFrom(createInput());

    expect(props).toMatchObject({
      approvalMode: "ask", canSetApproval: true, hasWorkspace: true,
      launchProfileChanging: false, terminalOpen: true,
      toolMode: "files", workbenchLayout: "right",
    });
  });

  it("routes the bottom tray toggle and profile switching", () => {
    const input = createInput();
    const props = quickSettingsDrawerPropsFrom(input);

    props.onBottomTrayChange(true);
    expect(input.handlers.toggleRawTerminal).toHaveBeenCalled();

    props.onBottomTrayChange(false);
    expect(input.handlers.setSurfaceMode).toHaveBeenCalledWith("chat");

    props.onProfileChange("zsh");
    expect(input.profiles.resolveProfile).toHaveBeenCalledWith("zsh");
    expect(input.profiles.switchTerminalProfile).toHaveBeenCalledWith(profile);
  });
});
