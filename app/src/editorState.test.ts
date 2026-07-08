import { describe, expect, it } from "vitest";
import {
  clampEditorViewState,
  cursorFromText,
  findFileTreeNode,
  fileTreeContainsPath,
  languageLabelForPath,
  pathBreadcrumbs,
} from "./editorState";

describe("editorState helpers", () => {
  it("builds workspace-relative breadcrumbs", () => {
    expect(pathBreadcrumbs("/work/project", "/work/project/src/App.tsx")).toEqual(["project", "src", "App.tsx"]);
  });

  it("falls back to a filename when the path is outside the workspace", () => {
    expect(pathBreadcrumbs("/work/project", "/tmp/outside.txt")).toEqual(["outside.txt"]);
  });

  it("finds active files in nested trees", () => {
    const tree = [
      {
        path: "/work/project/src",
        children: [{ path: "/work/project/src/App.tsx", kind: "file" }],
      },
    ];
    expect(fileTreeContainsPath(tree, "/work/project/src/App.tsx")).toBe(true);
    expect(findFileTreeNode(tree, "/work/project/src/App.tsx")).toEqual({
      path: "/work/project/src/App.tsx",
      kind: "file",
    });
  });

  it("reports one-based cursor positions", () => {
    expect(cursorFromText("one\ntwo\nthree", 6)).toEqual({ line: 2, column: 3 });
  });

  it("clamps stale view state into the current document", () => {
    expect(clampEditorViewState({ anchor: -4, head: 99, scrollTop: -8 }, 12)).toEqual({
      anchor: 0,
      head: 12,
      scrollTop: 0,
    });
  });

  it("labels known editor modes", () => {
    expect(languageLabelForPath("/work/project/README.md")).toBe("Markdown");
    expect(languageLabelForPath("/work/project/src/App.tsx")).toBe("TSX");
  });
});
