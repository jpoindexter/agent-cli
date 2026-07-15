import { paneContextKey } from "./paneOwnership";
import {
  activeProjectSessionId,
  removeProjectSession,
  setActiveProjectSession,
  type ActiveSessionByProject,
  type ProjectSessionsByProject,
} from "./workspaceState";

type ProjectSessionDeletePlanInput = {
  activeSessionByProject: ActiveSessionByProject;
  activeSessionId: string | null;
  activeWorkspacePath: string | null;
  projectPath: string;
  projectSessions: ProjectSessionsByProject;
  sessionId: string;
};

type ProjectSessionDeletePlanBlocked = {
  canDelete: false;
};

type ProjectSessionDeletePlanReady = {
  browserSessionKey: string;
  canDelete: true;
  chatSessionKey: string;
  contextKey: string | null;
  nextActiveSessions: ActiveSessionByProject;
  nextSessions: ProjectSessionsByProject;
  shouldReopenActiveWorkspace: boolean;
};

export type ProjectSessionDeletePlan = ProjectSessionDeletePlanBlocked | ProjectSessionDeletePlanReady;

const sessionRecordKey = (projectPath: string, sessionId: string) => `${projectPath}\n${sessionId}`;

export const planProjectSessionDelete = ({
  activeSessionByProject,
  activeSessionId,
  activeWorkspacePath,
  projectPath,
  projectSessions,
  sessionId,
}: ProjectSessionDeletePlanInput): ProjectSessionDeletePlan => {
  const existing = projectSessions[projectPath] ?? [];
  if (existing.length <= 1) return { canDelete: false };
  const nextSessions = removeProjectSession(projectSessions, projectPath, sessionId);
  const fallbackSessionId = activeProjectSessionId(activeSessionByProject, nextSessions, projectPath);
  const nextActiveSessions = fallbackSessionId
    ? setActiveProjectSession(activeSessionByProject, projectPath, fallbackSessionId)
    : activeSessionByProject;
  return {
    browserSessionKey: sessionRecordKey(projectPath, sessionId),
    canDelete: true,
    chatSessionKey: sessionRecordKey(projectPath, sessionId),
    contextKey: paneContextKey(projectPath, sessionId),
    nextActiveSessions,
    nextSessions,
    shouldReopenActiveWorkspace: activeWorkspacePath === projectPath && activeSessionId === sessionId,
  };
};
