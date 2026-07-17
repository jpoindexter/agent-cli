import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("project entry production contract", () => {
  it("routes existing project doors through the shared action owner", () => {
    const app = source("./App.tsx");
    const menuRuntime = source("./appEditorMenuRuntime.ts");
    const wiring = `${app}\n${menuRuntime}\n${source("./appCommandPaletteHost.ts")}`;

    expect(app).toContain('import { createProjectEntryActions } from "./projectEntryActions"');
    expect(app).toContain("const projectEntryActions = createProjectEntryActions({");
    expect(menuRuntime).toContain("openWorkspace: input.projectEntry.openProject");
    expect(app).toContain("newTask: projectEntryActions.newTask");
    expect(wiring).toContain("onOpenWorkspace: () => void input.projectEntryActions.openProject()");
    expect(wiring).toContain("switchProject: (project: OpenProject) => input.projectEntry.switchProject(project.path)");
  });

  it("uses Project language at existing visible entry points", () => {
    for (const path of [
      "./AppNotices.tsx",
      "./QuickSettingsDrawer.tsx",
      "./commandPaletteWorkbench.ts",
      "./workspaceContextMenus.ts",
      "./shortcuts.ts",
    ]) {
      expect(source(path), path).not.toContain("Open Folder");
    }
    expect(source("../src-tauri/src/lib.rs")).toContain('"Open Project…"');
    expect(source("../src-tauri/src/lib.rs")).toContain('"New Task"');
    expect(source("../src-tauri/src/lib.rs")).toContain('"menu-new-task"');
  });
});
