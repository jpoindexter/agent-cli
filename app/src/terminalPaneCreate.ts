import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";

type BuildCreatedTerminalPaneInput = {
  createdAt: number;
  existingPanes: ManagedTerminalPane[];
  paneId: number;
  profile: LaunchProfile;
  root: string;
  savedLabel: string | null;
};

export const buildCreatedTerminalPane = ({
  createdAt,
  existingPanes,
  paneId,
  profile,
  root,
  savedLabel,
}: BuildCreatedTerminalPaneInput): ManagedTerminalPane => ({
  createdAt,
  cwd: root,
  exitCode: null,
  id: paneId,
  label: savedLabel,
  profile,
  slot: existingPanes.length,
  state: "running",
});
