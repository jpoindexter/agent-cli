import type { LaunchProfile } from "./launchProfiles";
import { defaultTerminalLaunchProfile } from "./launchProfiles";
import { setScopedSetting, type ScopedSettingsState } from "./scopedSettings";

type LaunchProfileState = {
  changing: boolean;
  customProfiles: LaunchProfile[];
  launchProfile: LaunchProfile;
  root: string | null;
  scopedSettings: ScopedSettingsState;
  sessionId: string | null;
  terminalProfile: LaunchProfile;
};

type LaunchProfileDependencies = {
  createCustomProfile: (id: string, label: string, command: string) => LaunchProfile;
  getState: () => LaunchProfileState;
  randomId: () => string;
  saveStore: () => Promise<unknown>;
  setCustomProfiles: (profiles: LaunchProfile[]) => void;
  setLaunchProfile: (profile: LaunchProfile) => void;
  setScopedSettings: (settings: ScopedSettingsState) => void;
  setStoreValue: (key: string, value: unknown) => Promise<unknown>;
  setTerminalProfile: (profile: LaunchProfile) => void;
};

const switchLaunchProfile = async (
  dependencies: LaunchProfileDependencies,
  profile: LaunchProfile,
) => {
  const state = dependencies.getState();
  if (profile.id === state.launchProfile.id || state.changing) return;
  const scopedSettings = setScopedSetting(
    state.scopedSettings, "global", "agentProfileId", profile.id, state.root, state.sessionId,
  );
  dependencies.setLaunchProfile(profile);
  dependencies.setScopedSettings(scopedSettings);
  await dependencies.setStoreValue("launchProfile", profile);
  await dependencies.setStoreValue("scopedSettings", scopedSettings);
  await dependencies.saveStore();
};

const switchTerminalProfile = async (
  dependencies: LaunchProfileDependencies,
  profile: LaunchProfile,
) => {
  const state = dependencies.getState();
  if (profile.id === state.terminalProfile.id || state.changing) return;
  dependencies.setTerminalProfile(profile);
  await dependencies.setStoreValue("terminalLaunchProfile", profile);
  await dependencies.saveStore();
};

const addCustomProfile = async (
  dependencies: LaunchProfileDependencies,
  label: string,
  command: string,
) => {
  const profile = dependencies.createCustomProfile(dependencies.randomId(), label, command);
  const profiles = [...dependencies.getState().customProfiles, profile];
  dependencies.setCustomProfiles(profiles);
  await dependencies.setStoreValue("customLaunchProfiles", profiles);
  await dependencies.saveStore();
};

const removeCustomProfile = async (
  dependencies: LaunchProfileDependencies,
  profileId: string,
) => {
  const state = dependencies.getState();
  const profiles = state.customProfiles.filter((profile) => profile.id !== profileId);
  if (profiles.length === state.customProfiles.length) return;
  dependencies.setCustomProfiles(profiles);
  await dependencies.setStoreValue("customLaunchProfiles", profiles);
  if (state.terminalProfile.id === profileId) {
    await switchTerminalProfile(dependencies, defaultTerminalLaunchProfile());
  } else {
    await dependencies.saveStore();
  }
};

export const createLaunchProfileActions = (dependencies: LaunchProfileDependencies) => ({
  addCustomProfile: (label: string, command: string) => addCustomProfile(dependencies, label, command),
  removeCustomProfile: (profileId: string) => removeCustomProfile(dependencies, profileId),
  switchLaunchProfile: (profile: LaunchProfile) => switchLaunchProfile(dependencies, profile),
  switchTerminalProfile: (profile: LaunchProfile) => switchTerminalProfile(dependencies, profile),
});
