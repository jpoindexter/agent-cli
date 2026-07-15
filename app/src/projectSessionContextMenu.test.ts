import { describe, expect, it, vi } from "vitest";
import { buildProjectSessionContextMenuItems } from "./projectSessionContextMenu";

const session = {
  archived: false,
  checkpointId: null,
  id: "session-1",
  orchestration: null,
  pinnedAt: null,
  recoveryCheckpointId: null,
  title: "Review chrome",
};

const actions = {
  archive: vi.fn(),
  captureCheckpoint: vi.fn(),
  copyName: vi.fn(),
  delete: vi.fn(),
  pin: vi.fn(),
  removeChildWorktree: vi.fn(),
  rename: vi.fn(),
  restoreCheckpoint: vi.fn(),
  restoreRecoveryCheckpoint: vi.fn(),
  returnChildResult: vi.fn(),
  stopChildRun: vi.fn(),
  switchChat: vi.fn(),
};

const buildMenu = (overrides: Partial<Parameters<typeof buildProjectSessionContextMenuItems>[0]> = {}) => buildProjectSessionContextMenuItems({
  activeProjectSessionCount: 1,
  hasAssistantMessage: false,
  hasRunningChildRun: false,
  isActiveSession: true,
  isWorkspaceProject: true,
  projectSessionCount: 1,
  session,
  actions,
  ...overrides,
});

describe("project session context menu", () => {
  it("protects the active and last visible chat from destructive actions", () => {
    const items = buildMenu();

    expect(items.find((item) => item.id === "session.switch")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "session.archive")?.disabled).toBe(true);
    expect(items.find((item) => item.id === "session.delete")?.disabled).toBe(true);
  });

  it("enables child-result return only after a child run finishes with assistant output", () => {
    const childSession = {
      ...session,
      orchestration: {
        parentSessionId: "parent",
        returnedAt: null,
        worktreePath: "/tmp/worktree",
      },
    };
    const running = buildMenu({ hasRunningChildRun: true, session: childSession });
    const ready = buildMenu({ hasAssistantMessage: true, projectSessionCount: 2, session: childSession });

    expect(running.find((item) => item.id === "session.return-child")?.disabled).toBe(true);
    expect(ready.find((item) => item.id === "session.return-child")?.disabled).toBe(false);
    expect(ready.find((item) => item.id === "session.remove-child-worktree")?.disabled).toBe(false);
  });
});
