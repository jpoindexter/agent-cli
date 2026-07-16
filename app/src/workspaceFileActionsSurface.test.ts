import { describe, expect, it, vi } from "vitest";
import type { FileTreeNode } from "./fileTreeTypes";
import {
  workspaceFileDeleteHandler,
  workspaceFileRenameHandler,
} from "./workspaceFileActionsSurface";

const node = (path: string): FileTreeNode => ({
  id: path, kind: "file", name: path.split("/").pop() ?? path, path,
});

const createInput = () => ({
  deps: {
    clearPersistedActiveFile: vi.fn(),
    getPersistRoot: vi.fn(() => "/repo" as string | null),
    openFileDirect: vi.fn(async () => {}),
  },
  editor: {
    editorBuffersRef: { current: { "/repo/a.ts": {
      bytes: 1, error: null, modifiedMs: 1, recoveryError: null, savedText: "x", text: "x",
    } } },
    editorTabs: [node("/repo/a.ts"), node("/repo/b.ts")],
    editorViewStatesRef: { current: {} },
    resetEditor: vi.fn(),
    selectedFileRef: { current: node("/repo/a.ts") as FileTreeNode | null },
    setEditorBufferRevision: vi.fn(),
    setEditorTabs: vi.fn(),
    setSelectedFile: vi.fn(),
  },
});

describe("workspaceFileRenameHandler", () => {
  it("retargets tabs and reopens the moved selected file", async () => {
    const { deps, editor } = createInput();
    const handler = workspaceFileRenameHandler(editor, deps);

    await handler(node("/repo/a.ts"), "/repo/renamed.ts", node("/repo/a.ts"));

    expect(editor.setEditorTabs).toHaveBeenCalled();
    expect(editor.selectedFileRef.current).toBeNull();
    expect(editor.setSelectedFile).toHaveBeenCalledWith(null);
    expect(deps.openFileDirect).toHaveBeenCalledWith(
      expect.objectContaining({ name: "renamed.ts", path: "/repo/renamed.ts" }),
      { focusEditor: true },
    );
  });
});

describe("workspaceFileDeleteHandler", () => {
  it("opens the next tab after deleting the selected file", async () => {
    const { deps, editor } = createInput();
    const handler = workspaceFileDeleteHandler(editor, deps);

    await handler(node("/repo/a.ts"), node("/repo/a.ts"));

    expect(deps.openFileDirect).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/repo/b.ts" }), { focusEditor: true },
    );
    expect(editor.resetEditor).not.toHaveBeenCalled();
  });

  it("resets the editor and clears persistence when no tabs remain", async () => {
    const { deps, editor } = createInput();
    editor.editorTabs = [node("/repo/a.ts")];
    const handler = workspaceFileDeleteHandler(editor, deps);

    await handler(node("/repo/a.ts"), node("/repo/a.ts"));

    expect(deps.clearPersistedActiveFile).toHaveBeenCalledWith("/repo");
    expect(editor.resetEditor).toHaveBeenCalled();
  });
});
