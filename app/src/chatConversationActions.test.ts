import { describe, expect, it, vi } from "vitest";
import { emptyChatConversation, type ChatConversationRecords, type ChatMessage } from "./chatConversation";
import { createChatConversationActions } from "./chatConversationActions";
import type { ProjectSession } from "./workspaceState";

const message: ChatMessage = {
  id: "message-1",
  role: "assistant",
  text: "Result",
  timestamp: 10,
};

const sourceSession: ProjectSession = {
  id: "source",
  status: "exited",
  title: "Source chat",
  updatedAt: 10,
};

const otherSession: ProjectSession = {
  id: "other",
  status: "exited",
  title: "Other project",
  updatedAt: 5,
};

const createActions = (initial: ChatConversationRecords = {}) => {
  let conversations = initial;
  const calls: string[] = [];
  const dependencies = {
    createCheckpoint: vi.fn(async () => ({ createdAt: 20, id: "checkpoint-1" })),
    getActiveChatId: vi.fn(() => "/repo\nsource" as string | null),
    getConversations: vi.fn(() => conversations),
    getForkContext: vi.fn(() => ({
      browserUrl: "http://localhost:5173",
      projectPath: "/repo",
      sessions: [sourceSession],
      sessionsByProject: { "/other": [otherSession], "/repo": [sourceSession] },
      sourceSessionId: "source",
    })),
    now: vi.fn(() => 30),
    persistBrowserUrl: vi.fn(async () => { calls.push("browser"); }),
    persistSessions: vi.fn(async () => { calls.push("sessions"); }),
    refreshSearch: vi.fn(() => { calls.push("search"); }),
    reportPersistenceError: vi.fn(),
    saveConversation: vi.fn(async () => { calls.push("save"); }),
    setConversations: vi.fn((next: ChatConversationRecords) => {
      calls.push("state");
      conversations = next;
    }),
    setError: vi.fn(),
    setNotice: vi.fn(),
    switchSession: vi.fn(async () => { calls.push("switch"); }),
  };
  return { actions: createChatConversationActions(dependencies), calls, dependencies };
};

describe("createChatConversationActions", () => {
  it("increments the revision and persists an updated conversation", () => {
    const { actions, dependencies } = createActions();

    const updated = actions.updateConversation("chat", (conversation) => ({
      ...conversation,
      messages: [message],
    }));

    expect(updated).toMatchObject({ messages: [message], revision: 1 });
    expect(dependencies.setConversations).toHaveBeenCalledWith({ chat: updated });
    expect(dependencies.saveConversation).toHaveBeenCalledWith("chat", updated);
  });

  it("toggles the selected message bookmark and refreshes discovery", () => {
    const conversation = { ...emptyChatConversation(), messages: [message], revision: 4 };
    const { actions, dependencies } = createActions({ "/repo\nsource": conversation });

    actions.toggleBookmark(message);

    expect(dependencies.setConversations).toHaveBeenCalledWith({
      "/repo\nsource": expect.objectContaining({
        messages: [expect.objectContaining({ id: "message-1", bookmarked: true })],
        revision: 5,
      }),
    });
    expect(dependencies.refreshSearch).toHaveBeenCalledOnce();
    expect(dependencies.setNotice).toHaveBeenCalledWith("Bookmarked message");
  });

  it("forks through the selected message and switches after persistence", async () => {
    const conversation = {
      ...emptyChatConversation(),
      messages: [message],
      revision: 2,
      title: "Source chat",
    };
    const { actions, calls, dependencies } = createActions({ "/repo\nsource": conversation });

    await actions.forkFromMessage(message);

    expect(dependencies.createCheckpoint).toHaveBeenCalledWith("/repo", "Fork from Source chat");
    expect(dependencies.persistSessions).toHaveBeenCalledWith(expect.objectContaining({
      "/other": [otherSession],
      "/repo": expect.arrayContaining([expect.objectContaining({ parentSessionId: "source" })]),
    }));
    expect(dependencies.persistBrowserUrl).toHaveBeenCalledWith(
      "/repo", expect.stringMatching(/^session-/), "http://localhost:5173",
    );
    expect(calls.slice(-4)).toEqual(["state", "sessions", "browser", "switch"]);
    expect(dependencies.setNotice).toHaveBeenCalledWith("Forked Source chat");
  });
});
