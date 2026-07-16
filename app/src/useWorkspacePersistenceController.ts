import { useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import type { PaneLayoutsBySession } from "./sessionRestore";
import { createWorkspacePersistence } from "./workspacePersistence";
import type { PaneLabelsBySession } from "./workspaceBootstrap";
import {
  activeProjectSessionId,
  setOpenProjectStatus,
  setProjectSessionStatus,
  type ActiveFileByWorkspace,
  type ActiveSessionByProject,
  type OpenProject,
  type ProjectRailStatus,
  type ProjectSessionsByProject,
} from "./workspaceState";

type PersistenceStore = {
  save: () => Promise<void>;
  set: (key: string, value: unknown) => Promise<void>;
};

type WorkspacePersistenceControllerOptions<TSnapshot> = {
  activeFiles: RefObject<ActiveFileByWorkspace>;
  getPanes: (root: string | null, sessionId: string | null) => ManagedTerminalPane[];
  paneLabels: RefObject<PaneLabelsBySession>;
  paneLayouts: RefObject<PaneLayoutsBySession>;
  sessionSnapshots: RefObject<Record<string, TSnapshot>>;
  setPaneLabels: (value: PaneLabelsBySession) => void;
  store: RefObject<PersistenceStore | null>;
};

const syncState = <T,>(ref: RefObject<T>, setState: Dispatch<SetStateAction<T>>, value: T) => {
  ref.current = value;
  setState(value);
};

const useProjectWorkspaceState = () => {
  const recentProjectsRef = useRef<string[]>([]);
  const openProjectsRef = useRef<OpenProject[]>([]);
  const projectSessionsRef = useRef<ProjectSessionsByProject>({});
  const activeSessionByProjectRef = useRef<ActiveSessionByProject>({});
  const [recentProjects, setRecentState] = useState<string[]>([]);
  const [openProjects, setOpenState] = useState<OpenProject[]>([]);
  const [projectSessions, setSessionsState] = useState<ProjectSessionsByProject>({});
  const [activeSessionByProject, setActiveState] = useState<ActiveSessionByProject>({});
  const [expandedSessionProjects, setExpandedSessionProjects] = useState<Record<string, boolean>>({});
  const [showArchivedSessions, setShowArchivedSessions] = useState(false);
  const setRecentProjects = (value: string[]) => syncState(recentProjectsRef, setRecentState, value);
  const setOpenProjects = (value: OpenProject[]) => syncState(openProjectsRef, setOpenState, value);
  const setProjectSessions = (value: ProjectSessionsByProject) =>
    syncState(projectSessionsRef, setSessionsState, value);
  const setActiveSessionByProjectState = (value: ActiveSessionByProject) =>
    syncState(activeSessionByProjectRef, setActiveState, value);
  return {
    activeSessionByProject, activeSessionByProjectRef, expandedSessionProjects,
    openProjects, openProjectsRef, projectSessions, projectSessionsRef, recentProjects,
    recentProjectsRef, setActiveSessionByProjectState, setExpandedSessionProjects,
    setOpenProjects, setProjectSessions, setRecentProjects, setShowArchivedSessions,
    showArchivedSessions,
  };
};

export function useWorkspacePersistenceController<TSnapshot>(
  options: WorkspacePersistenceControllerOptions<TSnapshot>,
) {
  const state = useProjectWorkspaceState();
  const activeSessionForProject = (root: string | null) => activeProjectSessionId(
    state.activeSessionByProjectRef.current, state.projectSessionsRef.current, root,
  );
  const persistence = createWorkspacePersistence({
    activeFiles: options.activeFiles, activeSessions: state.activeSessionByProjectRef,
    getActiveSession: activeSessionForProject, getPanes: options.getPanes,
    openProjects: state.openProjectsRef, paneLabels: options.paneLabels,
    paneLayouts: options.paneLayouts, projectSessions: state.projectSessionsRef,
    sessionSnapshots: options.sessionSnapshots,
    setActiveSessions: state.setActiveSessionByProjectState,
    setOpenProjects: state.setOpenProjects, setPaneLabels: options.setPaneLabels,
    setProjectSessions: state.setProjectSessions, store: options.store,
  });
  const updateOpenProjectStatus = async (path: string | null, status: ProjectRailStatus) => {
    if (!path) return;
    await persistence.persistOpenProjects(setOpenProjectStatus(state.openProjectsRef.current, path, status));
  };
  const updateSessionStatus = async (
    path: string | null, sessionId: string | null, status: ProjectRailStatus,
  ) => {
    if (!path || !sessionId) return;
    const next = setProjectSessionStatus(state.projectSessionsRef.current, path, sessionId, status);
    await persistence.persistProjectSessions(next, state.activeSessionByProjectRef.current);
  };
  return {
    ...state, ...persistence, activeSessionForProject, updateOpenProjectStatus,
    updateSessionStatus,
    updateActiveSessionStatus: (path: string | null, status: ProjectRailStatus) =>
      updateSessionStatus(path, activeSessionForProject(path), status),
  };
}
