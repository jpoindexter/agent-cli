import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { WorkbenchEditorSection, type WorkbenchEditorSectionProps } from "./WorkbenchEditorSection";
import type { FileTreeNode } from "./fileTreeTypes";

const file: FileTreeNode = { id: "1", kind: "file", name: "main.ts", path: "/repo/main.ts" };

const props = (overrides: Partial<WorkbenchEditorSectionProps> = {}): WorkbenchEditorSectionProps => ({
  activeFileMissing: false,
  code: { conflict: false, error: null, loading: false, recoveryError: null, saving: false, text: "" },
  cursor: { column: 1, line: 1 },
  diff: {
    breadcrumbs: [], canDiscard: false, canOpenFile: false, canStage: false,
    canUnstage: false, error: null, loading: false, review: null,
  },
  editorBreadcrumbs: [],
  editorBytesLabel: "--",
  editorDirty: false,
  editorLanguage: "TS",
  editorLoading: false,
  editorSaving: false,
  handlers: {
    closeActiveTab: vi.fn(), closeDiff: vi.fn(), closeTab: vi.fn(), copyDiff: vi.fn(),
    find: vi.fn(), onChange: vi.fn(), onCreateEditor: vi.fn(), onUpdate: vi.fn(),
    openContextMenu: vi.fn(), openDiff: vi.fn(), openExternally: vi.fn(),
    overwrite: vi.fn(), reload: vi.fn(), runDiffAction: vi.fn(), save: vi.fn(),
    selectTab: vi.fn(), tabContextMenu: vi.fn(),
  },
  selectedFile: null,
  tabIsDirty: () => false,
  tabs: [file],
  ...overrides,
});

describe("WorkbenchEditorSection", () => {
  it("renders the empty state when no file is selected", () => {
    const html = renderToStaticMarkup(<WorkbenchEditorSection {...props()} />);

    expect(html).toContain('class="editor-area"');
    expect(html).toContain("Select a file");
    expect(html).toContain("main.ts");
  });

  it("renders the code surface instead of the empty state for a selected file", () => {
    const html = renderToStaticMarkup(
      <WorkbenchEditorSection {...props({ selectedFile: file })} />,
    );

    expect(html).not.toContain("Select a file");
  });

  it("prefers the diff view while a diff is loading", () => {
    const html = renderToStaticMarkup(
      <WorkbenchEditorSection {...props({
        diff: {
          breadcrumbs: [], canDiscard: false, canOpenFile: false, canStage: false,
          canUnstage: false, error: null, loading: true, review: null,
        },
        selectedFile: file,
      })} />,
    );

    expect(html).not.toContain("Select a file");
    expect(html).toContain("diff");
  });
});
