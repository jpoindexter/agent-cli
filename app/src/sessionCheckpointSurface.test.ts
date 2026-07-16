import { describe, expect, it, vi } from "vitest";
import type { FileTreeNode } from "./fileTreeTypes";
import {
  checkpointClearBuffersHandler,
  checkpointReconcileHandler,
} from "./sessionCheckpointSurface";

const file: FileTreeNode = { id: "1", kind: "file", name: "a.ts", path: "/repo/a.ts" };

const createEditor = () => ({
  editorBuffersRef: { current: { "/repo/a.ts": { text: "x" }, "/repo/b.ts": { text: "y" } } as Record<string, unknown> },
  selectedFileRef: { current: file as FileTreeNode | null },
  setEditorBufferRevision: vi.fn(),
  setEditorText: vi.fn(),
  setSavedEditorText: vi.fn(),
  setSelectedFile: vi.fn(),
});

describe("checkpointClearBuffersHandler", () => {
  it("drops only the requested buffers and bumps the revision", () => {
    const editor = createEditor();

    checkpointClearBuffersHandler(editor)(new Set(["/repo/a.ts"]));

    expect(editor.editorBuffersRef.current).toEqual({ "/repo/b.ts": { text: "y" } });
    expect(editor.setEditorBufferRevision).toHaveBeenCalled();
  });
});

describe("checkpointReconcileHandler", () => {
  it("clears the editor when the restored checkpoint deleted the active file", async () => {
    const editor = createEditor();
    const openFileDirect = vi.fn(async () => {});

    await checkpointReconcileHandler(editor, { openFileDirect })(file, "delete");

    expect(editor.setSelectedFile).toHaveBeenCalledWith(null);
    expect(editor.setEditorText).toHaveBeenCalledWith("");
    expect(openFileDirect).not.toHaveBeenCalled();
  });

  it("reloads the active file for non-delete reconciliation", async () => {
    const editor = createEditor();
    const openFileDirect = vi.fn(async () => {});

    await checkpointReconcileHandler(editor, { openFileDirect })(file, "write");

    expect(openFileDirect).toHaveBeenCalledWith(file);
  });

  it("ignores reconciliation without a file or action", async () => {
    const editor = createEditor();
    const openFileDirect = vi.fn(async () => {});

    await checkpointReconcileHandler(editor, { openFileDirect })(null, "delete");

    expect(editor.setSelectedFile).not.toHaveBeenCalled();
  });
});
