import { chatProviderLabel, emptyChatConversation, type ChatConversationRecords } from "./chatConversation";
import { structuredChatProviderId } from "./agentConnections";
import { defaultComposerHarnessState, type ComposerHarnessRecords } from "./composerHarness";
import type { LaunchProfile } from "./launchProfiles";
import { scopedSettingView, type ScopedSettingsState } from "./scopedSettings";
import { activeProjectSessionId, type ActiveSessionByProject, type ProjectSessionsByProject } from "./workspaceState";

type ActiveChatStateInput = {
  activeSessionByProject: ActiveSessionByProject;
  chatConversations: ChatConversationRecords;
  composerHarnessBySession: ComposerHarnessRecords;
  launchProfileId: string;
  projectSessions: ProjectSessionsByProject;
  resolveLaunchProfile: (id: string) => LaunchProfile;
  scopedSettings: ScopedSettingsState;
  workspacePath: string | null;
};

export const deriveActiveChatState = (input: ActiveChatStateInput) => {
  const activeSessionId = activeProjectSessionId(
    input.activeSessionByProject, input.projectSessions, input.workspacePath,
  );
  const activeComposerHarnessKey = input.workspacePath && activeSessionId
    ? `${input.workspacePath}\n${activeSessionId}`
    : null;
  const activeAgentProfileSetting = scopedSettingView(
    input.scopedSettings, "agentProfileId", input.workspacePath, activeSessionId,
  );
  const activeApprovalSetting = scopedSettingView(
    input.scopedSettings, "approvalMode", input.workspacePath, activeSessionId,
  );
  const activeBrowserSetting = scopedSettingView(
    input.scopedSettings, "browserUrl", input.workspacePath, activeSessionId,
  );
  const storedHarness = activeComposerHarnessKey
    ? input.composerHarnessBySession[activeComposerHarnessKey]
      ?? defaultComposerHarnessState(activeAgentProfileSetting.chat?.value ?? input.launchProfileId)
    : defaultComposerHarnessState(activeAgentProfileSetting.global.value);
  const activeComposerHarness = {
    ...storedHarness,
    approvalMode: activeApprovalSetting.chat?.value ?? activeApprovalSetting.global.value,
    selectedProfileId: activeAgentProfileSetting.chat?.value ?? activeAgentProfileSetting.global.value,
  };
  const activeChatConversation = activeComposerHarnessKey
    ? input.chatConversations[activeComposerHarnessKey] ?? emptyChatConversation(0)
    : emptyChatConversation(0);
  const activeComposerProfile = input.resolveLaunchProfile(activeComposerHarness.selectedProfileId);
  const activeComposerProvider = structuredChatProviderId(activeComposerHarness.selectedProfileId);
  const activeComposerProviderLabel = activeComposerProvider
    ? chatProviderLabel(activeComposerProvider)
    : activeComposerProfile.label;
  return {
    activeAgentProfileSetting, activeApprovalSetting, activeBrowserSetting,
    activeChatConversation, activeComposerHarness, activeComposerHarnessKey,
    activeComposerProvider, activeComposerProviderLabel, activeSessionId,
  };
};
