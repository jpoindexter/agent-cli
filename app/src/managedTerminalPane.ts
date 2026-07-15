import type { LaunchProfile } from "./launchProfiles";
import type { TerminalPaneState } from "./terminalPane";

export type ManagedTerminalPane = {
  id: number;
  profile: LaunchProfile;
  cwd: string;
  slot: number;
  label: string | null;
  state: TerminalPaneState;
  exitCode: number | null;
  createdAt: number;
};
