type EditorSaveErrorProps = {
  message: string;
  recoveryError: string | null;
  saving: boolean;
  canOpenExternally: boolean;
  onRetry: () => void;
  onOpenExternally: () => void;
};

export function EditorSaveError({
  message,
  recoveryError,
  saving,
  canOpenExternally,
  onRetry,
  onOpenExternally,
}: EditorSaveErrorProps) {
  return (
    <div className="editor-error" role="alert">
      <div className="editor-error__title">Save failed</div>
      <div className="editor-error__body">{message}</div>
      {recoveryError ? <div className="editor-error__recovery">{recoveryError}</div> : null}
      <div className="editor-error__actions">
        <button className="editor-error__button" type="button" disabled={saving} onClick={onRetry}>
          {saving ? "Retrying" : "Retry"}
        </button>
        {canOpenExternally ? (
          <button className="editor-error__button" type="button" onClick={onOpenExternally}>
            Open externally
          </button>
        ) : null}
      </div>
    </div>
  );
}
