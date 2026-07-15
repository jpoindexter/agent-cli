import { describe, expect, it, vi } from "vitest";

import { resolveAppAction } from "./appActions";
import type { FileTreeNode } from "./fileTreeTypes";
import { createSessionCheckpointActions, type SessionCheckpointServices } from "./sessionCheckpointActions";
import type { ProjectSession } from "./workspaceState";

const session: ProjectSession = { id: "chat-1", status: "exited", title: "Refactor", updatedAt: 1 };
const selectedFile: FileTreeNode = { id: "/workspace/src/App.tsx", kind: "file", name: "App.tsx", path: "/workspace/src/App.tsx" };
const preview = {
  checkpoint: { baseCommit: "abc", createdAt: 1, fileCount: 1, id: "cp-1", label: "Refactor" },
  files: [{ action: "write" as const, path: "src/App.tsx" }],
  previewToken: "token-1",
};

const setup = (dirtyPaths: string[] = []) => {
  const services: SessionCheckpointServices = {
    confirm: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue(preview.checkpoint),
    preview: vi.fn().mockResolvedValue(preview),
    restore: vi.fn().mockResolvedValue({ checkpointId: "cp-1", recoveryCheckpointId: "recovery-1", restoredFiles: 1 }),
  };
  const onClearBuffers = vi.fn();
  const onMetadata = vi.fn().mockResolvedValue(undefined);
  const onReconcile = vi.fn().mockResolvedValue(undefined);
  const refreshFiles = vi.fn();
  const refreshGit = vi.fn().mockResolvedValue(undefined);
  const setError = vi.fn();
  const setNotice = vi.fn();
  const actions = createSessionCheckpointActions({
    gateAction: (action) => resolveAppAction(action, "fullAccess"),
    getDirtyTabPaths: () => dirtyPaths,
    getSelectedFile: () => selectedFile,
    getWorkspacePath: () => "/workspace",
    onClearBuffers,
    onMetadata,
    onReconcile,
    refreshFiles,
    refreshGit,
    services,
    setError,
    setNotice,
  });
  return { actions, onClearBuffers, onMetadata, onReconcile, refreshFiles, refreshGit, services, setError, setNotice };
};

describe("createSessionCheckpointActions", () => {
  it("blocks restore when an affected editor buffer is dirty", async () => {
    const subject = setup([selectedFile.path]);
    await subject.actions.restore("/workspace", session, "cp-1");

    expect(subject.setError).toHaveBeenCalledWith(expect.stringContaining(selectedFile.path));
    expect(subject.services.confirm).not.toHaveBeenCalled();
    expect(subject.services.restore).not.toHaveBeenCalled();
  });

  it("restores an approved checkpoint and records its recovery checkpoint", async () => {
    const subject = setup();
    await subject.actions.restore("/workspace", session, "cp-1");

    expect(subject.services.restore).toHaveBeenCalledWith("/workspace", "cp-1", "token-1", []);
    expect(subject.onClearBuffers).toHaveBeenCalledWith(new Set([selectedFile.path]));
    expect(subject.onReconcile).toHaveBeenCalledWith(selectedFile, "write");
    expect(subject.onMetadata).toHaveBeenCalledWith("/workspace", session.id, { recoveryCheckpointId: "recovery-1" });
    expect(subject.refreshFiles).toHaveBeenCalledOnce();
    expect(subject.refreshGit).toHaveBeenCalledOnce();
  });
});
