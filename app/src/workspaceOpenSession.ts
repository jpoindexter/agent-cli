import {
  activeProjectSessionId,
  ensureProjectSessions,
  setActiveProjectSession,
  type ActiveSessionByProject,
  type ProjectSessionsByProject,
} from "./workspaceState";
import type { PaneLayoutRecord, PaneLayoutsBySession } from "./sessionRestore";

type PrepareWorkspaceOpenSessionInput = {
  activeSessions: ActiveSessionByProject;
  defaultProfileId: string;
  now: number;
  paneLayouts: PaneLayoutsBySession;
  path: string;
  savedLabel: string | null;
  sessions: ProjectSessionsByProject;
};

export const prepareWorkspaceOpenSession = ({
  activeSessions,
  defaultProfileId,
  now,
  paneLayouts,
  path,
  savedLabel,
  sessions,
}: PrepareWorkspaceOpenSessionInput) => {
  const nextSessions = ensureProjectSessions(sessions, path, now);
  const sessionId = activeProjectSessionId(activeSessions, nextSessions, path);
  const nextActiveSessions = sessionId
    ? setActiveProjectSession(activeSessions, path, sessionId)
    : activeSessions;
  const fallbackLayout: PaneLayoutRecord[] = [
    { slot: 0, profileId: defaultProfileId, label: savedLabel },
  ];
  const restoredLayout = sessionId ? paneLayouts[`${path}\n${sessionId}`] : null;
  return {
    activeSessions: nextActiveSessions,
    fallbackLayout,
    layout: restoredLayout && restoredLayout.length > 0 ? restoredLayout : fallbackLayout,
    sessionId,
    sessions: nextSessions,
  };
};

export const workspaceOpenLayoutForRoot = ({
  initialLayout,
  paneLayouts,
  root,
  sessionId,
}: {
  initialLayout: PaneLayoutRecord[];
  paneLayouts: PaneLayoutsBySession;
  root: string;
  sessionId: string | null;
}) => sessionId ? paneLayouts[`${root}\n${sessionId}`] ?? initialLayout : initialLayout;
