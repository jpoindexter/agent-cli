import { appNoticesPropsFrom } from "./appNoticesHost";
import type { AppRuntimeDialogsProps } from "./AppRuntimeDialogs";
import { LAUNCH_PROFILES } from "./launchProfiles";
import { deriveOrchestrationDialogState, orchestrationDialogPropsFrom } from "./orchestrationDialogState";
import type { useConversationRuntime } from "./useConversationRuntime";
import type { useWorkspaceDomain } from "./useWorkspaceDomain";

type ConversationRuntime = ReturnType<typeof useConversationRuntime>;
type WorkspaceDomain = ReturnType<typeof useWorkspaceDomain>;
type Notices = Parameters<typeof appNoticesPropsFrom>[0];

type AppRuntimeDialogsInput = {
  activeChat: ConversationRuntime["activeChat"];
  chrome: Notices["chrome"];
  composerSurface: { launchOrchestration: Parameters<typeof orchestrationDialogPropsFrom>[0]["launch"] };
  composerWorkspace: WorkspaceDomain["composerWorkspace"];
  launchError: string | null;
  orchestrationError: string | null;
  orchestrationLaunching: boolean;
  orchestrationOpen: boolean;
  persistence: WorkspaceDomain["persistence"];
  pickWorkspace: () => Promise<unknown>;
  profiles: WorkspaceDomain["profiles"];
  setOrchestrationError: (error: string | null) => void;
  setOrchestrationOpen: (open: boolean) => void;
  workspacePath: string | null;
};

export const appRuntimeDialogsPropsFrom = (input: AppRuntimeDialogsInput): AppRuntimeDialogsProps => ({
  notices: appNoticesPropsFrom({
    chrome: input.chrome,
    launchError: input.launchError,
    openFolder: () => input.pickWorkspace(),
    profiles: {
      changing: input.profiles.changing,
      launchProfile: input.profiles.launchProfile,
      profilesList: LAUNCH_PROFILES,
      switchLaunchProfile: input.profiles.switchLaunchProfile,
    },
  }),
  orchestration: orchestrationDialogPropsFrom({
    activeProvider: input.activeChat.activeComposerProvider,
    approvalMode: input.activeChat.activeComposerHarness.approvalMode,
    conversationProvider: input.activeChat.activeChatConversation.provider,
    derived: deriveOrchestrationDialogState({
      activeSessionId: input.activeChat.activeSessionId, conversations: input.composerWorkspace.chatConversations,
      sessions: input.persistence.projectSessions, workspacePath: input.workspacePath,
    }),
    error: input.orchestrationError,
    launch: input.composerSurface.launchOrchestration,
    launching: input.orchestrationLaunching,
    open: input.orchestrationOpen,
    setError: input.setOrchestrationError,
    setOpen: input.setOrchestrationOpen,
    workspacePath: input.workspacePath,
  }),
});
