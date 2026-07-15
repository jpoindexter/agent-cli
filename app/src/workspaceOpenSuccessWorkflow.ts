import { planWorkspaceOpenSuccess } from "./workspaceOpenSuccess";
import type { ActiveSessionByProject, OpenProject, ProjectRailStatus, ProjectSessionsByProject } from "./workspaceState";

type WorkspaceOpenSuccessState = {
  activeSessions: ActiveSessionByProject;
  openProjects: OpenProject[];
  recentProjects: string[];
  sessions: ProjectSessionsByProject;
};

type WorkspaceOpenSuccessPlan = ReturnType<typeof planWorkspaceOpenSuccess>;

type WorkspaceOpenSuccessInput<TPane> = {
  applyPlan: (plan: WorkspaceOpenSuccessPlan) => void;
  now: number;
  panes: TPane[];
  persistPaneLayout: (root: string, sessionId: string | null, panes: TPane[]) => void;
  persistPlan: (plan: WorkspaceOpenSuccessPlan) => Promise<unknown>;
  previousRoot: string | null;
  previousStatus: ProjectRailStatus;
  projectStatus: ProjectRailStatus;
  restoreBrowser: (root: string, sessionId: string | null) => void;
  restoreEditor: (root: string, sessionId: string | null) => void;
  root: string;
  sessionStatus: ProjectRailStatus;
  state: WorkspaceOpenSuccessState;
};

export const executeWorkspaceOpenSuccess = async <TPane>(input: WorkspaceOpenSuccessInput<TPane>) => {
  const plan = planWorkspaceOpenSuccess({
    ...input.state,
    now: input.now,
    previousRoot: input.previousRoot,
    previousStatus: input.previousStatus,
    projectStatus: input.projectStatus,
    root: input.root,
    sessionStatus: input.sessionStatus,
  });
  input.applyPlan(plan);
  input.persistPaneLayout(input.root, plan.sessionId, input.panes);
  await input.persistPlan(plan);
  input.restoreEditor(input.root, plan.sessionId);
  input.restoreBrowser(input.root, plan.sessionId);
  return plan;
};
