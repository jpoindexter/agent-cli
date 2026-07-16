import { describe, expect, it, vi } from "vitest";
import { emptyChatConversation } from "./chatConversationMutations";
import { deriveOrchestrationDialogState, orchestrationDialogPropsFrom } from "./orchestrationDialogState";
import type { ProjectSession } from "./workspaceStateTypes";

const session = (id: string, title: string): ProjectSession => ({
  id, status: "running", title, updatedAt: 1,
});

describe("deriveOrchestrationDialogState", () => {
  it("counts active runs across every conversation and names the parent chat", () => {
    const state = deriveOrchestrationDialogState({
      activeSessionId: "b",
      conversations: {
        "/repo\na": { ...emptyChatConversation(1), activeRunId: "r1" },
        "/repo\nb": emptyChatConversation(1),
        "/other\nc": { ...emptyChatConversation(1), activeRunId: "r2" },
      },
      sessions: { "/repo": [session("a", "First"), session("b", "Second")] },
      workspacePath: "/repo",
    });

    expect(state).toEqual({ activeRunCount: 2, parentTitle: "Second" });
  });

  it("falls back to the default title without a matching session", () => {
    const state = deriveOrchestrationDialogState({
      activeSessionId: "missing",
      conversations: {},
      sessions: {},
      workspacePath: null,
    });

    expect(state).toEqual({ activeRunCount: 0, parentTitle: "Current chat" });
  });
});

describe("orchestrationDialogPropsFrom", () => {
  const base = () => ({
    activeProvider: null as "codex" | null,
    approvalMode: "ask" as const,
    conversationProvider: "codex" as const,
    derived: { activeRunCount: 1, parentTitle: "Parent" },
    error: null as string | null,
    launch: vi.fn(async () => {}),
    launching: false,
    open: true,
    setError: vi.fn(),
    setOpen: vi.fn(),
    workspacePath: "/repo" as string | null,
  });

  it("falls back to the conversation provider and closes cleanly", () => {
    const input = base();
    const props = orchestrationDialogPropsFrom(input);

    expect(props.provider).toBe("codex");
    expect(props.projectPath).toBe("/repo");

    props.onClose();
    expect(input.setOpen).toHaveBeenCalledWith(false);
    expect(input.setError).toHaveBeenCalledWith(null);
  });

  it("refuses to close while a launch is in flight", () => {
    const input = base();
    input.launching = true;
    const props = orchestrationDialogPropsFrom(input);

    props.onClose();
    expect(input.setOpen).not.toHaveBeenCalled();
  });
});
