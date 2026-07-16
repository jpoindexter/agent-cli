import { describe, expect, it, vi } from "vitest";
import { createEditorSurfaceActions } from "./editorSurfaceActions";
import type { EditorViewState } from "./editorState";

const file = { id: "1", kind: "file" as const, name: "main.ts", path: "/repo/src/main.ts" };

const view = () => ({
  dispatch: vi.fn(),
  focus: vi.fn(),
  hasFocus: false,
  scrollDOM: { scrollTop: 7 },
  state: { doc: { length: 100, line: (n: number) => ({ from: n * 10 }), lines: 5 } },
});

const createInput = () => ({
  deps: {
    copyText: vi.fn(async () => {}),
    getDiffReviewPath: vi.fn(() => null as string | null),
    getGitFiles: vi.fn(() => [] as { path: string }[]),
    getRoot: vi.fn(() => "/repo" as string | null),
    makeFileNode: vi.fn((path: string) => ({ ...file, id: path, path })),
    notify: vi.fn(),
    openExternal: vi.fn(async () => {}),
    openFileDirect: vi.fn(async () => {}),
    openGitDiff: vi.fn(async () => true),
    openSearchPanel: vi.fn(),
    requestOpenFile: vi.fn(async () => true),
    revealEditorTools: vi.fn(),
    revealInDir: vi.fn(async () => {}),
    saveFile: vi.fn(async () => true),
    schedule: (callback: () => void) => callback(),
    scheduleFrame: (callback: () => void) => callback(),
    scrollEffect: vi.fn((position: number) => ({ position })),
    setCursor: vi.fn(),
  },
  editor: {
    editorBuffersRef: { current: {} as Record<string, { savedText: string; text: string }> },
    editorText: "same",
    editorViewRef: { current: null as ReturnType<typeof view> | null },
    editorViewStatesRef: { current: {} as Record<string, EditorViewState> },
    pendingEditorFocusRef: { current: false },
    savedEditorText: "same",
    selectedFileRef: { current: file as typeof file | null },
    setEditorCursor: vi.fn(),
    setEditorRecoveryError: vi.fn(),
  },
});

describe("createEditorSurfaceActions", () => {
  it("records view state for the selected file through the shared refs", () => {
    const { deps, editor } = createInput();
    const surface = createEditorSurfaceActions(editor, deps);
    const sourceView = view();

    surface.handleEditorUpdate({
      state: {
        doc: { lineAt: (pos: number) => ({ from: pos, number: 2 }) },
        selection: { main: { anchor: 1, head: 20 } },
      },
      view: sourceView,
    });

    expect(editor.editorViewStatesRef.current["/repo/src/main.ts"]).toEqual({
      anchor: 1, focused: false, head: 20, scrollTop: 7,
    });
    expect(editor.setEditorCursor).toHaveBeenCalledWith({ column: 1, line: 2 });
  });

  it("stores the created view on the shared editor view ref", () => {
    const { deps, editor } = createInput();
    const surface = createEditorSurfaceActions(editor, deps);
    const created = view();

    surface.restoreEditorView(created);

    expect(editor.editorViewRef.current).toBe(created);
  });

  it("routes review files through git diff and reveals the editor tools", async () => {
    const { deps, editor } = createInput();
    deps.getGitFiles.mockReturnValue([{ path: "src/changed.ts" }]);
    const surface = createEditorSurfaceActions(editor, deps);

    await surface.reviewRunCardFile("src/changed.ts");

    expect(deps.openGitDiff).toHaveBeenCalledWith({ path: "src/changed.ts" });
    expect(deps.revealEditorTools).toHaveBeenCalled();
  });

  it("copies paths with a basename notice", async () => {
    const { deps, editor } = createInput();
    const surface = createEditorSurfaceActions(editor, deps);

    await surface.copyPath("/repo/src/main.ts");

    expect(deps.copyText).toHaveBeenCalledWith("/repo/src/main.ts");
    expect(deps.notify).toHaveBeenCalledWith("Copied main.ts path");
  });
});
