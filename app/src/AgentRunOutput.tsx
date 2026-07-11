type AgentRunOutputProps = {
  hasPane: boolean;
  transcript: string;
};

export function AgentRunOutput({ hasPane, transcript }: AgentRunOutputProps) {
  return (
    <section className="agent-run-output" aria-label="Live agent output">
      <header className="agent-run-output__header">
        <strong>Live agent output</strong>
        <span>Terminal-backed</span>
      </header>
      {transcript ? (
        <pre className="agent-run-output__transcript" aria-live="polite">{transcript}</pre>
      ) : (
        <div className="agent-run-output__empty">
          <strong>{hasPane ? "Waiting for agent output" : "Start or select an agent"}</strong>
          <span>{hasPane ? "Send a prompt below or switch to the raw terminal." : "Choose a project session, then start Codex, Gemini, Claude, or a shell."}</span>
        </div>
      )}
    </section>
  );
}
