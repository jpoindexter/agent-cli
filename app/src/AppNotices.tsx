import { AppIcon } from "./icons";
import { PROJECT_ENTRY_LABELS } from "./projectEntryActions";

type AppNoticesProps = {
  actionNotice: string | null;
  canUseShellProfile: boolean;
  crashNotice: string | null;
  launchError: string | null;
  onDismissAction: () => void;
  onDismissCrash: () => void;
  onOpenFolder: () => void;
  onUseShellProfile: () => void;
};

const DismissButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button className="editor-command" type="button" aria-label={label} onClick={onClick}><AppIcon name="close" /></button>
);

export const AppNotices = ({ actionNotice, canUseShellProfile, crashNotice, launchError, onDismissAction, onDismissCrash, onOpenFolder, onUseShellProfile }: AppNoticesProps) => (
  <>
    {crashNotice ? (
      <div className="crash-notice" role="status">
        <AppIcon name="reload" />
        <span>{crashNotice}</span>
        <DismissButton label="Dismiss recovery notice" onClick={onDismissCrash} />
      </div>
    ) : null}
    {actionNotice ? (
      <div className="context-action-notice" role="status">
        <AppIcon name="check" />
        <span>{actionNotice}</span>
        <DismissButton label="Dismiss action notice" onClick={onDismissAction} />
      </div>
    ) : null}
    {launchError ? (
      <div className="launch-error" role="alert">
        <span className="launch-error__message">{launchError}</span>
        <span className="launch-error__actions">
          <button className="editor-command" type="button" onClick={onOpenFolder}><AppIcon name="folderOpen" /><span>{PROJECT_ENTRY_LABELS.openProject}</span></button>
          <button className="editor-command" type="button" disabled={!canUseShellProfile} onClick={onUseShellProfile}><AppIcon name="terminal" /><span>Use Shell profile</span></button>
        </span>
      </div>
    ) : null}
  </>
);
