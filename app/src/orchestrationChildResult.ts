import type { ChatConversation } from "./chatConversation";
import type { ProjectSession, ProjectSessionOrchestration } from "./workspaceState";

type ReturnedChildResult = {
  itemId: string;
  parentSessionId: string;
  text: string;
  title: string;
};

type OrchestrationChildResultWorkflow = {
  childConversation: ChatConversation | undefined;
  now: () => number;
  returnResult: (result: ReturnedChildResult) => void;
  session: ProjectSession;
  setNotice: (notice: string) => void;
  updateSessionMetadata: (metadata: ProjectSessionOrchestration) => Promise<unknown>;
};

export const executeOrchestrationChildResult = async ({
  childConversation,
  now,
  returnResult,
  session,
  setNotice,
  updateSessionMetadata,
}: OrchestrationChildResultWorkflow) => {
  const metadata = session.orchestration;
  if (!metadata || metadata.returnedAt) return false;
  const result = [...(childConversation?.messages ?? [])]
    .reverse()
    .find((message) => message.role === "assistant");
  if (!result) {
    setNotice("This child has no assistant result yet");
    return false;
  }
  returnResult({
    itemId: `${metadata.dispatchId}:${session.id}:result`,
    parentSessionId: metadata.parentSessionId,
    text: result.text,
    title: `${session.title} result`,
  });
  await updateSessionMetadata({ ...metadata, returnedAt: now() });
  setNotice(`Returned ${session.title} to its parent chat`);
  return true;
};
