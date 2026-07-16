type ContextSession = {
  title: string;
  provider: string;
  status: string;
  messages: number;
  usageTokens: number | null;
};

type ContextWorkspace = {
  path: string | null;
  branch: string | null;
  changedFiles: number;
};

type ContextTools = {
  activeFile: string | null;
  browserUrl: string | null;
};

export type WorkspaceContextDockProps = {
  session: ContextSession;
  workspace: ContextWorkspace;
  tools: ContextTools;
};

const tokenLabel = (tokens: number | null) => {
  if (tokens == null) return "Not available";
  return tokens < 1_000 ? `${tokens} tokens` : `${(tokens / 1_000).toFixed(1)}k tokens`;
};

const changeLabel = (count: number) => count === 1 ? "1 change" : `${count} changes`;

const ContextSection = ({ title, rows }: { title: string; rows: Array<[string, string]> }) => (
  <section className="workspace-context-dock__section">
    <h3>{title}</h3>
    <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd title={value}>{value}</dd></div>)}</dl>
  </section>
);

export function WorkspaceContextDock(props: WorkspaceContextDockProps) {
  return (
    <aside className="workspace-context-dock" aria-label="Workspace context">
      <header><h2>Context</h2><p>Live state for this chat</p></header>
      <ContextSection title="Session" rows={[
        ["Chat", props.session.title], ["Provider", props.session.provider],
        ["Status", props.session.status], ["Messages", String(props.session.messages)],
        ["Context", tokenLabel(props.session.usageTokens)],
      ]} />
      <ContextSection title="Workspace" rows={[
        ["Repository", props.workspace.path ?? "Not available"],
        ["Branch", props.workspace.branch ?? "Not available"],
        ["Working tree", changeLabel(props.workspace.changedFiles)],
      ]} />
      <ContextSection title="Tools" rows={[
        ["Active file", props.tools.activeFile ?? "No file open"],
        ["Preview", props.tools.browserUrl ?? "No preview URL"],
      ]} />
    </aside>
  );
}
