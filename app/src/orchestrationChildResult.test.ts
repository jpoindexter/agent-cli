import { describe, expect, it, vi } from "vitest";
import type { ChatConversation } from "./chatConversation";
import { executeOrchestrationChildResult } from "./orchestrationChildResult";
import type { ProjectSession } from "./workspaceState";

const session = (returnedAt?: number): ProjectSession => ({
  id: "child",
  orchestration: {
    approvalMode: "ask",
    budgetSeconds: 60,
    count: 2,
    dispatchId: "dispatch",
    index: 0,
    parentSessionId: "parent",
    provider: "codex",
    returnedAt,
    targets: [],
    task: "Inspect",
    worktreeMode: "shared",
  },
  status: "exited",
  title: "Child one",
  updatedAt: 1,
});

const conversation: ChatConversation = {
  messages: [
    { id: "a1", role: "assistant", text: "Earlier", timestamp: 1 },
    { id: "u1", role: "user", text: "More", timestamp: 2 },
    { id: "a2", role: "assistant", text: "Final result", timestamp: 3 },
  ],
  provider: "codex",
  revision: 1,
  runStatus: "complete",
  updatedAt: 3,
};

const createWorkflow = (childSession = session(), childConversation: ChatConversation | undefined = conversation) => ({
  childConversation,
  now: () => 1234,
  projectPath: "/repo",
  returnResult: vi.fn(),
  session: childSession,
  setNotice: vi.fn(),
  updateSessionMetadata: vi.fn(async () => undefined),
});

describe("executeOrchestrationChildResult", () => {
  it("does nothing when the child result was already returned", async () => {
    const workflow = createWorkflow(session(99));

    const returned = await executeOrchestrationChildResult(workflow);

    expect(returned).toBe(false);
    expect(workflow.returnResult).not.toHaveBeenCalled();
  });

  it("shows a notice when the child has no assistant result", async () => {
    const workflow = createWorkflow(session(), { ...conversation, messages: [] });

    const returned = await executeOrchestrationChildResult(workflow);

    expect(returned).toBe(false);
    expect(workflow.setNotice).toHaveBeenCalledWith("This child has no assistant result yet");
    expect(workflow.updateSessionMetadata).not.toHaveBeenCalled();
  });

  it("returns the latest assistant result and stamps the child metadata", async () => {
    const workflow = createWorkflow();

    const returned = await executeOrchestrationChildResult(workflow);

    expect(returned).toBe(true);
    expect(workflow.returnResult).toHaveBeenCalledWith({
      itemId: "dispatch:child:result",
      parentSessionId: "parent",
      text: "Final result",
      title: "Child one result",
    });
    expect(workflow.updateSessionMetadata).toHaveBeenCalledWith(expect.objectContaining({ returnedAt: 1234 }));
    expect(workflow.setNotice).toHaveBeenCalledWith("Returned Child one to its parent chat");
  });
});
