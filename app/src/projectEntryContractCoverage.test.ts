import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("project entry production contract", () => {
  it("routes existing project doors through the shared action owner", () => {
    const app = source("./App.tsx");
    const appWorkbenchMain = source("./AppWorkbenchMain.tsx");
    const menuRuntime = source("./appEditorMenuRuntime.ts");
    const projectRuntime = source("./appProjectSessionRuntime.ts");
    const wiring = `${app}\n${appWorkbenchMain}\n${menuRuntime}\n${projectRuntime}\n${source("./appCommandPaletteHost.ts")}`;

    expect(projectRuntime).toContain('import { createProjectEntryActions } from "./projectEntryActions"');
    expect(projectRuntime).toContain("const projectEntryActions = createProjectEntryActions({");
    expect(menuRuntime).toContain("openWorkspace: input.projectEntry.openProject");
    expect(appWorkbenchMain).toContain("newTask: input.projectEntryActions.newTask");
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
