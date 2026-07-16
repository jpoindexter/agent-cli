import type { ProjectSessionsByProject } from "./workspaceStateTypes";

const MISSING_NAVIGATION_MESSAGE =
  "This chat's navigation metadata is unavailable. Open its project and try again.";

type ChatSearchTarget = {
  messageId?: string | null;
  projectPath: string;
  sessionId: string;
};

type ChatSearchNavigationOptions = {
  focusMessage: (messageId: string | null) => void;
  getSessions: () => ProjectSessionsByProject;
  setError: (message: string | null) => void;
  showArchived: () => void;
  showProjectsDrawer: () => void;
  switchSession: (projectPath: string, sessionId: string) => Promise<unknown>;
};

export const createChatSearchNavigation = (options: ChatSearchNavigationOptions) =>
  async (result: ChatSearchTarget) => {
    const session = options.getSessions()[result.projectPath]
      ?.find((item) => item.id === result.sessionId);
    if (!session) {
      options.setError(MISSING_NAVIGATION_MESSAGE);
      return;
    }
    if (session.archived) options.showArchived();
    await options.switchSession(result.projectPath, result.sessionId);
    options.focusMessage(result.messageId ?? null);
    options.showProjectsDrawer();
  };
