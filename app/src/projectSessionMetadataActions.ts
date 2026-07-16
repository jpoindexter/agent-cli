import { setProjectSessionArchived, setProjectSessionPinned } from "./workspaceState";
import type {
  ActiveSessionByProject,
  ProjectSession,
  ProjectSessionsByProject,
} from "./workspaceStateTypes";

type ProjectSessionMetadataActionsOptions = {
  getActiveSessions: () => ActiveSessionByProject;
  getSessions: () => ProjectSessionsByProject;
  notify: (message: string) => void;
  now: () => number;
  persist: (
    sessions: ProjectSessionsByProject, activeSessions: ActiveSessionByProject,
  ) => Promise<unknown>;
};

const updateSessionMetadata = async (
  options: ProjectSessionMetadataActionsOptions,
  projectPath: string,
  sessionId: string,
  metadata: Partial<ProjectSession>,
) => {
  const sessions = options.getSessions();
  const next = {
    ...sessions,
    [projectPath]: (sessions[projectPath] ?? []).map((session) =>
      session.id === sessionId ? { ...session, ...metadata, updatedAt: options.now() } : session,
    ),
  };
  await options.persist(next, options.getActiveSessions());
};

const archiveSession = async (
  options: ProjectSessionMetadataActionsOptions,
  projectPath: string,
  session: ProjectSession,
  archived: boolean,
) => {
  const sessions = options.getSessions();
  const next = setProjectSessionArchived(sessions, projectPath, session.id, archived);
  if (next === sessions) return;
  await options.persist(next, options.getActiveSessions());
};

const pinSession = async (
  options: ProjectSessionMetadataActionsOptions,
  projectPath: string,
  session: ProjectSession,
  pinned: boolean,
) => {
  const sessions = options.getSessions();
  const next = setProjectSessionPinned(sessions, projectPath, session.id, pinned);
  if (next === sessions) return;
  await options.persist(next, options.getActiveSessions());
  options.notify(pinned ? `Pinned ${session.title}` : `Unpinned ${session.title}`);
};

export const createProjectSessionMetadataActions = (
  options: ProjectSessionMetadataActionsOptions,
) => ({
  archiveSession: (projectPath: string, session: ProjectSession, archived: boolean) =>
    archiveSession(options, projectPath, session, archived),
  pinSession: (projectPath: string, session: ProjectSession, pinned: boolean) =>
    pinSession(options, projectPath, session, pinned),
  updateSessionMetadata: (
    projectPath: string, sessionId: string, metadata: Partial<ProjectSession>,
  ) => updateSessionMetadata(options, projectPath, sessionId, metadata),
});
