import type { ContextMenuItem } from "./ContextMenu";

type BrowserContextMenuInput = {
  canGoBack: boolean;
  canGoForward: boolean;
  actions: {
    back: ContextMenuItem["onSelect"];
    copyUrl: ContextMenuItem["onSelect"];
    forward: ContextMenuItem["onSelect"];
    openExternal: ContextMenuItem["onSelect"];
    reload: ContextMenuItem["onSelect"];
  };
};

type ComposerContextMenuInput = {
  activeRun: boolean;
  canAttachCurrent: boolean;
  canRunParallel: boolean;
  draft: string;
  hasWorkspace: boolean;
  sending: boolean;
  shortcut: string;
  actions: {
    attachCurrent: ContextMenuItem["onSelect"];
    attachLocal: ContextMenuItem["onSelect"];
    attachPreview: ContextMenuItem["onSelect"];
    clearDraft: ContextMenuItem["onSelect"];
    copyWorkspace: ContextMenuItem["onSelect"];
    parallel: ContextMenuItem["onSelect"];
    send: ContextMenuItem["onSelect"];
    stop: ContextMenuItem["onSelect"];
  };
};

const menuItem = (
  id: string,
  label: string,
  onSelect: ContextMenuItem["onSelect"],
  options: Pick<ContextMenuItem, "shortcut" | "icon" | "disabled" | "danger"> = {},
): ContextMenuItem => ({ id, label, onSelect, ...options });

export const buildBrowserContextMenuItems = ({
  actions, canGoBack, canGoForward,
}: BrowserContextMenuInput): ContextMenuItem[] => [
  menuItem("browser.back", "Back", actions.back, { icon: "back", disabled: !canGoBack }),
  menuItem("browser.forward", "Forward", actions.forward, { icon: "forward", disabled: !canGoForward }),
  menuItem("browser.reload", "Reload", actions.reload, { icon: "reload" }),
  menuItem("browser.open-external", "Open Externally", actions.openExternal, { icon: "openExternal" }),
  menuItem("browser.copy-url", "Copy URL", actions.copyUrl, { icon: "browser" }),
];

export const buildComposerContextMenuItems = (input: ComposerContextMenuInput): ContextMenuItem[] => [
  menuItem("composer.send", "Send Draft", input.actions.send, {
    icon: "send", shortcut: input.shortcut, disabled: input.sending || !input.draft.trim(),
  }),
  menuItem("composer.clear", "Clear Draft", input.actions.clearDraft, {
    icon: "close", disabled: !input.draft,
  }),
  menuItem("composer.attach-file", "Attach Local File", input.actions.attachLocal, { icon: "filePlus" }),
  menuItem("composer.attach-current", "Attach Current File", input.actions.attachCurrent, {
    icon: "file", disabled: !input.canAttachCurrent,
  }),
  menuItem("composer.attach-preview", "Attach Browser Preview", input.actions.attachPreview, { icon: "browser" }),
  menuItem("composer.parallel", "Run Parallel Child Chats", input.actions.parallel, {
    icon: "agent", disabled: !input.canRunParallel,
  }),
  menuItem("composer.stop", "Stop Chat Run", input.actions.stop, {
    icon: "stop", danger: true, disabled: !input.activeRun,
  }),
  menuItem("composer.copy-cwd", "Copy Target Workspace", input.actions.copyWorkspace, {
    icon: "workspace", disabled: !input.hasWorkspace,
  }),
];

export const buildComposerAddMenuItems = (input: ComposerContextMenuInput): ContextMenuItem[] => [
  menuItem("composer.add.files", "Files and folders", input.actions.attachLocal, { icon: "filePlus" }),
  menuItem("composer.add.current", "Current editor file", input.actions.attachCurrent, {
    icon: "file", disabled: !input.canAttachCurrent,
  }),
  menuItem("composer.add.preview", "Browser preview", input.actions.attachPreview, { icon: "browser" }),
  menuItem("composer.add.parallel", "Parallel child chats", input.actions.parallel, {
    icon: "agent", disabled: !input.canRunParallel,
  }),
];
