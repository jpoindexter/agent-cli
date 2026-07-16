import { describe, expect, it, vi } from "vitest";
import {
  buildTerminalContextMenuItems,
  buildUtilityTrayTabContextMenuItems,
} from "./terminalContextMenu";

const buildMenu = (overrides: Partial<Parameters<typeof buildTerminalContextMenuItems>[0]> = {}) => buildTerminalContextMenuItems({
  activePaneState: "running",
  hasActiveHandle: true,
  hasActivePane: true,
  hasSelection: true,
  hasWorkspace: true,
  hasWorktreeForActivePane: true,
  launchProfileChanging: false,
  launchProfileLabel: "Shell",
  shortcuts: {
    clear: "⌘K",
    copy: "⌘C",
    paste: "⌘V",
  },
  actions: {
    clear: vi.fn(),
    closePane: vi.fn(),
    copySelection: vi.fn(),
    copyTail: vi.fn(),
    copyWorkingDirectory: vi.fn(),
    createPane: vi.fn(),
    createWorktreePane: vi.fn(),
    interrupt: vi.fn(),
    killPane: vi.fn(),
    paste: vi.fn(),
    removeWorktree: vi.fn(),
    renamePane: vi.fn(),
    restartPane: vi.fn(),
    saveTranscript: vi.fn(),
  },
  ...overrides,
});

describe("terminal context menu", () => {
  it("keeps terminal actions enabled only when their runtime target exists", () => {
    const items = buildMenu({
      hasActiveHandle: false,
      hasActivePane: false,
      hasSelection: false,
      hasWorkspace: false,
      hasWorktreeForActivePane: false,
    });

    expect(items.find((item) => item.id === "terminal.new-pane")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "terminal.rename-pane")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "terminal.close-pane")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "terminal.copy")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "terminal.remove-worktree")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "terminal.copy-cwd")?.disabled).toBe(true);
  });

  it("marks destructive process actions as danger and disables kill after exit", () => {
    const items = buildMenu({ activePaneState: "exited" });

    expect(items.find((item) => item.id === "terminal.terminate-pane")).toMatchObject({
      danger: true,
      disabled: true,
    });
    expect(items.find((item) => item.id === "terminal.interrupt")).toMatchObject({
      danger: true,
      disabled: true,
    });
    expect(items.find((item) => item.id === "terminal.close-pane")?.danger).toBe(true);
  });

  it("builds utility-tab actions for terminal, process, and log modes", () => {
    const actions = {
      closePane: vi.fn(), copyActivity: vi.fn(), createShell: vi.fn(), hide: vi.fn(),
      killPane: vi.fn(), restartPane: vi.fn(), show: vi.fn(),
    };
    const input = {
      activeMode: "terminal" as const,
      activePaneState: "running",
      activeSurface: true,
      actions,
      hasActivePane: true,
      hasActivity: true,
      hasWorkspace: true,
      launchProfileChanging: false,
    };

    const terminal = buildUtilityTrayTabContextMenuItems("terminal", input);
    const processes = buildUtilityTrayTabContextMenuItems("processes", input);
    const logs = buildUtilityTrayTabContextMenuItems("logs", input);
    terminal.find((item) => item.id === "utility.terminal.new-shell")?.onSelect();
    processes.find((item) => item.id === "utility.processes.kill")?.onSelect();
    logs.find((item) => item.id === "utility.logs.copy")?.onSelect();
    logs.find((item) => item.id === "utility.logs.show")?.onSelect();

    expect(actions.createShell).toHaveBeenCalledOnce();
    expect(actions.killPane).toHaveBeenCalledOnce();
    expect(actions.copyActivity).toHaveBeenCalledOnce();
    expect(actions.show).toHaveBeenCalledWith("logs");
    expect(terminal.find((item) => item.id === "utility.terminal.show")?.disabled).toBe(true);
    expect(processes.find((item) => item.id === "utility.processes.kill")?.danger).toBe(true);
  });

  it("disables utility actions when their runtime target is absent", () => {
    const items = buildUtilityTrayTabContextMenuItems("processes", {
      activeMode: "logs",
      activePaneState: "exited",
      activeSurface: false,
      actions: {
        closePane: vi.fn(), copyActivity: vi.fn(), createShell: vi.fn(), hide: vi.fn(),
        killPane: vi.fn(), restartPane: vi.fn(), show: vi.fn(),
      },
      hasActivePane: false,
      hasActivity: false,
      hasWorkspace: false,
      launchProfileChanging: true,
    });

    expect(items.find((item) => item.id === "utility.processes.restart")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "utility.processes.kill")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "utility.hide")?.disabled).toBe(true);
  });
});
