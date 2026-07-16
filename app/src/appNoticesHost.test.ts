import { describe, expect, it, vi } from "vitest";
import type { LaunchProfile } from "./launchProfiles";
import { appNoticesPropsFrom } from "./appNoticesHost";

const shell: LaunchProfile = {
  id: "shell", label: "Shell", command: "zsh", args: [], useLoginShell: true,
};
const codex: LaunchProfile = {
  id: "codex", label: "Codex", command: "codex", args: [], useLoginShell: false,
};

const createInput = () => ({
  chrome: {
    actionNotice: "Copied" as string | null,
    crashNotice: null as string | null,
    setActionNotice: vi.fn(),
    setCrashNotice: vi.fn(),
  },
  launchError: null as string | null,
  openFolder: vi.fn(async () => true),
  profiles: {
    changing: false,
    launchProfile: codex,
    profilesList: [shell, codex],
    switchLaunchProfile: vi.fn(async () => {}),
  },
});

describe("appNoticesPropsFrom", () => {
  it("maps notices, dismissals, and the shell fallback", () => {
    const input = createInput();
    const props = appNoticesPropsFrom(input);

    expect(props).toMatchObject({
      actionNotice: "Copied", canUseShellProfile: true, crashNotice: null, launchError: null,
    });

    props.onDismissAction();
    expect(input.chrome.setActionNotice).toHaveBeenCalledWith(null);

    props.onUseShellProfile();
    expect(input.profiles.switchLaunchProfile).toHaveBeenCalledWith(shell);
  });

  it("hides the shell fallback while switching or already on shell", () => {
    const input = createInput();
    input.profiles.changing = true;

    expect(appNoticesPropsFrom(input).canUseShellProfile).toBe(false);
  });
});
