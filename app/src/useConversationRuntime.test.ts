// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { defaultScopedSettings } from "./scopedSettings";
import { useConversationRuntime } from "./useConversationRuntime";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(async () => null) }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn(async () => () => {}) }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ confirm: vi.fn(async () => true) }));

const ref = <T,>(current: T) => ({ current });

const createOptions = () =>
  ({
    activeAgentSessionDescriptorRef: ref(null),
    composerWorkspace: {
      activeSessionByProject: {}, chatConversations: {}, composerHarnessBySession: {},
      composerHarnessBySessionRef: ref({}), scopedSettings: defaultScopedSettings(), scopedSettingsRef: ref(defaultScopedSettings()),
      setScopedSettings: vi.fn(),
    },
    persistence: {
      activeSessionByProject: {}, activeSessionByProjectRef: ref({}),
      projectSessions: {}, projectSessionsRef: ref({}),
    },
    profiles: {
      launchProfile: { id: "codex" },
      resolveProfile: vi.fn(() => ({ id: "codex", label: "Codex", command: "codex", args: [], useLoginShell: false })),
    },
    shellLayout: {
      setToolTrayMode: vi.fn(), setWorkbenchLayout: vi.fn(), toolTrayMode: "files", workbenchLayout: "hidden",
    },
    storeRef: ref({ save: vi.fn(async () => {}), set: vi.fn(async () => {}) }),
    workspacePath: null,
    workspacePathRef: ref(null),
  }) as unknown as Parameters<typeof useConversationRuntime>[0];

describe("useConversationRuntime", () => {
  it("composes the active chat, activity, and browser runtime bundles", () => {
    const { result } = renderHook(() => useConversationRuntime(createOptions()));

    expect(result.current.activeChat.activeComposerHarness).toBeDefined();
    expect(result.current.agentApprovalMode).toBe(result.current.activeChat.activeComposerHarness.approvalMode);
    expect(result.current.agentActivityHook.gateAppAction).toBeTypeOf("function");
    expect(result.current.browser.reload).toBeTypeOf("function");
  });
});
