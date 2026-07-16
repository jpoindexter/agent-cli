import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async () => ({ content: "hello", bytes: 5, modifiedMs: 10, path: "/repo/src/a.ts" })),
}));

import { invoke } from "@tauri-apps/api/core";
import { wireEditorFileWorkflow } from "./editorFileWorkflowSurface";
import type { FileTreeNode } from "./fileTreeTypes";

const file: FileTreeNode = { id: "1", kind: "file", name: "a.ts", path: "/repo/src/a.ts" };

const createEditor = () => ({
  captureCurrentEditorBuffer: vi.fn(),
  captureCurrentEditorViewState: vi.fn(),
  editorBuffersRef: { current: {} },
  editorBytes: null as number | null,
  editorLoadSeq: { current: 0 },
  editorModifiedMs: null as number | null,
  editorRecoveryError: null as string | null,
  editorSaving: false,
  editorText: "",
  editorViewRef: { current: null },
  editorViewStatesRef: { current: {} },
  pendingEditorFocusRef: { current: false },
  savedEditorText: "",
  selectedFile: null as FileTreeNode | null,
  selectedFileRef: { current: null as FileTreeNode | null },
  setEditorBufferRevision: vi.fn(),
  setEditorBytes: vi.fn(),
  setEditorCursor: vi.fn(),
  setEditorError: vi.fn(),
  setEditorLoading: vi.fn(),
  setEditorModifiedMs: vi.fn(),
  setEditorRecoveryError: vi.fn(),
  setEditorSaving: vi.fn(),
  setEditorTabs: vi.fn(),
  setEditorText: vi.fn(),
  setSavedEditorText: vi.fn(),
  setSelectedFile: vi.fn(),
});

const createDeps = () => ({
  closeDiffReview: vi.fn(),
  gateAction: vi.fn(async () => ({
    actionId: "a1", approvalMode: "ask" as const, decision: "approved" as const,
    kind: "open-file" as never, label: "Open file", prompted: false,
    reason: "auto", requestedBy: "user" as const, risk: "low" as never, timestamp: 1,
  })),
  getDirty: () => false,
  getRoot: () => "/repo" as string | null,
  persistActiveFile: vi.fn(async () => {}),
  recordEdit: vi.fn(),
});

describe("wireEditorFileWorkflow", () => {
  beforeEach(() => { vi.mocked(invoke).mockClear(); });

  it("opens a file through the editor session state", async () => {
    const editor = createEditor();
    const deps = createDeps();
    const workflow = wireEditorFileWorkflow(editor, deps);

    await workflow.openDirect(file, { focusEditor: true });

    expect(deps.closeDiffReview).toHaveBeenCalled();
    expect(editor.setSelectedFile).toHaveBeenCalledWith(file);
    expect(editor.pendingEditorFocusRef.current).toBe(true);
    expect(invoke).toHaveBeenCalledWith("read_text_file", { root: "/repo", path: "/repo/src/a.ts" });
    expect(editor.setEditorText).toHaveBeenCalledWith("hello");
  });
});
