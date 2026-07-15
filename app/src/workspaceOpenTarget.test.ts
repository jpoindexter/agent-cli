import { describe, expect, it, vi } from "vitest";
import { resolveWorkspaceOpenTarget } from "./workspaceOpenTarget";

describe("resolveWorkspaceOpenTarget", () => {
  it("focuses and reuses an existing active pane", async () => {
    const focusPane = vi.fn().mockResolvedValue(undefined);
    const openTerminalPanes = vi.fn();
    const resolveWorkspace = vi.fn();

    const result = await resolveWorkspaceOpenTarget({
      activePaneId: 7,
      existingPanes: [{ id: 7 }],
      focusPane,
      openTerminalPanes,
      path: "/repo",
      resolveWorkspace,
      surfaceMode: "terminal",
    });

    expect(result).toEqual({ activePaneId: 7, panes: [{ id: 7 }], root: "/repo" });
    expect(focusPane).toHaveBeenCalledWith(7);
    expect(openTerminalPanes).not.toHaveBeenCalled();
    expect(resolveWorkspace).not.toHaveBeenCalled();
  });

  it("opens terminal panes when the terminal surface is active", async () => {
    const opened = { activePaneId: 9, panes: [{ id: 9 }], root: "/resolved" };
    const openTerminalPanes = vi.fn().mockResolvedValue(opened);

    const result = await resolveWorkspaceOpenTarget({
      activePaneId: null,
      existingPanes: [],
      focusPane: vi.fn(),
      openTerminalPanes,
      path: "/repo",
      resolveWorkspace: vi.fn(),
      surfaceMode: "terminal",
    });

    expect(result).toBe(opened);
  });

  it("resolves the workspace without panes on other surfaces", async () => {
    const resolveWorkspace = vi.fn().mockResolvedValue({ root: "/resolved" });

    const result = await resolveWorkspaceOpenTarget({
      activePaneId: null,
      existingPanes: [],
      focusPane: vi.fn(),
      openTerminalPanes: vi.fn(),
      path: "/repo",
      resolveWorkspace,
      surfaceMode: "chat",
    });

    expect(result).toEqual({ activePaneId: null, panes: [], root: "/resolved" });
  });
});
