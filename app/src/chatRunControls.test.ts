import { describe, expect, it, vi } from "vitest";
import { createChatRunControls } from "./chatRunControls";
import type { ChatMessage } from "./chatConversation";

const approvalMessage = (extra: Partial<ChatMessage> = {}): ChatMessage => ({
  approvalRequestId: 7, approvalRunId: "run-1", text: "Allow?", id: "m1",
  role: "tool", status: "running", timestamp: 1, ...extra,
});

const createOptions = () => ({
  getActiveRunId: vi.fn(() => "run-1" as string | undefined),
  respondApproval: vi.fn(async () => {}),
  setError: vi.fn(),
  stopRun: vi.fn(async () => {}),
});

describe("createChatRunControls", () => {
  it("stops only when a run is active and surfaces stop failures", async () => {
    const options = createOptions();
    const controls = createChatRunControls(options);

    await controls.stopActiveChatRun();
    expect(options.stopRun).toHaveBeenCalledWith("run-1");

    options.stopRun.mockRejectedValue("EPIPE");
    await controls.stopActiveChatRun();
    expect(options.setError).toHaveBeenCalledWith("EPIPE");

    options.stopRun.mockClear();
    options.getActiveRunId.mockReturnValue(undefined);
    await controls.stopActiveChatRun();
    expect(options.stopRun).not.toHaveBeenCalled();
  });

  it("answers an approval on the active run", async () => {
    const options = createOptions();
    const controls = createChatRunControls(options);

    await controls.resolveChatApproval(approvalMessage(), "accept");

    expect(options.respondApproval).toHaveBeenCalledWith({
      decision: "accept", requestId: 7, runId: "run-1",
    });
  });

  it("rejects approvals that belong to a stale run", async () => {
    const options = createOptions();
    options.getActiveRunId.mockReturnValue("run-2");
    const controls = createChatRunControls(options);

    await controls.resolveChatApproval(approvalMessage(), "decline");

    expect(options.respondApproval).not.toHaveBeenCalled();
    expect(options.setError).toHaveBeenCalledWith(
      "That approval belongs to a run that is no longer active.",
    );
  });

  it("ignores approvals without a run or request id", async () => {
    const options = createOptions();
    const controls = createChatRunControls(options);

    await controls.resolveChatApproval(
      approvalMessage({ approvalRequestId: undefined }), "accept",
    );

    expect(options.respondApproval).not.toHaveBeenCalled();
    expect(options.setError).not.toHaveBeenCalled();
  });

  it("surfaces approval transport failures", async () => {
    const options = createOptions();
    options.respondApproval.mockRejectedValue("ECONN");
    const controls = createChatRunControls(options);

    await controls.resolveChatApproval(approvalMessage(), "accept");

    expect(options.setError).toHaveBeenCalledWith("ECONN");
  });
});
