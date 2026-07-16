import { describe, expect, it, vi } from "vitest";
import { createEditorReviewNavigation } from "./editorReviewNavigation";

const node = (path: string) => ({ id: path, kind: "file" as const, name: path, path });

const view = () => ({
  dispatch: vi.fn(),
  focus: vi.fn(),
  state: { doc: { line: (n: number) => ({ from: n * 10 }), lines: 5 } },
});

const createOptions = () => ({
  buffers: { current: {} as Record<string, { savedText: string; text: string }> },
  getDiffReviewPath: vi.fn(() => "/repo/src/main.ts" as string | null),
  getEditorText: vi.fn(() => "same"),
  getGitFiles: vi.fn(() => [{ path: "src/changed.ts" }]),
  getRoot: vi.fn(() => "/repo" as string | null),
  getSavedText: vi.fn(() => "same"),
  getSelectedPath: vi.fn(() => "/repo/src/open.ts" as string | null),
  getView: vi.fn(() => null as ReturnType<typeof view> | null),
  makeFileNode: vi.fn(node),
  openGitDiff: vi.fn(async () => true),
  requestOpenFile: vi.fn(async () => true),
  revealEditorTools: vi.fn(),
  schedule: (callback: () => void) => callback(),
  scrollEffect: vi.fn((position: number) => ({ position })),
});

describe("createEditorReviewNavigation", () => {
  it("opens a changed file as a git diff and reveals the editor tools", async () => {
    const options = createOptions();
    const navigation = createEditorReviewNavigation(options);

    await navigation.reviewRunCardFile("./src/changed.ts");

    expect(options.openGitDiff).toHaveBeenCalledWith({ path: "src/changed.ts" });
    expect(options.revealEditorTools).toHaveBeenCalled();
    expect(options.requestOpenFile).not.toHaveBeenCalled();
  });

  it("falls back to opening the workspace file when it has no git changes", async () => {
    const options = createOptions();
    const navigation = createEditorReviewNavigation(options);

    await navigation.reviewRunCardFile("docs/notes.md");

    expect(options.requestOpenFile).toHaveBeenCalledWith(
      node("/repo/docs/notes.md"), { focusEditor: true },
    );
    expect(options.revealEditorTools).toHaveBeenCalled();
  });

  it("keeps the tools hidden when the diff never opens", async () => {
    const options = createOptions();
    options.openGitDiff.mockResolvedValue(false);
    const navigation = createEditorReviewNavigation(options);

    await navigation.reviewRunCardFile("src/changed.ts");

    expect(options.revealEditorTools).not.toHaveBeenCalled();
  });

  it("opens the reviewed diff file and focuses the requested line", async () => {
    const options = createOptions();
    const activeView = view();
    options.getView.mockReturnValue(activeView);
    const navigation = createEditorReviewNavigation(options);

    await navigation.openDiffFile(3);

    expect(options.requestOpenFile).toHaveBeenCalledWith(
      node("/repo/src/main.ts"), { focusEditor: true },
    );
    expect(activeView.dispatch).toHaveBeenCalledWith({
      effects: { position: 30 }, selection: { anchor: 30 },
    });
    expect(activeView.focus).toHaveBeenCalled();
  });

  it("does nothing without an active diff review", async () => {
    const options = createOptions();
    options.getDiffReviewPath.mockReturnValue(null);
    const navigation = createEditorReviewNavigation(options);

    await navigation.openDiffFile(3);

    expect(options.requestOpenFile).not.toHaveBeenCalled();
  });

  it("reports unsaved buffers for the selected file and background buffers", () => {
    const options = createOptions();
    options.getEditorText.mockReturnValue("dirty");
    const navigation = createEditorReviewNavigation(options);

    expect(navigation.hasUnsavedBufferForPath("/repo/src/open.ts")).toBe(true);

    options.getEditorText.mockReturnValue("same");
    options.buffers.current["/repo/src/other.ts"] = { savedText: "a", text: "b" };
    expect(navigation.hasUnsavedBufferForPath("/repo/src/other.ts")).toBe(true);
    expect(navigation.hasUnsavedBufferForPath("/repo/src/clean.ts")).toBe(false);
  });
});
