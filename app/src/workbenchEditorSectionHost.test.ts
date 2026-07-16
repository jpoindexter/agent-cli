import { describe, expect, it, vi } from "vitest";
import { workbenchEditorSectionPropsFrom } from "./workbenchEditorSectionHost";

const createOptions = () =>
  ({
    contextMenuHost: { openContextMenu: vi.fn() },
    diffContextMenuItems: () => [],
    diffReviewHook: {
      close: vi.fn(), copy: vi.fn(), error: null, loading: false, review: null, runFileAction: vi.fn(),
    },
    editorContextMenuItems: () => [],
    editorFileWorkflow: { requestOpen: vi.fn() },
    editorNavigation: { closeActiveTab: vi.fn(), closeTab: vi.fn() },
    editorSession: {
      editorBytes: 1024, editorCursor: { column: 1, line: 1 }, editorError: null, editorLoading: false,
      editorRecoveryError: null, editorSaving: false, editorTabs: [], editorText: "code",
      selectedFile: null, setEditorText: vi.fn(),
    },
    editorSurface: {
      openDiffFile: vi.fn(), openEditorSearch: vi.fn(), openExternally: vi.fn(),
      overwrite: vi.fn(), reloadFromDisk: vi.fn(), restoreEditorView: vi.fn(),
    },
    editorTabContextMenuItems: () => [],
    editorWorkspace: {
      activeFileMissing: false, diffBreadcrumbs: [], diffReviewCanDiscard: false, diffReviewCanOpenFile: false,
      diffReviewCanStage: false, diffReviewCanUnstage: false, editorBreadcrumbs: [], editorDirty: false,
      editorLanguage: "typescript", editorSaveConflict: null,
    },
    handleEditorUpdate: vi.fn(),
    saveEditorFile: vi.fn(),
    tabIsDirty: () => false,
  }) as unknown as Parameters<typeof workbenchEditorSectionPropsFrom>[0];

describe("workbenchEditorSectionPropsFrom", () => {
  it("maps editor workspace and session state onto section props", () => {
    const props = workbenchEditorSectionPropsFrom(createOptions());

    expect(props.activeFileMissing).toBe(false);
    expect(props.code.text).toBe("code");
    expect(props.editorBytesLabel).toBe("1.0 KB");
    expect(props.cursor).toEqual({ column: 1, line: 1 });
  });

  it("routes editor handlers to their owning controllers", () => {
    const options = createOptions();
    const props = workbenchEditorSectionPropsFrom(options);

    props.handlers.closeActiveTab();
    expect(options.editorNavigation.closeActiveTab).toHaveBeenCalled();
    props.handlers.save();
    expect(options.saveEditorFile).toHaveBeenCalled();
    props.handlers.find();
    expect(options.editorSurface.openEditorSearch).toHaveBeenCalled();
  });
});
