import { describe, expect, it, vi } from "vitest";

import type { FileTreeNode } from "./fileTreeTypes";
import { createWorkspaceFileActions, type WorkspaceFileActionServices } from "./workspaceFileActions";

const file: FileTreeNode = { id: "/workspace/src/App.tsx", kind: "file", name: "App.tsx", path: "/workspace/src/App.tsx" };
const directory: FileTreeNode = { id: "/workspace/src", kind: "directory", name: "src", path: "/workspace/src" };

const setup = (overrides: Partial<WorkspaceFileActionServices> = {}) => {
  const services: WorkspaceFileActionServices = {
    confirm: vi.fn().mockResolvedValue(true),
    createFile: vi.fn().mockResolvedValue({ path: "/workspace/src/new.ts" }),
    createFolder: vi.fn().mockResolvedValue({ path: "/workspace/src/new" }),
    deletePath: vi.fn().mockResolvedValue(undefined),
    duplicatePath: vi.fn().mockResolvedValue({ path: "/workspace/src/App copy.tsx" }),
    prompt: vi.fn().mockReturnValue("new.ts"),
    renamePath: vi.fn().mockResolvedValue({ path: "/workspace/src/Main.tsx" }),
    revealPath: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const onDelete = vi.fn().mockResolvedValue(undefined);
  const onOpenFile = vi.fn().mockResolvedValue(undefined);
  const onRename = vi.fn().mockResolvedValue(undefined);
  const refresh = vi.fn();
  const actions = createWorkspaceFileActions({
    editorDirty: false,
    getRoot: () => "/workspace",
    getSelectedFile: () => file,
    onDelete,
    onOpenFile,
    onRename,
    refresh,
    services,
    setError: vi.fn(),
  });
  return { actions, onDelete, onOpenFile, onRename, refresh, services };
};

describe("createWorkspaceFileActions", () => {
  it("creates and opens a file in the requested directory", async () => {
    const subject = setup();
    await subject.actions.createFile(directory);

    expect(subject.services.createFile).toHaveBeenCalledWith("/workspace", directory.path, "new.ts");
    expect(subject.refresh).toHaveBeenCalledOnce();
    expect(subject.onOpenFile).toHaveBeenCalledWith(expect.objectContaining({ kind: "file", path: "/workspace/src/new.ts" }));
  });

  it("does not rename a selected dirty file when discard is denied", async () => {
    const subject = setup({ confirm: vi.fn().mockResolvedValue(false) });
    const actions = createWorkspaceFileActions({
      editorDirty: true,
      getRoot: () => "/workspace",
      getSelectedFile: () => file,
      onDelete: subject.onDelete,
      onOpenFile: subject.onOpenFile,
      onRename: subject.onRename,
      refresh: subject.refresh,
      services: subject.services,
      setError: vi.fn(),
    });
    await actions.rename(file);

    expect(subject.services.renamePath).not.toHaveBeenCalled();
    expect(subject.onRename).not.toHaveBeenCalled();
  });

  it("deletes a confirmed node and reports the affected selected file", async () => {
    const subject = setup();
    await subject.actions.delete(directory);

    expect(subject.services.deletePath).toHaveBeenCalledWith("/workspace", directory.path);
    expect(subject.onDelete).toHaveBeenCalledWith(directory, file);
    expect(subject.refresh).toHaveBeenCalledOnce();
  });
});
