import { describe, expect, it, vi } from "vitest";
import type { FileTreeNode } from "./fileTreeTypes";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { buildCommandPaletteNavigationCommands } from "./commandPaletteNavigation";
import type { WorktreeRecord } from "./worktrees";

const file = (name: string): FileTreeNode => ({
  id: `/repo/${name}`,
  kind: "file",
  name,
  path: `/repo/${name}`,
});

const pane: ManagedTerminalPane = {
  createdAt: 1,
  cwd: "/repo",
  exitCode: null,
  id: 7,
  label: null,
  profile: { args: [], command: "/bin/zsh", id: "shell", label: "Shell", useLoginShell: false },
  slot: 0,
  state: "running",
};

const worktree = (paneId: string): WorktreeRecord => ({
  branch: `agent/${paneId}`,
  createdAt: 1,
  label: `Worktree ${paneId}`,
  paneId,
  path: `/tmp/${paneId}`,
  projectRoot: "/repo",
});

const createInput = () => ({
  drawerModes: [{ id: "files" as const, label: "Files", icon: "file" as const }],
  editorTabs: [file("open.ts")],
  files: [file("all.ts")],
  onFocusWorktree: vi.fn(),
  onLayoutChange: vi.fn(),
  onOpenFile: vi.fn(),
  onShowDrawer: vi.fn(),
  onTrayModeChange: vi.fn(),
  terminalPanes: [pane],
  workbenchLayout: "hidden" as const,
  workspacePath: "/repo",
  worktrees: [worktree("7"), worktree("9"), { ...worktree("8"), projectRoot: "/other" }],
});

describe("buildCommandPaletteNavigationCommands", () => {
  it("builds drawer, layout, and tray commands with their expected actions", () => {
    const input = createInput();
    const commands = buildCommandPaletteNavigationCommands(input);

    commands.find((command) => command.id === "drawer.files")?.run();
    commands.find((command) => command.id === "layout.bottom")?.run();
    commands.find((command) => command.id === "tool-tray.browser")?.run();

    expect(input.onShowDrawer).toHaveBeenCalledWith("files");
    expect(input.onLayoutChange).toHaveBeenNthCalledWith(1, "bottom");
    expect(input.onLayoutChange).toHaveBeenNthCalledWith(2, "right");
    expect(input.onTrayModeChange).toHaveBeenCalledWith("browser");
  });

  it("builds scoped worktree, tab, and file commands that invoke the supplied resources", () => {
    const input = createInput();
    const commands = buildCommandPaletteNavigationCommands(input);
    const liveWorktree = commands.find((command) => command.id === "worktree.7");
    const missingWorktree = commands.find((command) => command.id === "worktree.9");

    liveWorktree?.run();
    missingWorktree?.run();
    commands.find((command) => command.id === "tab./repo/open.ts")?.run();
    commands.find((command) => command.id === "file./repo/all.ts")?.run();

    expect(liveWorktree).toMatchObject({ disabled: false, source: "worktrees" });
    expect(missingWorktree).toMatchObject({ disabled: true, source: "worktrees" });
    expect(commands.some((command) => command.id === "worktree.8")).toBe(false);
    expect(input.onFocusWorktree).toHaveBeenCalledTimes(1);
    expect(input.onFocusWorktree).toHaveBeenCalledWith(7);
    expect(input.onOpenFile).toHaveBeenNthCalledWith(1, input.editorTabs[0]);
    expect(input.onOpenFile).toHaveBeenNthCalledWith(2, input.files[0]);
  });
});
