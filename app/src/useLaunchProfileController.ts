import { useMemo, useRef, useState } from "react";
import { createLaunchProfileActions } from "./launchProfileActions";
import {
  LAUNCH_PROFILES,
  createCustomLaunchProfile,
  defaultLaunchProfile,
  defaultTerminalLaunchProfile,
  launchProfileById,
  type LaunchProfile,
} from "./launchProfiles";
import type { ScopedSettingsState } from "./scopedSettings";

type MutableValue<T> = { current: T };

type LaunchProfileControllerOptions = {
  getCurrentRoot: () => string | null;
  getCurrentSessionId: () => string | null;
  randomId: () => string;
  saveStore: () => Promise<unknown>;
  scopedSettings: MutableValue<ScopedSettingsState>;
  setScopedSettings: (settings: ScopedSettingsState) => void;
  setStoreValue: (key: string, value: unknown) => Promise<unknown>;
};

type ProfileBindings = {
  customProfilesRef: MutableValue<LaunchProfile[]>;
  launchProfileRef: MutableValue<LaunchProfile>;
  setCustomProfiles: (profiles: LaunchProfile[]) => void;
  setLaunchProfile: (profile: LaunchProfile) => void;
  setTerminalProfile: (profile: LaunchProfile) => void;
  terminalProfileRef: MutableValue<LaunchProfile>;
};

const createActions = (
  options: LaunchProfileControllerOptions,
  bindings: ProfileBindings,
  changing: boolean,
) => createLaunchProfileActions({
  createCustomProfile: createCustomLaunchProfile,
  getState: () => ({
    changing,
    customProfiles: bindings.customProfilesRef.current,
    launchProfile: bindings.launchProfileRef.current,
    root: options.getCurrentRoot(),
    scopedSettings: options.scopedSettings.current,
    sessionId: options.getCurrentSessionId(),
    terminalProfile: bindings.terminalProfileRef.current,
  }),
  randomId: options.randomId,
  saveStore: options.saveStore,
  setCustomProfiles: bindings.setCustomProfiles,
  setLaunchProfile: bindings.setLaunchProfile,
  setScopedSettings: options.setScopedSettings,
  setStoreValue: options.setStoreValue,
  setTerminalProfile: bindings.setTerminalProfile,
});

export function useLaunchProfileController(options: LaunchProfileControllerOptions) {
  const launchProfileRef = useRef<LaunchProfile>(defaultLaunchProfile());
  const terminalProfileRef = useRef<LaunchProfile>(defaultTerminalLaunchProfile());
  const customProfilesRef = useRef<LaunchProfile[]>([]);
  const [launchProfile, setLaunchProfileState] = useState(defaultLaunchProfile);
  const [terminalProfile, setTerminalProfileState] = useState(defaultTerminalLaunchProfile);
  const [customProfiles, setCustomProfilesState] = useState<LaunchProfile[]>([]);
  const [changing, setChanging] = useState(false);
  const setLaunchProfile = (profile: LaunchProfile) => {
    launchProfileRef.current = profile;
    setLaunchProfileState(profile);
  };
  const setTerminalProfile = (profile: LaunchProfile) => {
    terminalProfileRef.current = profile;
    setTerminalProfileState(profile);
  };
  const setCustomProfiles = (profiles: LaunchProfile[]) => {
    customProfilesRef.current = profiles;
    setCustomProfilesState(profiles);
  };
  const bindings = {
    customProfilesRef, launchProfileRef, setCustomProfiles, setLaunchProfile,
    setTerminalProfile, terminalProfileRef,
  };
  const actions = createActions(options, bindings, changing);
  const hydrate = (profiles: {
    customProfiles: LaunchProfile[];
    launchProfile: LaunchProfile;
    terminalProfile: LaunchProfile;
  }) => {
    setLaunchProfile(profiles.launchProfile);
    setTerminalProfile(profiles.terminalProfile);
    setCustomProfiles(profiles.customProfiles);
  };
  const allProfiles = useMemo(
    () => [...LAUNCH_PROFILES, ...customProfiles], [customProfiles],
  );
  return {
    ...actions, allProfiles, changing, customProfiles, customProfilesRef, hydrate,
    launchProfile, launchProfileRef,
    resolveProfile: (id: string) => customProfilesRef.current.find((profile) => profile.id === id)
      ?? launchProfileById(id),
    setChanging, setTerminalProfile, terminalProfile, terminalProfileRef,
  };
}
