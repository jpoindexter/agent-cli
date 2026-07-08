import { describe, expect, it } from "vitest";
import {
  dirtyEditorTabPaths,
  removeEditorBuffersWithin,
  removeEditorTab,
  removeEditorTabsWithin,
  retargetEditorBuffers,
  retargetEditorTabs,
  upsertEditorTab,
} from "./editorTabs";

const tab = (path: string) => ({
  id: path,
  path,
  name: path.split("/").pop() ?? path,
});

describe("editor tab helpers", () => {
  it("adds a file once and keeps existing order", () => {
    const first = tab("/work/a.ts");
    const second = tab("/work/b.ts");
    expect(upsertEditorTab([first], first)).toEqual([first]);
    expect(upsertEditorTab([first], second)).toEqual([first, second]);
  });

  it("chooses the neighboring tab when closing the active tab", () => {
    const tabs = [tab("/work/a.ts"), tab("/work/b.ts"), tab("/work/c.ts")];
    expect(removeEditorTab(tabs, "/work/b.ts", "/work/b.ts")).toEqual({
      tabs: [tabs[0], tabs[2]],
      nextActivePath: "/work/c.ts",
    });
    expect(removeEditorTab(tabs, "/work/c.ts", "/work/c.ts")).toEqual({
      tabs: [tabs[0], tabs[1]],
      nextActivePath: "/work/b.ts",
    });
  });

  it("keeps the active tab when closing an inactive tab", () => {
    const tabs = [tab("/work/a.ts"), tab("/work/b.ts")];
    expect(removeEditorTab(tabs, "/work/a.ts", "/work/b.ts")).toEqual({
      tabs: [tabs[0]],
      nextActivePath: "/work/a.ts",
    });
  });

  it("reports dirty active and inactive tabs", () => {
    const tabs = [tab("/work/a.ts"), tab("/work/b.ts"), tab("/work/c.ts")];
    expect(
      dirtyEditorTabPaths(
        tabs,
        {
          "/work/b.ts": { text: "changed", savedText: "saved" },
          "/work/c.ts": { text: "saved", savedText: "saved" },
        },
        "/work/a.ts",
        true,
      ),
    ).toEqual(["/work/a.ts", "/work/b.ts"]);
  });

  it("retargets tabs and buffers when a file or folder is renamed", () => {
    const tabs = [tab("/work/src/a.ts"), tab("/work/src/deep/b.ts"), tab("/work/other.ts")];
    expect(retargetEditorTabs(tabs, "/work/src", "/work/app", (path) => path.split("/").pop() ?? path)).toEqual([
      tab("/work/app/a.ts"),
      tab("/work/app/deep/b.ts"),
      tab("/work/other.ts"),
    ]);
    expect(retargetEditorBuffers({ "/work/src/a.ts": 1, "/work/other.ts": 2 }, "/work/src", "/work/app")).toEqual({
      "/work/app/a.ts": 1,
      "/work/other.ts": 2,
    });
  });

  it("removes tabs and buffers inside deleted paths", () => {
    const tabs = [tab("/work/src/a.ts"), tab("/work/src/deep/b.ts"), tab("/work/other.ts")];
    expect(removeEditorTabsWithin(tabs, "/work/src")).toEqual([tab("/work/other.ts")]);
    expect(removeEditorBuffersWithin({ "/work/src/a.ts": 1, "/work/other.ts": 2 }, "/work/src")).toEqual({
      "/work/other.ts": 2,
    });
  });
});
