const withoutKey = <T>(records: Record<string, T>, key: string) => {
  const { [key]: _removed, ...remaining } = records;
  return remaining;
};

export const planSessionScopedRecordRemoval = <
  TProjectPanes,
  TActivePane,
  TBrowserSession,
  TComposerHarness,
  TConversation,
>(input: {
  activePanes: Record<string, TActivePane>;
  browserSessionKey: string;
  browserSessions: Record<string, TBrowserSession>;
  chatSessionKey: string;
  composerHarness: Record<string, TComposerHarness>;
  contextKey: string | null;
  conversations: Record<string, TConversation>;
  projectPanes: Record<string, TProjectPanes>;
}) => ({
  activePanes: input.contextKey ? withoutKey(input.activePanes, input.contextKey) : input.activePanes,
  browserSessions: withoutKey(input.browserSessions, input.browserSessionKey),
  composerHarness: withoutKey(input.composerHarness, input.chatSessionKey),
  conversations: withoutKey(input.conversations, input.chatSessionKey),
  projectPanes: input.contextKey ? withoutKey(input.projectPanes, input.contextKey) : input.projectPanes,
});
