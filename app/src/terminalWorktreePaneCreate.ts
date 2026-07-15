import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { normalizeTerminalPaneLabel } from "./terminalPane";
import type { WorktreeRecord } from "./worktrees";

type BuildCreatedWorktreePaneStateInput = {
  branch: string;
  createdAt: number;
  existingPanes: ManagedTerminalPane[];
  label: string;
  paneId: number;
  path: string;
  profile: LaunchProfile;
  projectRoot: string;
};

export const buildCreatedWorktreePaneState = ({
  branch,
  createdAt,
  existingPanes,
  label,
  paneId,
  path,
  profile,
  projectRoot,
}: BuildCreatedWorktreePaneStateInput): { pane: ManagedTerminalPane; record: WorktreeRecord } => {
  const normalizedLabel = normalizeTerminalPaneLabel(label);
  return {
    pane: {
      createdAt,
      cwd: path,
      exitCode: null,
      id: paneId,
      label: normalizedLabel,
      profile,
      slot: existingPanes.length,
      state: "running",
    },
    record: {
      branch,
      createdAt,
      label: normalizedLabel ?? label,
      paneId: String(paneId),
      path,
      projectRoot,
    },
  };
};
