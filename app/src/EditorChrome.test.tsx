import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { EditorChrome, type EditorChromeProps } from "./EditorChrome";

const props = (overrides: Partial<EditorChromeProps> = {}): EditorChromeProps => ({
  activeFileMissing: false, breadcrumbs: [], canCopyDiff: false, canDiscardDiff: false,
  canOpenDiff: false, canStageDiff: false, canUnstageDiff: false, cursorColumn: 1, cursorLine: 1,
  diff: null, diffError: null, diffLoading: false, editorBytesLabel: "--", editorDirty: false,
  editorLanguage: "No file", editorLoading: false, editorSaving: false, selectedFile: null,
  tabs: [], tabIsDirty: () => false, onCloseDiff: vi.fn(), onCloseTab: vi.fn(), onCopyDiff: vi.fn(),
  onDiscardDiff: vi.fn(), onFind: vi.fn(), onOpenDiff: vi.fn(), onSave: vi.fn(), onSelectTab: vi.fn(),
  onStageDiff: vi.fn(), onTabContextMenu: vi.fn(), onUnstageDiff: vi.fn(), ...overrides,
});

describe("EditorChrome", () => {
  it("renders the empty editor tab", () => {
    expect(renderToStaticMarkup(<EditorChrome {...props()} />)).toContain("No file open");
  });

  it("renders file metadata and breadcrumbs", () => {
    const file = { id: "/repo/App.tsx", name: "App.tsx", path: "/repo/App.tsx", kind: "file" as const };
    const html = renderToStaticMarkup(<EditorChrome {...props({ breadcrumbs: ["repo", "App.tsx"], editorBytesLabel: "2 KB", editorLanguage: "TypeScript", selectedFile: file, tabs: [file] })} />);
    expect(html).toContain("TypeScript");
    expect(html).toContain("2 KB");
    expect(html).toContain("Active file path");
  });
});
