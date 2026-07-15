import { describe, expect, it, vi } from "vitest";
import { buildTerminalContextMenuItems } from "./terminalContextMenu";

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
});
