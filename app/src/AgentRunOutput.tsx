type AgentRunOutputProps = {
  hasPane: boolean;
  metaLabel?: string;
  transcript: string;
};

export function AgentRunOutput({ hasPane, metaLabel, transcript }: AgentRunOutputProps) {
  return (
    <section className="agent-run-output" aria-label="Agent run output">
      <header className="agent-run-output__header">
        <strong>Run</strong>
        <span>{metaLabel ? `${metaLabel} · Terminal-backed` : "Terminal-backed"}</span>
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
