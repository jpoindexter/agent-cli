import { describe, expect, it, vi } from "vitest";
import { createSessionSnapshotCapture, createSessionSnapshotRestore } from "./sessionSnapshotCapture";

const createOptions = () => ({
  capture: vi.fn(),
  getRoot: vi.fn(() => "/repo" as string | null),
  makeKey: (root: string, sessionId: string) => `${root}::${sessionId}`,
  persistPaneLayout: vi.fn(),
  persistSnapshots: vi.fn(),
  resolveSessionId: vi.fn(() => "chat" as string | null),
});

describe("createSessionSnapshotCapture", () => {
  it("captures the active session snapshot with its persistence hooks", () => {
    const options = createOptions();
    const captureSnapshot = createSessionSnapshotCapture(options);

    captureSnapshot();

    expect(options.capture).toHaveBeenCalledWith({
      key: "/repo::chat",
      persistPaneLayout: options.persistPaneLayout,
      persistSnapshots: options.persistSnapshots,
      root: "/repo",
      sessionId: "chat",
    });
  });

  it("does nothing without an active root or session", () => {
    const options = createOptions();
    options.resolveSessionId.mockReturnValue(null);
    const captureSnapshot = createSessionSnapshotCapture(options);

    captureSnapshot();

    expect(options.capture).not.toHaveBeenCalled();
  });
});

describe("createSessionSnapshotRestore", () => {
  it("restores with a scoped key when a session is provided", () => {
    const restore = vi.fn();
    const openFile = vi.fn();
    const run = createSessionSnapshotRestore({
      makeKey: (root: string, sessionId: string) => `${root}::${sessionId}`,
      openFile,
      restore,
    });

    run("/repo", "chat");
    expect(restore).toHaveBeenCalledWith({ key: "/repo::chat", openFile });

    run("/repo", null);
    expect(restore).toHaveBeenLastCalledWith({ key: null, openFile });
  });
});
