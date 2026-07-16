// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import type { EditorView } from "@codemirror/view";
import { describe, expect, it, vi } from "vitest";
import type { FileTreeNode } from "./fileTreeTypes";
import { useEditorSessionController } from "./useEditorSessionController";

const file: FileTreeNode = {
  id: "/repo/src/App.tsx",
  kind: "file",
  name: "App.tsx",
  path: "/repo/src/App.tsx",
};

describe("useEditorSessionController", () => {
  it("captures the active editor buffer", () => {
    const { result } = renderHook(() => useEditorSessionController());
    act(() => {
      result.current.setSelectedFile(file);
      result.current.setEditorText("draft");
      result.current.setSavedEditorText("saved");
      result.current.setEditorBytes(5);
      result.current.setEditorModifiedMs(100);
      result.current.setEditorError("read warning");
      result.current.setEditorRecoveryError("recovery warning");
    });

    act(() => result.current.captureCurrentEditorBuffer());

    expect(result.current.editorBuffersRef.current[file.path]).toEqual({
      bytes: 5,
      error: "read warning",
      modifiedMs: 100,
      recoveryError: "recovery warning",
      savedText: "saved",
      text: "draft",
    });
  });

  it("captures selection, scroll, and focus for the active editor view", () => {
    const { result } = renderHook(() => useEditorSessionController());
    result.current.selectedFileRef.current = file;
    result.current.editorViewRef.current = {
      hasFocus: true,
      scrollDOM: { scrollTop: 42 },
      state: { selection: { main: { anchor: 3, head: 8 } } },
    } as unknown as EditorView;

    act(() => result.current.captureCurrentEditorViewState());

    expect(result.current.editorViewStatesRef.current[file.path]).toEqual({
      anchor: 3,
      focused: true,
      head: 8,
      scrollTop: 42,
    });
  });

  it("resets editor state and invalidates pending loads", () => {
    const { result } = renderHook(() => useEditorSessionController());
    act(() => {
      result.current.setSelectedFile(file);
      result.current.setEditorTabs([file]);
      result.current.setEditorText("draft");
      result.current.setSavedEditorText("saved");
      result.current.setEditorError("error");
      result.current.setEditorRecoveryError("recovery");
      result.current.setEditorBytes(5);
      result.current.setEditorModifiedMs(100);
      result.current.setEditorCursor({ line: 4, column: 2 });
    });
    result.current.editorBuffersRef.current[file.path] = {
      bytes: 5, error: null, modifiedMs: 100, recoveryError: null,
      savedText: "saved", text: "draft",
    };
    const loadSequence = result.current.editorLoadSeq.current;

    act(() => result.current.resetEditor());

    expect(result.current.editorLoadSeq.current).toBe(loadSequence + 1);
    expect(result.current.editorBuffersRef.current).toEqual({});
    expect(result.current.editorTabs).toEqual([]);
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.editorText).toBe("");
    expect(result.current.savedEditorText).toBe("");
    expect(result.current.editorError).toBeNull();
    expect(result.current.editorRecoveryError).toBeNull();
    expect(result.current.editorBytes).toBeNull();
    expect(result.current.editorModifiedMs).toBeNull();
    expect(result.current.editorCursor).toEqual({ line: 1, column: 1 });
  });

  it("captures the current editor session and persists its pane layout", () => {
    const persistSnapshots = vi.fn();
    const persistPaneLayout = vi.fn();
    const { result } = renderHook(() => useEditorSessionController());
    act(() => {
      result.current.setSelectedFile(file);
      result.current.setEditorTabs([file]);
      result.current.setEditorText("draft");
      result.current.setSavedEditorText("saved");
    });

    act(() => result.current.captureSessionSnapshot({
      key: "/repo\nsession-one", persistPaneLayout, persistSnapshots,
      root: "/repo", sessionId: "session-one",
    }));

    expect(persistSnapshots).toHaveBeenCalledWith({
      "/repo\nsession-one": expect.objectContaining({
        activePath: file.path, tabs: [file],
      }),
    });
    expect(persistPaneLayout).toHaveBeenCalledWith("/repo", "session-one");
  });

  it("restores the saved tabs, buffers, view states, and active file", () => {
    const openFile = vi.fn();
    const { result } = renderHook(() => useEditorSessionController());
    result.current.sessionEditorSnapshotsRef.current["/repo\nsession-one"] = {
      activePath: file.path,
      buffers: { [file.path]: {
        bytes: 5, error: null, modifiedMs: 100, recoveryError: null,
        savedText: "saved", text: "draft",
      } },
      tabs: [file],
      viewStates: { [file.path]: { anchor: 1, focused: false, head: 2, scrollTop: 3 } },
    };

    act(() => result.current.restoreSessionSnapshot({
      key: "/repo\nsession-one", openFile,
    }));

    expect(result.current.editorTabs).toEqual([file]);
    expect(result.current.editorBuffersRef.current[file.path]?.text).toBe("draft");
    expect(result.current.editorViewStatesRef.current[file.path]?.scrollTop).toBe(3);
    expect(openFile).toHaveBeenCalledWith(file);
  });
});
