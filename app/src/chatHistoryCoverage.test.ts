import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readCssSource } from "./readCssSource";

const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const chatPalette = readFileSync(new URL("./commandPaletteChats.ts", import.meta.url), "utf8");
const chatSearch = readFileSync(new URL("./useChatSearch.ts", import.meta.url), "utf8");
const productionWiring = `${app}\n${chatPalette}\n${chatSearch}`;
const thread = [
  readFileSync(new URL("./ChatThreadSurface.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./ChatTurn.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./ChatMessageArticle.tsx", import.meta.url), "utf8"),
].join("\n");
const searchDialog = readFileSync(new URL("./SearchCommandDialog.tsx", import.meta.url), "utf8");
const css = `${readCssSource(new URL("./App.css", import.meta.url))}\n${readCssSource(new URL("./SearchCommandDialog.css", import.meta.url))}`;

describe("chat history discovery production wiring", () => {
  it("searches durable history and opens stable message targets", () => {
    expect(app).toContain("useChatSearch({ open: commandPalette.open");
    expect(chatSearch).toContain("searchDurableChatMessages(query, false, 80)");
    expect(app).toContain("openChatSearchResult(result)");
    expect(app).toContain('setFocusedChatMessageId(result.messageId ?? null)');
    expect(thread).toContain('data-message-id={message.id}');
    expect(thread).toContain("focusMessageId={focusMessageId}");
    expect(thread).toContain("focused={props.focusMessageId === message.id}");
    expect(thread).toContain('focused ? " chat-message--focused"');
  });

  it("exposes bookmark, pin, and archived-chat discovery controls", () => {
    expect(app).toContain("toggleChatMessageBookmark");
    expect(app).toContain("pinProjectSession(projectPath, session, !session.pinnedAt)");
    expect(productionWiring).toContain('session.archived ? " · Archived" : ""');
    expect(thread).toContain('aria-label={message.bookmarked ? "Remove bookmark" : "Bookmark message"}');
  });

  it("uses one centered discovery surface instead of a search drawer", () => {
    expect(searchDialog).toContain('placeholder="Search tasks or run a command"');
    expect(searchDialog).toContain('label="Tasks"');
    expect(searchDialog).toContain('label="Actions"');
    expect(productionWiring).toContain('source: "chats"');
    expect(app).not.toContain('sideDrawerMode === "search"');
    expect(css).not.toContain(".search-scope-tabs");
    expect(css).toContain(".session-row__state > .session-row__pin");
    expect(css).toContain(".chat-message--focused");
  });
});
