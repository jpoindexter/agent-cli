import type { ChatSearchViewResult } from "./chatDiscovery";
import type { SearchDialogCommand } from "./SearchCommandDialog";
import type { OpenProject, ProjectSessionsByProject } from "./workspaceState";

type ChatPaletteInput = {
  activeRun: boolean;
  activeSessionId: string | null;
  onOpenSearchResult: (result: ChatSearchViewResult) => void;
  onOpenSession: (projectPath: string, sessionId: string) => void;
  onParallel: () => void;
  openProjects: OpenProject[];
  projectSessions: ProjectSessionsByProject;
  searchResults: ChatSearchViewResult[];
  workspacePath: string | null;
};

const basename = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;

const projectChatCommands = (input: ChatPaletteInput): SearchDialogCommand[] =>
  input.openProjects.flatMap((project) => (input.projectSessions[project.path] ?? []).map((session) => ({
    id: `chat.${project.path}.${session.id}`,
    label: session.title,
    detail: `${basename(project.path)}${session.archived ? " · Archived" : ""}`,
    source: "chats" as const,
    icon: session.pinnedAt ? "pin" as const : "newChat" as const,
    keywords: ["chat", "task", "thread", project.path],
    run: () => input.onOpenSession(project.path, session.id),
  })));

const messageCommands = (input: ChatPaletteInput): SearchDialogCommand[] =>
  input.searchResults
    .filter((result) => result.role !== "title")
    .map((result) => ({
      id: `chat-message.${result.chatId}.${result.messageId ?? result.timestamp}`,
      label: result.title,
      detail: `${result.projectName} · ${result.snippet}`,
      source: "chats" as const,
      icon: result.bookmarked ? "bookmark" as const : "newChat" as const,
      keywords: ["chat", "message", "history", result.projectPath, result.snippet],
      run: () => input.onOpenSearchResult(result),
    }));

const parallelCommands = (input: ChatPaletteInput): SearchDialogCommand[] => [{
  id: "chat.parallel",
  label: "Run Parallel Child Chats",
  detail: "Preview and launch 2-8 bounded child chats",
  icon: "agent",
  disabled: !input.workspacePath || !input.activeSessionId || input.activeRun,
  keywords: ["agents", "orchestration", "parallel", "children", "dispatch"],
  run: input.onParallel,
}];

export const buildChatPaletteCommands = (input: ChatPaletteInput): SearchDialogCommand[] => [
  ...projectChatCommands(input),
  ...messageCommands(input),
  ...parallelCommands(input),
];
