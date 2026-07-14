import type { ChatConversationRecords, ChatMessageRole } from "./chatConversation";
import type { ProjectSessionsByProject } from "./workspaceState";

export type ChatSearchResult = {
  chatId: string;
  projectPath: string;
  sessionId: string;
  messageId?: string;
  role: ChatMessageRole | "title";
  snippet: string;
  timestamp: number;
  bookmarked: boolean;
};

export type ChatSearchViewResult = ChatSearchResult & {
  projectName: string;
  title: string;
  archived: boolean;
  pinned: boolean;
};

const basename = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;

export const chatDiscoveryKey = (result: Pick<ChatSearchResult, "chatId" | "messageId" | "role">) =>
  `${result.chatId}\n${result.messageId ?? result.role}`;

const matchingTitleResults = (
  sessionsByProject: ProjectSessionsByProject,
  conversations: ChatConversationRecords,
  normalizedQuery: string,
): ChatSearchResult[] => Object.entries(sessionsByProject).flatMap(([projectPath, sessions]) =>
  sessions
    .filter((session) => session.title.toLocaleLowerCase().includes(normalizedQuery))
    .map((session) => {
      const chatId = `${projectPath}\n${session.id}`;
      const firstMessage = conversations[chatId]?.messages.find((message) => message.role === "user");
      return {
        chatId,
        projectPath,
        sessionId: session.id,
        role: "title" as const,
        snippet: firstMessage?.text ?? session.title,
        timestamp: session.updatedAt,
        bookmarked: false,
      };
    }),
);

const uniqueResults = (results: ChatSearchResult[]) => {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = chatDiscoveryKey(result);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const enrichResult = (
  result: ChatSearchResult,
  sessionsByProject: ProjectSessionsByProject,
  conversations: ChatConversationRecords,
): ChatSearchViewResult => {
  const session = sessionsByProject[result.projectPath]?.find((item) => item.id === result.sessionId);
  const currentMessage = result.messageId
    ? conversations[result.chatId]?.messages.find((message) => message.id === result.messageId)
    : null;
  return {
    ...result,
    bookmarked: currentMessage?.bookmarked ?? result.bookmarked,
    projectName: basename(result.projectPath),
    title: session?.title ?? "Recovered chat",
    archived: Boolean(session?.archived),
    pinned: Boolean(session?.pinnedAt),
  };
};

export const mergeChatDiscoveryResults = (
  messageResults: ChatSearchResult[],
  sessionsByProject: ProjectSessionsByProject,
  conversations: ChatConversationRecords,
  query: string,
  bookmarksOnly = false,
): ChatSearchViewResult[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const titleResults = !bookmarksOnly && normalizedQuery.length >= 2
    ? matchingTitleResults(sessionsByProject, conversations, normalizedQuery)
    : [];
  return uniqueResults([...messageResults, ...titleResults])
    .map((result) => enrichResult(result, sessionsByProject, conversations))
    .sort((a, b) => Number(b.bookmarked) - Number(a.bookmarked) || b.timestamp - a.timestamp);
};
