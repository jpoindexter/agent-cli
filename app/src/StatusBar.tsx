import { AppIcon, paneStateIconName } from "./icons";
import type { TerminalPaneState } from "./terminalPane";

type StatusBarProps = {
  workspaceName: string;
  primarySurfaceState: TerminalPaneState;
  primarySurfaceLabel: string;
  primarySurfaceStatusLabel: string;
  repoLabel: string | null;
  repoTitle: string;
  onOpenRepo: () => void;
  surfaceMode: "chat" | "terminal";
  utilityLabel: string;
};

export function StatusBar({
  workspaceName,
  primarySurfaceState,
  primarySurfaceLabel,
  primarySurfaceStatusLabel,
  repoLabel,
  repoTitle,
  onOpenRepo,
  surfaceMode,
  utilityLabel,
}: StatusBarProps) {
  return (
    <footer className="status-bar" aria-label="Workspace status">
      <div className="status-bar__group status-bar__group--left">
        <span className="status-bar__item">
          <AppIcon name="workspace" />
          <span>{workspaceName}</span>
        </span>
      </div>
      <div className="status-bar__group status-bar__group--center">
        <span className="status-bar__item">
          <AppIcon name={paneStateIconName(primarySurfaceState)} />
          <span>{primarySurfaceLabel}</span>
          <span>{primarySurfaceStatusLabel}</span>
        </span>
        {repoLabel ? (
          <button className="status-bar__item status-bar__item--button" type="button" title={`${repoTitle} · Open repository`} aria-label={`${repoTitle}. Open repository`} onClick={onOpenRepo}>
            <AppIcon name="git" />
            <span>{repoLabel}</span>
          </button>
        ) : null}
      </div>
      <div className="status-bar__group status-bar__group--right">
        <span className="status-bar__item">{surfaceMode === "chat" ? "Chat" : utilityLabel}</span>
      </div>
    </footer>
  );
}
