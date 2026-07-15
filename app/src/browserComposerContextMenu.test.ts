import { describe, expect, it, vi } from "vitest";

import {
  buildBrowserContextMenuItems,
  buildComposerAddMenuItems,
  buildComposerContextMenuItems,
} from "./browserComposerContextMenu";

const action = () => vi.fn();
const composerInput = () => ({
  activeRun: false,
  canAttachCurrent: true,
  canRunParallel: true,
  draft: "Ship this",
  hasWorkspace: true,
  sending: false,
  shortcut: "⌘↵",
  actions: {
    attachCurrent: action(), attachLocal: action(), attachPreview: action(),
    clearDraft: action(), copyWorkspace: action(), parallel: action(),
    send: action(), stop: action(),
  },
});

describe("browser and composer context menus", () => {
  it("disables unavailable browser history directions", () => {
    const items = buildBrowserContextMenuItems({
      canGoBack: false,
      canGoForward: true,
      actions: { back: action(), copyUrl: action(), forward: action(), openExternal: action(), reload: action() },
    });

    expect(items.find((item) => item.id === "browser.back")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "browser.forward")?.disabled).toBe(false);
  });

  it("routes composer actions and reflects run state", () => {
    const input = composerInput();
    const items = buildComposerContextMenuItems(input);
    items.find((item) => item.id === "composer.send")?.onSelect();

    expect(input.actions.send).toHaveBeenCalledOnce();
    expect(items.find((item) => item.id === "composer.stop")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "composer.send")?.shortcut).toBe("⌘↵");
  });

  it("shares attachment and parallel actions with the add menu", () => {
    const input = composerInput();
    const items = buildComposerAddMenuItems(input);
    items.find((item) => item.id === "composer.add.parallel")?.onSelect();

    expect(input.actions.parallel).toHaveBeenCalledOnce();
    expect(items.find((item) => item.id === "composer.add.current")?.disabled).toBe(false);
  });
});
