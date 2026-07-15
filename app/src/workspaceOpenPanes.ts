import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import type { PaneLayoutRecord, PaneLayoutsBySession } from "./sessionRestore";
import { workspaceOpenLayoutForRoot } from "./workspaceOpenSession";

type BuildWorkspaceOpenPaneInput = {
  createdAt: number;
  cwd: string;
  layout: PaneLayoutRecord;
  paneId: number;
  profile: LaunchProfile;
  savedLabel: string | null;
};

export const buildWorkspaceOpenPane = ({
  createdAt,
  cwd,
  layout,
  paneId,
  profile,
  savedLabel,
}: BuildWorkspaceOpenPaneInput): ManagedTerminalPane => ({
  createdAt,
  cwd,
  exitCode: null,
  id: paneId,
  label: layout.label ?? savedLabel,
  profile,
  slot: layout.slot,
  state: "running",
});

type OpenWorkspaceTerminalPanesInput = {
  createPane: (path: string, profile: LaunchProfile) => Promise<{ paneId: number }>;
  fallbackLayout: PaneLayoutRecord[];
  initialLayout: PaneLayoutRecord[];
  now: () => number;
  openWorkspace: (path: string, profile: LaunchProfile) => Promise<{ paneId: number; root: string }>;
  paneLayouts: PaneLayoutsBySession;
  path: string;
  requestedSessionId: string | null;
  resolveProfile: (id: string) => LaunchProfile;
  savedLabelForSlot: (root: string, slot: number) => string | null;
};

export const openWorkspaceTerminalPanes = async ({
  createPane, fallbackLayout, initialLayout, now, openWorkspace, paneLayouts,
  path, requestedSessionId, resolveProfile, savedLabelForSlot,
}: OpenWorkspaceTerminalPanesInput) => {
  const firstLayout = initialLayout[0] ?? fallbackLayout[0];
  const firstProfile = resolveProfile(firstLayout.profileId);
  const result = await openWorkspace(path, firstProfile);
  const root = result.root;
  const layout = workspaceOpenLayoutForRoot({ initialLayout, paneLayouts, root, sessionId: requestedSessionId });
  const [firstRecord, ...restRecords] = layout.length > 0 ? layout : fallbackLayout;
  const panes = [buildWorkspaceOpenPane({
    createdAt: now(), cwd: root, layout: firstRecord, paneId: result.paneId,
    profile: firstProfile, savedLabel: savedLabelForSlot(root, firstRecord.slot),
  })];
  for (const record of restRecords) {
    const profile = resolveProfile(record.profileId);
    const pane = await createPane(root, profile);
    panes.push(buildWorkspaceOpenPane({
      createdAt: now(), cwd: root, layout: record, paneId: pane.paneId,
      profile, savedLabel: savedLabelForSlot(root, record.slot),
    }));
  }
  return { activePaneId: result.paneId, panes, root };
};
