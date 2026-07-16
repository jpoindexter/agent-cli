import { describe, expect, it, vi } from "vitest";
import { createAppMenuAssembly } from "./appMenuAssembly";
import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";

const profile: LaunchProfile = {
  id: "codex", label: "Codex", command: "codex", args: [], useLoginShell: false,
};
const pane = (id: number, state: ManagedTerminalPane["state"] = "running"): ManagedTerminalPane => ({
  createdAt: id, cwd: "/repo", exitCode: null, id, label: null, profile, slot: id - 1, state,
});

const createOptions = () => ({
  activityLog: vi.fn(() => [{
    detail: "codex", kind: "process" as const, label: "Created pane",
    status: "running" as const, target: undefined, timestamp: 0,
  }]),
  browser: {
    back: vi.fn(), canGoBack: true, canGoForward: false, forward: vi.fn(),
    openExternal: vi.fn(), reload: vi.fn(), url: "http://localhost:3000",
  },
  composer: {
    activeRun: false, attachCurrent: vi.fn(), attachLocal: vi.fn(), attachPreview: vi.fn(),
    canAttachCurrent: true, canRunParallel: true, clearDraft: vi.fn(), copyWorkspace: vi.fn(),
    draft: "hello", hasWorkspace: true, parallel: vi.fn(), send: vi.fn(),
    sending: false, shortcut: "⌘↩", stop: vi.fn(),
  },
  copyText: vi.fn(async () => {}),
  notify: vi.fn(),
  pane: {
    activePaneId: 1 as number | null, changing: false,
    close: vi.fn(), copyCwd: vi.fn(), focus: vi.fn(),
    hasWorktree: vi.fn(() => false), kill: vi.fn(), removeWorktree: vi.fn(),
    rename: vi.fn(), restart: vi.fn(),
  },
  setContextMenu: vi.fn(),
  tray: {
    activeMode: "terminal" as const, activePaneState: "running" as string | null,
    activeSurface: true, closePane: vi.fn(), createShell: vi.fn(),
    hasActivePane: true, hasWorkspace: true, hide: vi.fn(),
    killPane: vi.fn(), launchProfileChanging: false, restartPane: vi.fn(),
    show: vi.fn(),
  },
});

describe("createAppMenuAssembly", () => {
  it("builds pane context items with ownership-aware disabled flags", () => {
    const options = createOptions();
    options.pane.changing = true;
    const assembly = createAppMenuAssembly(options);

    const items = assembly.terminalPaneContextMenuItems(pane(1, "exited"));
    const byId = Object.fromEntries(items.map((item) => [item.id, item]));

    expect(byId["pane.focus"].disabled).toBe(true);
    expect(byId["pane.restart"].disabled).toBe(true);
    expect(byId["pane.kill"].disabled).toBe(true);
    expect(byId["pane.remove-worktree"].disabled).toBe(true);

    byId["pane.rename"].onSelect();
    expect(options.pane.rename).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it("copies the selected activity log as tab-separated lines", async () => {
    const options = createOptions();
    const assembly = createAppMenuAssembly(options);

    await assembly.copySelectedActivityLog();

    expect(options.copyText).toHaveBeenCalledWith(
      ["1970-01-01T00:00:00.000Z", "process", "Created pane", "codex", "running"].join("\t"),
    );
    expect(options.notify).toHaveBeenCalledWith("Copied activity log");
  });

  it("skips the clipboard entirely for an empty activity log", async () => {
    const options = createOptions();
    options.activityLog.mockReturnValue([]);
    const assembly = createAppMenuAssembly(options);

    await assembly.copySelectedActivityLog();

    expect(options.copyText).not.toHaveBeenCalled();
    expect(options.notify).not.toHaveBeenCalled();
  });

  it("copies the browser url through the browser menu", async () => {
    const options = createOptions();
    const assembly = createAppMenuAssembly(options);

    const copyItem = assembly.browserContextMenuItems().find((item) => /copy/i.test(item.label));
    await copyItem?.onSelect();

    expect(options.copyText).toHaveBeenCalledWith("http://localhost:3000");
    expect(options.notify).toHaveBeenCalledWith("Copied browser URL");
  });

  it("opens the composer add menu above the trigger button", () => {
    const options = createOptions();
    const assembly = createAppMenuAssembly(options);
    const removeAttribute = vi.fn();
    const event = {
      currentTarget: {
        closest: () => ({ querySelectorAll: () => [{ removeAttribute }] }),
        getBoundingClientRect: () => ({ left: 40, top: 500 }),
      },
      stopPropagation: vi.fn(),
    };

    assembly.openComposerAddMenu(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(removeAttribute).toHaveBeenCalledWith("open");
    const call = options.setContextMenu.mock.calls[0][0];
    expect(call.x).toBe(40);
    expect(call.y).toBe(500 - (call.items.length * 28 + 20));
  });
});
