import { describe, expect, it, vi } from "vitest";
import { appRuntimeDialogsPropsFrom } from "./appRuntimeDialogsHost";
import { defaultComposerHarnessState } from "./composerHarness";
import { emptyChatConversation } from "./chatConversation";

const createOptions = () =>
  ({
    activeChat: {
      activeChatConversation: { ...emptyChatConversation(0), provider: null },
      activeComposerHarness: defaultComposerHarnessState("codex"),
      activeComposerProvider: "codex",
      activeSessionId: "chat",
    },
    chrome: { actionNotice: null, crashNotice: null, setActionNotice: vi.fn(), setCrashNotice: vi.fn() },
    composerSurface: { launchOrchestration: vi.fn() },
    composerWorkspace: { chatConversations: {} },
    launchError: "boom",
    orchestrationError: null,
    orchestrationLaunching: false,
    orchestrationOpen: false,
    persistence: { projectSessions: {} },
    pickWorkspace: vi.fn(),
    profiles: { changing: false, launchProfile: { id: "codex" }, switchLaunchProfile: vi.fn() },
    setOrchestrationError: vi.fn(),
    setOrchestrationOpen: vi.fn(),
    workspacePath: "/repo",
  }) as unknown as Parameters<typeof appRuntimeDialogsPropsFrom>[0];

describe("appRuntimeDialogsPropsFrom", () => {
  it("composes notices and orchestration dialog props", () => {
    const props = appRuntimeDialogsPropsFrom(createOptions());

    expect(props.notices.launchError).toBe("boom");
    expect(props.orchestration.open).toBe(false);
    expect(props.orchestration.projectPath).toBe("/repo");
  });

  it("wires the folder-open notice action through pickWorkspace", () => {
    const options = createOptions();
    const props = appRuntimeDialogsPropsFrom(options);

    props.notices.onOpenFolder();
    expect(options.pickWorkspace).toHaveBeenCalled();
  });
});
