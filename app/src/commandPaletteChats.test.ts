import { describe, expect, it, vi } from "vitest";
import { buildChatPaletteCommands } from "./commandPaletteChats";

const createInput = () => ({
  activeRun: false,
  activeSessionId: "one",
  onOpenSearchResult: vi.fn(),
  onOpenSession: vi.fn(),
  onParallel: vi.fn(),
  openProjects: [{ path: "/repo", status: "running" as const }],
  projectSessions: {
    "/repo": [{
      archived: true,
      id: "one",
      pinnedAt: 9,
      status: "running" as const,
      title: "Pinned task",
      updatedAt: 1,
    }],
  },
  searchResults: [{
    archived: false,
    bookmarked: true,
    chatId: "/repo\none",
    messageId: "m1",
    pinned: true,
    projectName: "repo",
    projectPath: "/repo",
    role: "assistant" as const,
    sessionId: "one",
    snippet: "Result text",
    timestamp: 2,
    title: "Pinned task",
  }, {
    archived: false,
    bookmarked: false,
    chatId: "/repo\none",
    pinned: true,
    projectName: "repo",
    projectPath: "/repo",
    role: "title" as const,
    sessionId: "one",
    snippet: "Pinned task",
    timestamp: 1,
    title: "Pinned task",
  }],
  workspacePath: "/repo",
});

describe("buildChatPaletteCommands", () => {
  it("builds project and message commands with persisted chat metadata", () => {
    const input = createInput();
    const commands = buildChatPaletteCommands(input);
    const projectChat = commands.find((command) => command.id === "chat./repo.one");
    const message = commands.find((command) => command.id === "chat-message./repo\none.m1");

    expect(projectChat).toMatchObject({ detail: "repo · Archived", icon: "pin", source: "chats" });
    expect(message).toMatchObject({ detail: "repo · Result text", icon: "bookmark", source: "chats" });
    expect(commands.filter((command) => command.id.startsWith("chat-message."))).toHaveLength(1);
    projectChat?.run();
    message?.run();
    expect(input.onOpenSession).toHaveBeenCalledWith("/repo", "one");
    expect(input.onOpenSearchResult).toHaveBeenCalledWith(input.searchResults[0]);
  });

  it("enables parallel launch only with an idle active workspace session", () => {
    const input = createInput();
    const enabled = buildChatPaletteCommands(input).find((command) => command.id === "chat.parallel");
    const disabled = buildChatPaletteCommands({ ...input, activeRun: true })
      .find((command) => command.id === "chat.parallel");

    expect(enabled?.disabled).toBe(false);
    enabled?.run();
    expect(input.onParallel).toHaveBeenCalledOnce();
    expect(disabled?.disabled).toBe(true);
  });
});
