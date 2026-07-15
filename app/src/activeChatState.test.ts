import { describe, expect, it } from "vitest";
import { emptyChatConversation } from "./chatConversation";
import { defaultComposerHarnessState } from "./composerHarness";
import type { LaunchProfile } from "./launchProfiles";
import { defaultScopedSettings, setScopedSetting } from "./scopedSettings";
import { deriveActiveChatState } from "./activeChatState";

const profiles: Record<string, LaunchProfile> = {
  claude: { id: "claude", label: "Claude CLI", command: "claude", args: [], useLoginShell: true },
  codex: { id: "codex", label: "Codex CLI", command: "codex", args: [], useLoginShell: true },
};

describe("deriveActiveChatState", () => {
  it("combines the stored harness with effective scoped settings", () => {
    const workspacePath = "/repo";
    const sessionId = "session-1";
    const key = `${workspacePath}\n${sessionId}`;
    const projectSettings = setScopedSetting(
      setScopedSetting(defaultScopedSettings(), "project", "agentProfileId", "claude", workspacePath, sessionId),
      "project", "approvalMode", "fullAccess", workspacePath, sessionId,
    );
    const storedHarness = { ...defaultComposerHarnessState("codex"), draft: "Keep this draft" };
    const conversation = { ...emptyChatConversation(10), provider: "claude" as const };

    const result = deriveActiveChatState({
      activeSessionByProject: { [workspacePath]: sessionId },
      chatConversations: { [key]: conversation },
      composerHarnessBySession: { [key]: storedHarness },
      launchProfileId: "codex",
      projectSessions: { [workspacePath]: [{ id: sessionId, title: "Chat", status: "running", updatedAt: 10 }] },
      resolveLaunchProfile: (id) => profiles[id],
      scopedSettings: projectSettings,
      workspacePath,
    });

    expect(result.activeSessionId).toBe(sessionId);
    expect(result.activeComposerHarnessKey).toBe(key);
    expect(result.activeComposerHarness).toMatchObject({
      approvalMode: "fullAccess",
      draft: "Keep this draft",
      selectedProfileId: "claude",
    });
    expect(result.activeChatConversation).toBe(conversation);
    expect(result.activeComposerProvider).toBe("claude");
    expect(result.activeComposerProviderLabel).toBe("Claude");
  });

  it("returns global defaults when no workspace is active", () => {
    const result = deriveActiveChatState({
      activeSessionByProject: {},
      chatConversations: {},
      composerHarnessBySession: {},
      launchProfileId: "codex",
      projectSessions: {},
      resolveLaunchProfile: (id) => profiles[id],
      scopedSettings: defaultScopedSettings(),
      workspacePath: null,
    });

    expect(result.activeSessionId).toBeNull();
    expect(result.activeComposerHarnessKey).toBeNull();
    expect(result.activeComposerHarness.selectedProfileId).toBe("codex");
    expect(result.activeChatConversation.messages).toEqual([]);
  });
});
