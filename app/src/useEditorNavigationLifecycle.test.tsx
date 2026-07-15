// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FileTreeNode } from "./fileTreeTypes";
import { useEditorNavigationLifecycle } from "./useEditorNavigationLifecycle";

const appFile: FileTreeNode = {
  id: "/workspace/src/App.tsx", kind: "file", name: "App.tsx", path: "/workspace/src/App.tsx",
};
const mainFile: FileTreeNode = {
  id: "/workspace/src/main.tsx", kind: "file", name: "main.tsx", path: "/workspace/src/main.tsx",
};

const setup = (overrides: Record<string, unknown> = {}) => {
  const options = {
    activeFile: appFile,
    captureEditor: vi.fn(),
    closeProject: vi.fn().mockResolvedValue(undefined),
    confirmClose: vi.fn().mockResolvedValue(true),
    editorTabs: [appFile, mainFile],
    getWorkspacePath: () => "/workspace",
    isDirty: () => false,
    onActivateTab: vi.fn().mockResolvedValue(undefined),
    onRemoveTab: vi.fn(),
    onResetAfterClose: vi.fn(),
    openFile: vi.fn().mockResolvedValue(undefined),
    openWorkspace: vi.fn().mockResolvedValue(undefined),
    saveEditorFile: vi.fn().mockResolvedValue(true),
    setEditorTabs: vi.fn(),
    ...overrides,
  };
  const hook = renderHook(() => useEditorNavigationLifecycle(options));
  return { ...hook, options };
};

describe("useEditorNavigationLifecycle", () => {
  it("keeps a dirty tab open when discard confirmation is denied", async () => {
    const subject = setup({
      confirmClose: vi.fn().mockResolvedValue(false),
      isDirty: (path: string) => path === appFile.path,
    });
    await act(() => subject.result.current.closeTab(appFile));

    expect(subject.options.confirmClose).toHaveBeenCalledWith("Close App.tsx and discard unsaved changes?");
    expect(subject.options.setEditorTabs).not.toHaveBeenCalled();
    expect(subject.options.onRemoveTab).not.toHaveBeenCalled();
  });

  it("activates the adjacent tab after closing the selected tab", async () => {
    const subject = setup();
    await act(() => subject.result.current.closeTab(appFile));

    expect(subject.options.setEditorTabs).toHaveBeenCalledWith([mainFile]);
    expect(subject.options.onRemoveTab).toHaveBeenCalledWith(appFile.path);
    expect(subject.options.onActivateTab).toHaveBeenCalledWith(mainFile);
  });

  it("saves a draft before continuing a requested workspace navigation", async () => {
    const subject = setup();
    act(() => subject.result.current.requestNavigation({ kind: "workspace", path: "/next" }));
    await act(() => subject.result.current.saveAndContinue());

    expect(subject.options.saveEditorFile).toHaveBeenCalledOnce();
    expect(subject.options.openWorkspace).toHaveBeenCalledWith("/next");
    expect(subject.result.current.pendingNavigation).toBeNull();
  });
});
