import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { TreeApi } from "react-arborist";
import { describe, expect, it, vi } from "vitest";

import { FilesSideDrawer, type FilesSideDrawerProps } from "./FilesSideDrawer";
import type { FileTreeNode } from "./fileTreeTypes";

const props = (overrides: Partial<FilesSideDrawerProps> = {}): FilesSideDrawerProps => ({
  fileOpError: null, fileTree: [], fileTreeError: null, fileTreeLoading: false,
  fileTreeTruncated: false, railBodyRef: createRef<HTMLDivElement>(), railHeight: 480,
  selectedFileId: undefined, treeRef: createRef<TreeApi<FileTreeNode> | undefined>(),
  visibleFileTree: [], workspaceName: null, workspacePath: null, onCreateFile: vi.fn(),
  onCreateFolder: vi.fn(), onOpenFile: vi.fn(), onOpenFolder: vi.fn(),
  onWorkspaceContextMenu: vi.fn(), ...overrides,
});

describe("FilesSideDrawer", () => {
  it("renders the no-workspace state and disables creation", () => {
    const html = renderToStaticMarkup(<FilesSideDrawer {...props()} />);
    expect(html).toContain("No workspace");
    expect(html).toContain("Open a folder");
    expect(html).toContain("disabled");
  });

  it("renders workspace errors and truncation status", () => {
    const html = renderToStaticMarkup(<FilesSideDrawer {...props({ workspaceName: "agent cli", workspacePath: "/repo", fileTreeError: "Read failed", fileTreeTruncated: true })} />);
    expect(html).toContain("Workspace agent cli");
    expect(html).toContain("Read failed");
    expect(html).toContain("Showing first 8000 entries");
  });
});
