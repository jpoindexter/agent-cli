import { planProjectSessionCreate } from "./projectSessionCreate";
import { planProjectSessionSwitch } from "./projectSessionSwitch";
import type {
  ActiveSessionByProject,
  ProjectRailStatus,
  ProjectSession,
  ProjectSessionsByProject,
} from "./workspaceState";

type ProjectSessionNavigationState = {
  activeSessions: ActiveSessionByProject;
  browserUrl: string;
  browserUrlsByProject: Record<string, string>;
  currentRoot: string | null;
  sessions: ProjectSessionsByProject;
};

type ProjectSessionNavigationDependencies = {
  captureCurrentSession: () => void;
  defaultBrowserUrl: string;
  flushComposer: () => Promise<unknown>;
  getPreviousStatus: () => ProjectRailStatus;
  getState: () => ProjectSessionNavigationState;
  getTargetStatus: (projectPath: string, sessionId: string) => ProjectRailStatus;
  now: () => number;
  openProject: (projectPath: string, sameProject: boolean) => Promise<unknown>;
  persistBrowserUrl: (projectPath: string, sessionId: string, url: string) => Promise<unknown>;
  persistSessions: (
    sessions: ProjectSessionsByProject,
    activeSessions: ActiveSessionByProject,
  ) => Promise<unknown>;
  promptTitle: (title: string) => string | null;
  setFocusedMessage: (messageId: string | null) => void;
};

const switchSession = async (
  dependencies: ProjectSessionNavigationDependencies,
  projectPath: string,
  sessionId: string,
) => {
  dependencies.setFocusedMessage(null);
  const currentRoot = dependencies.getState().currentRoot;
  await dependencies.flushComposer();
  dependencies.captureCurrentSession();
  const state = dependencies.getState();
  const planned = planProjectSessionSwitch({
    activeSessions: state.activeSessions,
    currentRoot,
    now: dependencies.now(),
    previousStatus: dependencies.getPreviousStatus(),
    projectPath,
    sessionId,
    sessions: state.sessions,
    targetStatus: dependencies.getTargetStatus(projectPath, sessionId),
  });
  await dependencies.persistSessions(planned.sessions, planned.activeSessions);
  await dependencies.openProject(projectPath, planned.sameProject);
};

const createSession = async (
  dependencies: ProjectSessionNavigationDependencies,
  projectPath: string,
) => {
  const sameProject = dependencies.getState().currentRoot === projectPath;
  dependencies.captureCurrentSession();
  const state = dependencies.getState();
  const planned = planProjectSessionCreate({
    activeSessions: state.activeSessions,
    now: dependencies.now(),
    projectPath,
    sessions: state.sessions,
  });
  await dependencies.persistSessions(planned.sessions, planned.activeSessions);
  const browserUrl = sameProject
    ? state.browserUrl
    : state.browserUrlsByProject[projectPath] ?? dependencies.defaultBrowserUrl;
  await dependencies.persistBrowserUrl(projectPath, planned.session.id, browserUrl);
  await dependencies.openProject(projectPath, sameProject);
};

const renameSession = async (
  dependencies: ProjectSessionNavigationDependencies,
  projectPath: string,
  session: ProjectSession,
) => {
  const title = dependencies.promptTitle(session.title)?.trim();
  if (!title || title === session.title) return;
  const state = dependencies.getState();
  const sessions = {
    ...state.sessions,
    [projectPath]: (state.sessions[projectPath] ?? []).map((item) =>
      item.id === session.id ? { ...item, title, updatedAt: dependencies.now() } : item),
  };
  await dependencies.persistSessions(sessions, state.activeSessions);
};

export const createProjectSessionNavigationActions = (
  dependencies: ProjectSessionNavigationDependencies,
) => ({
  createSession: (projectPath: string) => createSession(dependencies, projectPath),
  renameSession: (projectPath: string, session: ProjectSession) =>
    renameSession(dependencies, projectPath, session),
  switchSession: (projectPath: string, sessionId: string) =>
    switchSession(dependencies, projectPath, sessionId),
});
