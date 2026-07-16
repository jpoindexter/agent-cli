import type { AgentActivityEvent } from "./agentActivity";
import type { UtilityTrayMode } from "./BottomUtilityTabs";
import {
  buildBrowserContextMenuItems,
  buildComposerAddMenuItems,
  buildComposerContextMenuItems,
} from "./browserComposerContextMenu";
import type { ContextMenuItem } from "./ContextMenu";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { buildUtilityTrayTabContextMenuItems } from "./terminalContextMenu";

type ActivityLogEvent = Pick<
  AgentActivityEvent, "detail" | "kind" | "label" | "status" | "target" | "timestamp"
>;

type PaneAction = (pane: ManagedTerminalPane) => unknown;

type AddMenuEvent = {
  currentTarget: {
    closest: (selector: string) => {
      querySelectorAll: (selector: string) => {
        forEach: (callback: (element: { removeAttribute: (name: string) => void }) => void) => void;
      };
    } | null;
    getBoundingClientRect: () => { left: number; top: number };
  };
  stopPropagation: () => void;
};

type AppMenuAssemblyOptions = {
  activityLog: () => ActivityLogEvent[];
  browser: {
    back: () => unknown; canGoBack: boolean; canGoForward: boolean; forward: () => unknown;
    openExternal: () => unknown; reload: () => unknown; url: string;
  };
  composer: {
    activeRun: boolean; attachCurrent: () => unknown; attachLocal: () => unknown;
    attachPreview: () => unknown; canAttachCurrent: boolean; canRunParallel: boolean;
    clearDraft: () => unknown; copyWorkspace: () => unknown; draft: string;
    hasWorkspace: boolean; parallel: () => unknown; send: () => unknown;
    sending: boolean; shortcut: string; stop: () => unknown;
  };
  copyText: (text: string) => Promise<unknown>;
  notify: (message: string) => void;
  pane: {
    activePaneId: number | null; changing: boolean;
    close: PaneAction; copyCwd: PaneAction; focus: PaneAction;
    hasWorktree: (pane: ManagedTerminalPane) => boolean;
    kill: PaneAction; removeWorktree: PaneAction; rename: PaneAction; restart: PaneAction;
  };
  setContextMenu: (menu: { items: ContextMenuItem[]; x: number; y: number }) => void;
  tray: {
    activeMode: UtilityTrayMode; activePaneState: string | null; activeSurface: boolean;
    closePane: () => unknown; createShell: () => unknown; hasActivePane: boolean;
    hasWorkspace: boolean; hide: () => unknown; killPane: () => unknown;
    launchProfileChanging: boolean; restartPane: () => unknown;
    show: (mode: UtilityTrayMode) => unknown;
  };
};

const menuItem = (
  id: string,
  label: string,
  onSelect: () => void,
  extra: Pick<ContextMenuItem, "shortcut" | "icon" | "disabled" | "danger"> = {},
): ContextMenuItem => ({ id, label, onSelect, ...extra });

const terminalPaneContextMenuItems = (
  options: AppMenuAssemblyOptions, pane: ManagedTerminalPane,
): ContextMenuItem[] => [
  menuItem("pane.focus", "Focus Pane", () => options.pane.focus(pane), {
    icon: "terminal", disabled: pane.id === options.pane.activePaneId,
  }),
  menuItem("pane.rename", "Rename Pane", () => options.pane.rename(pane), { icon: "terminal" }),
  menuItem("pane.restart", "Restart Process", () => options.pane.restart(pane), {
    icon: "reload", disabled: options.pane.changing,
  }),
  menuItem("pane.kill", "Kill Process", () => options.pane.kill(pane), {
    icon: "stop", danger: true, disabled: pane.state === "exited",
  }),
  menuItem("pane.close", "Close Pane", () => options.pane.close(pane), {
    icon: "close", danger: true,
  }),
  menuItem("pane.remove-worktree", "Remove Worktree", () => options.pane.removeWorktree(pane), {
    icon: "close", danger: true, disabled: !options.pane.hasWorktree(pane),
  }),
  menuItem("pane.copy-cwd", "Copy Working Directory", () => options.pane.copyCwd(pane), { icon: "workspace" }),
];

const copySelectedActivityLog = async (options: AppMenuAssemblyOptions) => {
  const text = options.activityLog().map((event) => [
    new Date(event.timestamp).toISOString(),
    event.kind,
    event.label,
    event.detail ?? event.target ?? "",
    event.status,
  ].join("\t")).join("\n");
  if (!text) return;
  await options.copyText(text);
  options.notify("Copied activity log");
};

const utilityTrayTabContextMenuItems = (options: AppMenuAssemblyOptions, mode: UtilityTrayMode) =>
  buildUtilityTrayTabContextMenuItems(mode, {
    activeMode: options.tray.activeMode,
    activePaneState: options.tray.activePaneState,
    activeSurface: options.tray.activeSurface,
    actions: {
      closePane: options.tray.closePane,
      copyActivity: () => copySelectedActivityLog(options),
      createShell: options.tray.createShell,
      hide: options.tray.hide,
      killPane: options.tray.killPane,
      restartPane: options.tray.restartPane,
      show: options.tray.show,
    },
    hasActivePane: options.tray.hasActivePane,
    hasActivity: options.activityLog().length > 0,
    hasWorkspace: options.tray.hasWorkspace,
    launchProfileChanging: options.tray.launchProfileChanging,
  });

const browserContextMenuItems = (options: AppMenuAssemblyOptions): ContextMenuItem[] =>
  buildBrowserContextMenuItems({
    canGoBack: options.browser.canGoBack,
    canGoForward: options.browser.canGoForward,
    actions: {
      back: options.browser.back,
      copyUrl: async () => {
        await options.copyText(options.browser.url);
        options.notify("Copied browser URL");
      },
      forward: options.browser.forward,
      openExternal: options.browser.openExternal,
      reload: options.browser.reload,
    },
  });

const composerMenuInput = (options: AppMenuAssemblyOptions) => ({
  activeRun: options.composer.activeRun,
  canAttachCurrent: options.composer.canAttachCurrent,
  canRunParallel: options.composer.canRunParallel,
  draft: options.composer.draft,
  hasWorkspace: options.composer.hasWorkspace,
  sending: options.composer.sending,
  shortcut: options.composer.shortcut,
  actions: {
    attachCurrent: options.composer.attachCurrent,
    attachLocal: options.composer.attachLocal,
    attachPreview: options.composer.attachPreview,
    clearDraft: options.composer.clearDraft,
    copyWorkspace: options.composer.copyWorkspace,
    parallel: options.composer.parallel,
    send: options.composer.send,
    stop: options.composer.stop,
  },
});

const openComposerAddMenu = (options: AppMenuAssemblyOptions, event: AddMenuEvent) => {
  event.stopPropagation();
  event.currentTarget.closest(".agent-composer__bar")
    ?.querySelectorAll("details.agent-composer__menu[open]")
    .forEach((menu) => menu.removeAttribute("open"));
  const items = buildComposerAddMenuItems(composerMenuInput(options));
  const rect = event.currentTarget.getBoundingClientRect();
  options.setContextMenu({ x: rect.left, y: rect.top - (items.length * 28 + 20), items });
};

export const createAppMenuAssembly = (options: AppMenuAssemblyOptions) => ({
  browserContextMenuItems: () => browserContextMenuItems(options),
  composerAddMenuItems: () => buildComposerAddMenuItems(composerMenuInput(options)),
  composerContextMenuItems: () => buildComposerContextMenuItems(composerMenuInput(options)),
  copySelectedActivityLog: () => copySelectedActivityLog(options),
  openComposerAddMenu: (event: AddMenuEvent) => openComposerAddMenu(options, event),
  terminalPaneContextMenuItems: (pane: ManagedTerminalPane) =>
    terminalPaneContextMenuItems(options, pane),
  utilityTrayTabContextMenuItems: (mode: UtilityTrayMode) =>
    utilityTrayTabContextMenuItems(options, mode),
});
