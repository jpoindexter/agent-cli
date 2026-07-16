import { describe, expect, it, vi } from "vitest";
import {
  createEditorContextMenuAssembly,
  createProjectSessionContextMenuAssembly,
  createWorkspaceContextMenuAssembly,
} from "./appContextMenuAssembly";
import type { FileTreeNode } from "./fileTreeTypes";

const file: FileTreeNode = {
  id: "/workspace/readme.md",
  kind: "file",
  name: "readme.md",
  path: "/workspace/readme.md",
};

describe("createWorkspaceContextMenuAssembly", () => {
  it("keeps file-menu actions bound to their owner callbacks", () => {
    const copyPath = vi.fn();
    const actions = {
      closeProject: vi.fn(), copyPath, deleteNode: vi.fn(), duplicateNode: vi.fn(),
      newFile: vi.fn(), newFolder: vi.fn(), openDiff: vi.fn(), openWorkspace: vi.fn(),
      renameNode: vi.fn(), revealNode: vi.fn(), revealPath: vi.fn(), runGitAction: vi.fn(),
      shortcut: vi.fn(() => ""), switchProject: vi.fn(),
    };
    const menu = createWorkspaceContextMenuAssembly(actions).fileNodeItems(file);

    menu.find((item) => item.id === "file.copy-path")?.onSelect();

    expect(copyPath).toHaveBeenCalledWith(file.path);
  });
});

describe("createEditorContextMenuAssembly", () => {
  it("uses the supplied editor state when building the save action", () => {
    const save = vi.fn();
    const assembly = createEditorContextMenuAssembly({
      closeDiff: vi.fn(), closeTab: vi.fn(), copyDiff: vi.fn(), copyPath: vi.fn(),
      find: vi.fn(), openDiffFile: vi.fn(), openExternal: vi.fn(), openTab: vi.fn(),
      revealNode: vi.fn(), revealSelected: vi.fn(), runGitAction: vi.fn(), save,
      shortcut: vi.fn(() => ""),
    });
    const menu = assembly.editorItems({
      editorDirty: true, editorLoading: false, editorSaving: false, selectedFile: file,
    });

    menu.find((item) => item.id === "editor.save")?.onSelect();

    expect(save).toHaveBeenCalledOnce();
  });
});

describe("createProjectSessionContextMenuAssembly", () => {
  it("copies the selected session title and keeps the success notice", async () => {
    const copyText = vi.fn(async () => {});
    const notify = vi.fn();
    const assembly = createProjectSessionContextMenuAssembly({
      activeSessionId: "session-1",
      archiveSession: vi.fn(),
      captureCheckpoint: vi.fn(),
      chatIdForSession: (root, sessionId) => `${root}\n${sessionId}`,
      conversations: () => ({}),
      copyText,
      deleteSession: vi.fn(),
      notify,
      pinSession: vi.fn(),
      projectSessionsFor: () => [{ id: "session-1", status: "exited", title: "Plan", updatedAt: 0 }],
      removeChildWorktree: vi.fn(),
      renameSession: vi.fn(),
      restoreCheckpoint: vi.fn(),
      returnChildResult: vi.fn(),
      stopChildRun: vi.fn(),
      switchSession: vi.fn(),
      workspacePath: "/workspace",
    });
    const items = assembly.items("/workspace", {
      id: "session-1", status: "exited", title: "Plan", updatedAt: 0,
    });

    await items.find((item) => item.id === "session.copy-name")?.onSelect();

    expect(copyText).toHaveBeenCalledWith("Plan");
    expect(notify).toHaveBeenCalledWith("Copied chat name");
  });
});
