import { describe, expect, it, vi } from "vitest";
import { composerHelpText } from "./agentComposer";
import { emptyChatConversation } from "./chatConversationMutations";
import { createComposerSurface } from "./composerSurfaceController";
import { DEFAULT_AI_CONNECTION_SETTINGS } from "./connectionSettings";
import type { ProjectSession } from "./workspaceStateTypes";

const session: ProjectSession = {
  id: "child", status: "running", title: "Child chat", updatedAt: 1,
};

const createDeps = () => ({
  chatIdForSession: (root: string, sessionId: string) => `${root}\n${sessionId}`,
  clearTerminal: vi.fn(async () => {}),
  gateAction: vi.fn(async () => ({ decision: "approved" as const, label: "Approve" })),
  getActiveConversation: vi.fn(() => ({ ...emptyChatConversation(1), activeRunId: "run-9" })),
  getActiveProvider: () => "codex" as const,
  getActiveSessionId: () => "chat" as string | null,
  getActiveSessions: () => ({}),
  getChatId: () => "/repo\nchat" as string | null,
  getComposerDraft: () => "",
  getComposerHistory: () => [] as string[],
  getComposerSending: () => false,
  getConversations: vi.fn(() => ({
    "/repo\nchild": { ...emptyChatConversation(1), activeRunId: "run-9" },
  })),
  getHarness: vi.fn(() => null as never),
  getHarnessRecords: () => ({}),
  getSelectedFilePath: () => null as string | null,
  getSessions: () => ({}),
  getSettings: () => structuredClone(DEFAULT_AI_CONNECTION_SETTINGS),
  getTerminalLabel: () => "Terminal",
  getWorkspacePath: () => "/repo" as string | null,
  now: () => 5,
  openSearch: vi.fn(),
  orchestrationGateAction: vi.fn(async () => ({ decision: "approved" as const })),
  persistHarnessRecords: vi.fn(async () => {}),
  persistSessions: vi.fn(async () => {}),
  pickWorkspace: vi.fn(async () => true),
  recordActivity: vi.fn(),
  removeWorktree: vi.fn(async () => {}),
  replaceConversations: vi.fn(),
  resolveProfileLabel: vi.fn(() => "Codex"),
  saveFile: vi.fn(async () => true),
  setActionNotice: vi.fn(),
  setComposerError: vi.fn(),
  setComposerHistoryIndex: vi.fn(),
  setComposerLocalState: vi.fn(),
  setComposerNotice: vi.fn(),
  setComposerSending: vi.fn(),
  setOrchestrationError: vi.fn(),
  setOrchestrationLaunching: vi.fn(),
  setOrchestrationOpen: vi.fn(),
  stopRun: vi.fn(async () => {}),
  updateConversation: vi.fn(),
  updateHarness: vi.fn(),
  updateSessionMetadata: vi.fn(async () => {}),
});

describe("createComposerSurface", () => {
  it("answers the help app command with the composer help text", async () => {
    const deps = createDeps();
    const surface = createComposerSurface(deps);

    expect(await surface.runComposerAppCommand("help")).toBe(true);

    expect(deps.setComposerNotice).toHaveBeenCalledWith(composerHelpText());
    expect(deps.gateAction).not.toHaveBeenCalled();
  });

  it("stops a child chat run through its conversation record", async () => {
    const deps = createDeps();
    const surface = createComposerSurface(deps);

    await surface.stopChildChatRun("/repo", session);

    expect(deps.stopRun).toHaveBeenCalledWith("run-9");
    expect(deps.setActionNotice).toHaveBeenCalledWith("Stopping Child chat");
  });
});
