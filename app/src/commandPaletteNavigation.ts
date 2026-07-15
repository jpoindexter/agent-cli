import type { FileTreeNode } from "./fileTreeTypes";
import type { AppIconName } from "./icons";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import type { SearchDialogCommand } from "./SearchCommandDialog";
import type { SideDrawerMode } from "./useShellLayout";
import type { WorkbenchLayoutMode, ToolTrayMode } from "./workbenchLayout";
import type { WorktreeRecord } from "./worktrees";

type DrawerMode = { id: SideDrawerMode; label: string; icon: AppIconName };

type CommandPaletteNavigationInput = {
  drawerModes: DrawerMode[];
  editorTabs: FileTreeNode[];
  files: FileTreeNode[];
  onFocusWorktree: (paneId: number) => void;
  onLayoutChange: (mode: WorkbenchLayoutMode) => void;
  onOpenFile: (file: FileTreeNode) => void;
  onShowDrawer: (mode: SideDrawerMode) => void;
  onTrayModeChange: (mode: ToolTrayMode) => void;
  terminalPanes: ManagedTerminalPane[];
  workbenchLayout: WorkbenchLayoutMode;
  workspacePath: string | null;
  worktrees: WorktreeRecord[];
};

const layoutOptions: Array<[WorkbenchLayoutMode, string]> = [
  ["right", "Dock Tools Right"],
  ["left", "Dock Tools Left"],
  ["bottom", "Dock Tools Bottom"],
  ["hidden", "Hide Tool Tray"],
];

const trayOptions: Array<[Extract<ToolTrayMode, "split" | "editor" | "browser">, string]> = [
  ["split", "Show Split Tools"],
  ["editor", "Show Editor Tray"],
  ["browser", "Show Browser Tray"],
];

const drawerCommands = (input: CommandPaletteNavigationInput): SearchDialogCommand[] =>
  input.drawerModes.map((mode) => ({
    id: `drawer.${mode.id}`,
    label: `Show ${mode.label}`,
    detail: "Switch side drawer",
    icon: mode.icon,
    keywords: ["drawer", "sidebar", mode.id],
    run: () => input.onShowDrawer(mode.id),
  }));

const layoutCommands = (input: CommandPaletteNavigationInput): SearchDialogCommand[] =>
  layoutOptions.map(([mode, label]) => ({
    id: `layout.${mode}`,
    label,
    detail: "Move or hide the editor/browser tray",
    icon: mode === "hidden" ? "close" : "browser",
    keywords: ["layout", "tray", "dock"],
    run: () => input.onLayoutChange(mode),
  }));

const trayCommands = (input: CommandPaletteNavigationInput): SearchDialogCommand[] =>
  trayOptions.map(([mode, label]) => ({
    id: `tool-tray.${mode}`,
    label,
    detail: "Choose visible tool tray content",
    icon: mode === "browser" ? "browser" : mode === "editor" ? "file" : "workspace",
    keywords: ["tray", "editor", "browser"],
    run: () => {
      if (input.workbenchLayout === "hidden") input.onLayoutChange("right");
      input.onTrayModeChange(mode);
    },
  }));

const fileCommands = (
  files: FileTreeNode[],
  source: "files" | "tabs",
  onOpenFile: (file: FileTreeNode) => void,
): SearchDialogCommand[] => files.map((file) => ({
  id: `${source === "tabs" ? "tab" : "file"}.${file.path}`,
  label: file.name,
  detail: source === "tabs" ? `Open tab · ${file.path}` : file.path,
  source,
  icon: "file",
  keywords: [source === "tabs" ? "tab" : "file", source === "tabs" ? "editor" : "project", file.path],
  run: () => onOpenFile(file),
}));

const worktreeCommands = (input: CommandPaletteNavigationInput): SearchDialogCommand[] =>
  input.worktrees
    .filter((worktree) => worktree.projectRoot === input.workspacePath)
    .map((worktree) => {
      const pane = input.terminalPanes.find((candidate) => String(candidate.id) === worktree.paneId);
      return {
        id: `worktree.${worktree.paneId}`,
        label: worktree.label,
        detail: `${worktree.branch} · ${worktree.path}`,
        source: "worktrees",
        icon: "terminal",
        disabled: !pane,
        keywords: ["worktree", "branch", "terminal", worktree.branch],
        run: () => { if (pane) input.onFocusWorktree(pane.id); },
      };
    });

export const buildCommandPaletteLayoutCommands = (
  input: CommandPaletteNavigationInput,
): SearchDialogCommand[] => [
  ...drawerCommands(input),
  ...layoutCommands(input),
  ...trayCommands(input),
];

export const buildCommandPaletteResourceCommands = (
  input: CommandPaletteNavigationInput,
): SearchDialogCommand[] => [
  ...fileCommands(input.editorTabs, "tabs", input.onOpenFile),
  ...worktreeCommands(input),
  ...fileCommands(input.files, "files", input.onOpenFile),
];

export const buildCommandPaletteNavigationCommands = (
  input: CommandPaletteNavigationInput,
): SearchDialogCommand[] => [
  ...buildCommandPaletteLayoutCommands(input),
  ...buildCommandPaletteResourceCommands(input),
];
