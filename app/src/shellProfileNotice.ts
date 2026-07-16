import type { LaunchProfile } from "./launchProfiles";

const SHELL_PROFILE_ID = "shell";

export const canUseShellProfile = (changing: boolean, launchProfileId: string) =>
  !changing && launchProfileId !== SHELL_PROFILE_ID;

export const findShellProfile = (profiles: LaunchProfile[]) =>
  profiles.find((profile) => profile.id === SHELL_PROFILE_ID);
