import type { ContextMenuItem } from "./ContextMenu";

type SessionMenuOrchestration = {
  returnedAt?: string | number | null;
  worktreePath?: string | null;
};

type SessionMenuSession = {
  archived?: boolean;
  checkpointId?: string | null;
  id: string;
  orchestration?: SessionMenuOrchestration | null;
  pinnedAt?: string | number | null;
  recoveryCheckpointId?: string | null;
  title: string;
};

type ProjectSessionMenuActions = {
  archive: () => unknown;
  captureCheckpoint: () => unknown;
  copyName: () => unknown;
  delete: () => unknown;
  pin: () => unknown;
  removeChildWorktree: () => unknown;
  rename: () => unknown;
  restoreCheckpoint: () => unknown;
  restoreRecoveryCheckpoint: () => unknown;
  returnChildResult: () => unknown;
  stopChildRun: () => unknown;
  switchChat: () => unknown;
};

export type ProjectSessionContextMenuInput = {
  actions: ProjectSessionMenuActions;
  activeProjectSessionCount: number;
  hasAssistantMessage: boolean;
  hasRunningChildRun: boolean;
  isActiveSession: boolean;
  isWorkspaceProject: boolean;
  projectSessionCount: number;
  session: SessionMenuSession;
};

const sessionItem = (
  id: string,
  label: string,
  onSelect: () => unknown,
  options: Pick<ContextMenuItem, "shortcut" | "icon" | "disabled" | "danger"> = {},
): ContextMenuItem => ({ id, label, onSelect, ...options });

const orchestrationItems = (input: ProjectSessionContextMenuInput): ContextMenuItem[] => {
  const { actions, hasAssistantMessage, hasRunningChildRun, session } = input;
  if (!session.orchestration) return [];
  const items = [
    sessionItem("session.stop-child", "Stop Child Run", actions.stopChildRun, {
      icon: "stop",
      danger: true,
      disabled: !hasRunningChildRun,
    }),
    sessionItem("session.return-child", session.orchestration.returnedAt ? "Result Returned" : "Return Result to Parent", actions.returnChildResult, {
      icon: "send",
      disabled: Boolean(session.orchestration.returnedAt) || hasRunningChildRun || !hasAssistantMessage,
    }),
  ];
  if (session.orchestration.worktreePath) {
    items.push(sessionItem("session.remove-child-worktree", "Remove Child Worktree", actions.removeChildWorktree, {
      icon: "close",
      danger: true,
      disabled: hasRunningChildRun,
    }));
  }
  return items;
};

const checkpointItems = ({ actions, isWorkspaceProject, session }: ProjectSessionContextMenuInput): ContextMenuItem[] => [
  sessionItem("session.capture-checkpoint", session.checkpointId ? "Replace Workspace Checkpoint" : "Capture Workspace Checkpoint", actions.captureCheckpoint, {
    icon: "save",
    disabled: !isWorkspaceProject,
  }),
  ...(session.checkpointId ? [sessionItem("session.restore-checkpoint", "Restore Workspace Checkpoint", actions.restoreCheckpoint, {
    icon: "reload",
    disabled: !isWorkspaceProject,
  })] : []),
  ...(session.recoveryCheckpointId ? [sessionItem("session.restore-recovery", "Restore Recovery Checkpoint", actions.restoreRecoveryCheckpoint, {
    icon: "reload",
    disabled: !isWorkspaceProject,
  })] : []),
];

export const buildProjectSessionContextMenuItems = (input: ProjectSessionContextMenuInput): ContextMenuItem[] => {
  const { actions, activeProjectSessionCount, isActiveSession, projectSessionCount, session } = input;
  return [
    sessionItem("session.switch", "Switch to Chat", actions.switchChat, { icon: "file", disabled: isActiveSession }),
    sessionItem("session.rename", "Rename Chat", actions.rename, { icon: "file" }),
    sessionItem("session.copy-name", "Copy Chat Name", actions.copyName, { icon: "file" }),
    ...orchestrationItems(input),
    ...checkpointItems(input),
    sessionItem("session.pin", session.pinnedAt ? "Unpin Chat" : "Pin Chat", actions.pin, { icon: "pin" }),
    sessionItem("session.archive", session.archived ? "Unarchive Chat" : "Archive Chat", actions.archive, {
      icon: "close",
      disabled: !session.archived && activeProjectSessionCount <= 1,
    }),
    sessionItem("session.delete", "Delete Chat", actions.delete, {
      icon: "error",
      danger: true,
      disabled: projectSessionCount <= 1,
    }),
  ];
};
