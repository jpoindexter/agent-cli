import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const agentComposerSurface = readFileSync(new URL("./AgentComposerSurface.tsx", import.meta.url), "utf8");
const projectThreadsDrawer = readFileSync(new URL("./ProjectThreadsDrawer.tsx", import.meta.url), "utf8");
const shellLayout = readFileSync(new URL("./useShellLayout.ts", import.meta.url), "utf8");
const terminalViewport = readFileSync(new URL("./TerminalViewport.tsx", import.meta.url), "utf8");
const terminalContextMenu = readFileSync(new URL("./terminalContextMenu.ts", import.meta.url), "utf8");

describe("production context-menu coverage", () => {
  it("registers unique commands for every promised surface", () => {
    const ids = Array.from(`${app}\n${terminalContextMenu}`.matchAll(/(?:menuItem|terminalItem)\("([^"]+)"/g), (match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const prefix of ["workspace.", "project.", "session.", "file.", "tab.", "editor.", "git.", "diff.", "terminal.", "pane.", "utility.", "browser.", "composer."]) {
      expect(ids.some((id) => id.startsWith(prefix))).toBe(true);
    }
  });

  it("wires project, session, file, editor, Git, diff, browser, terminal, and composer surfaces", () => {
    for (const marker of [
      "projectRailContextMenuItems(project)",
      "projectSessionContextMenuItems(path, session)",
      "file-tree-context-menu",
      "editorTabContextMenuItems(tab)",
      "editorContextMenuItems()",
      "gitFileContextMenuItems(file)",
      "diffContextMenuItems()",
      "browserContextMenuItems()",
      "terminalContextMenuItems()",
      "terminalPaneContextMenuItems(pane)",
      "utilityTrayTabContextMenuItems(mode)",
      "composerContextMenuItems()",
      "composerAddMenuItems()",
    ]) {
      expect(app).toContain(marker);
    }
    expect(projectThreadsDrawer).toContain("props.onProjectContextMenu(event, project)");
    expect(projectThreadsDrawer).toContain("onContextMenu(event, path, session)");
  });

  it("opens a Keelhouse add menu from the composer plus control", () => {
    expect(agentComposerSurface).toContain('aria-label="Add context or action"');
    expect(agentComposerSurface).toContain("onClick={props.onOpenAddMenu}");
    expect(app).toContain("onOpenAddMenu={openComposerAddMenu}");
    expect(app).toContain('querySelectorAll<HTMLDetailsElement>("details.agent-composer__menu[open]")');
    expect(app).toContain('menuItem("composer.add.files", "Files and folders"');
    expect(app).toContain('menuItem("composer.add.parallel", "Parallel child chats"');
  });

  it("routes browser URLs and composer stop through the correct product actions", () => {
    expect(app).not.toContain("openPath(browserUrl)");
    expect(app).toContain('menuItem("browser.open-external", "Open Externally", () => openUrl(browserUrl)');
    expect(app).toContain('menuItem("composer.stop", "Stop Chat Run", () => stopActiveChatRun()');
  });

  it("allows active projects to close through the managed close lifecycle", () => {
    const menu = app.slice(app.indexOf("const projectRailContextMenuItems"), app.indexOf("const projectSessionContextMenuItems"));
    expect(menu).toContain("requestCloseProject(project)");
    expect(menu.slice(menu.indexOf('"project.close"'))).not.toContain("disabled:");
    expect(app).toContain("intentionallyTerminatedPaneIdsRef.current.add(pane.id)");
  });

  it("keeps chat and raw-terminal launch defaults separate", () => {
    expect(shellLayout).toContain('useState<AgentSurfaceMode>("chat")');
    expect(app).toContain("createTerminalPane(defaultTerminalLaunchProfile())");
    expect(app).toContain('pickWorkspace({ openTerminal: true })');
    expect(terminalViewport).toContain("Open a folder to start a terminal");
    expect(app).toContain('set("terminalLaunchProfile", profile)');
    expect(app).not.toContain("createTerminalPane(launchProfileRef.current)");
  });

  it("keeps browser preview in the tool tray instead of duplicating it below chat", () => {
    expect(app).not.toContain('["browser", "browser", "Browser Preview"]');
    expect(app).not.toContain('className="utility-tray__browser"');
  });
});
