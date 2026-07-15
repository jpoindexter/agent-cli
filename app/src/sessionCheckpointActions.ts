import { confirm as confirmDialog } from "@tauri-apps/plugin-dialog";

import { createAppAction, type AppActionAuditEvent, type AppActionDescriptor } from "./appActions";
import { planCheckpointRestore } from "./checkpointRestorePlan";
import type { FileTreeNode } from "./fileTreeTypes";
import type { ProjectSession } from "./workspaceState";
import {
  checkpointPreviewMessage,
  createWorkspaceCheckpoint,
  previewWorkspaceCheckpoint,
  restoreWorkspaceCheckpoint,
  type WorkspaceCheckpointPreview,
  type WorkspaceCheckpointRestoreResult,
  type WorkspaceCheckpointSummary,
} from "./workspaceCheckpoints";

type StateSetter = (value: string | null) => void;

export type SessionCheckpointServices = {
  confirm: (message: string) => Promise<boolean>;
  create: (root: string, label: string) => Promise<WorkspaceCheckpointSummary>;
  preview: (root: string, checkpointId: string) => Promise<WorkspaceCheckpointPreview>;
  restore: (root: string, checkpointId: string, previewToken: string, dirtyPaths: string[]) => Promise<WorkspaceCheckpointRestoreResult>;
};

type SessionCheckpointOptions = {
  gateAction: (action: AppActionDescriptor) => Promise<AppActionAuditEvent>;
  getDirtyTabPaths: () => string[];
  getSelectedFile: () => FileTreeNode | null;
  getWorkspacePath: () => string | null;
  onClearBuffers: (paths: Set<string>) => void;
  onMetadata: (projectPath: string, sessionId: string, metadata: Partial<ProjectSession>) => Promise<void>;
  onReconcile: (file: FileTreeNode | null, action: "write" | "delete" | null) => Promise<void>;
  refreshFiles: () => void;
  refreshGit: () => Promise<unknown>;
  services?: SessionCheckpointServices;
  setError: StateSetter;
  setNotice: StateSetter;
};

type CheckpointContext = SessionCheckpointOptions & { services: SessionCheckpointServices };

const nativeServices: SessionCheckpointServices = {
  confirm: (message) => confirmDialog(message),
  create: createWorkspaceCheckpoint,
  preview: previewWorkspaceCheckpoint,
  restore: restoreWorkspaceCheckpoint,
};

const requireActiveProject = (context: CheckpointContext, projectPath: string, action: string) => {
  if (projectPath === context.getWorkspacePath()) return true;
  context.setError(`Switch to this project before ${action} its workspace checkpoint.`);
  return false;
};

const capture = async (context: CheckpointContext, projectPath: string, session: ProjectSession) => {
  if (!requireActiveProject(context, projectPath, "capturing")) return;
  try {
    const checkpoint = await context.services.create(projectPath, `Chat checkpoint: ${session.title}`);
    await context.onMetadata(projectPath, session.id, {
      checkpointId: checkpoint.id,
      checkpointCreatedAt: checkpoint.createdAt,
    });
    context.setNotice(`Captured ${checkpoint.fileCount} changed file${checkpoint.fileCount === 1 ? "" : "s"}`);
  } catch (error) {
    context.setError(`Could not capture workspace checkpoint: ${String(error)}`);
  }
};

const approveRestore = (context: CheckpointContext, projectPath: string, fileCount: number) =>
  context.gateAction(createAppAction({
    kind: "restore-checkpoint",
    label: "Restore workspace checkpoint",
    target: `${fileCount} files in ${projectPath}`,
    risk: "high",
    requestedBy: "user",
    undoHint: "Restore the recovery checkpoint created before this operation.",
  }));

const restore = async (
  context: CheckpointContext,
  projectPath: string,
  session: ProjectSession,
  checkpointId: string,
) => {
  if (!requireActiveProject(context, projectPath, "restoring")) return;
  try {
    const preview = await context.services.preview(projectPath, checkpointId);
    if (preview.files.length === 0) {
      context.setNotice("Workspace already matches this checkpoint");
      return;
    }
    const selectedFile = context.getSelectedFile();
    const plan = planCheckpointRestore({
      dirtyTabPaths: context.getDirtyTabPaths(), preview, projectPath,
      selectedFilePath: selectedFile?.path ?? null,
    });
    if (plan.protectedDirtyPath) {
      context.setError(`Save or discard the dirty editor buffer before restore: ${plan.protectedDirtyPath}`);
      return;
    }
    if (!await context.services.confirm(checkpointPreviewMessage(preview))) return;
    const audit = await approveRestore(context, projectPath, preview.files.length);
    if (audit.decision !== "approved") return;
    const result = await context.services.restore(projectPath, checkpointId, preview.previewToken, plan.relativeDirtyPaths);
    context.onClearBuffers(plan.affectedAbsolutePaths);
    await context.onReconcile(selectedFile, plan.activeFileAction);
    await context.onMetadata(projectPath, session.id, { recoveryCheckpointId: result.recoveryCheckpointId });
    context.refreshFiles();
    await context.refreshGit();
    context.setNotice(`Restored ${result.restoredFiles} files; recovery checkpoint is ready`);
  } catch (error) {
    context.setError(`Could not restore workspace checkpoint: ${String(error)}`);
  }
};

export const createSessionCheckpointActions = (options: SessionCheckpointOptions) => {
  const context = { ...options, services: options.services ?? nativeServices };
  return {
    capture: (projectPath: string, session: ProjectSession) => capture(context, projectPath, session),
    restore: (projectPath: string, session: ProjectSession, checkpointId: string) =>
      restore(context, projectPath, session, checkpointId),
  };
};
