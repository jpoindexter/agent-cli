import type { LaunchProfile } from "./launchProfiles";
import { canUseShellProfile, findShellProfile } from "./shellProfileNotice";

type AppNoticesInput = {
  chrome: {
    actionNotice: string | null;
    crashNotice: string | null;
    setActionNotice: (notice: string | null) => void;
    setCrashNotice: (notice: string | null) => void;
  };
  launchError: string | null;
  openFolder: () => Promise<unknown>;
  profiles: {
    changing: boolean;
    launchProfile: LaunchProfile;
    profilesList: LaunchProfile[];
    switchLaunchProfile: (profile: LaunchProfile) => Promise<unknown>;
  };
};

export const appNoticesPropsFrom = (input: AppNoticesInput) => ({
  actionNotice: input.chrome.actionNotice,
  canUseShellProfile: canUseShellProfile(input.profiles.changing, input.profiles.launchProfile.id),
  crashNotice: input.chrome.crashNotice,
  launchError: input.launchError,
  onDismissAction: () => input.chrome.setActionNotice(null),
  onDismissCrash: () => input.chrome.setCrashNotice(null),
  onOpenFolder: () => void input.openFolder(),
  onUseShellProfile: () => {
    const shell = findShellProfile(input.profiles.profilesList);
    if (shell) void input.profiles.switchLaunchProfile(shell);
  },
});
