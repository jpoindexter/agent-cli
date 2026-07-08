type EditorSaveErrorProps = {
  message: string;
  recoveryError: string | null;
  saving: boolean;
  canOpenExternally: boolean;
  conflict: boolean;
  onRetry: () => void;
  onReload: () => void;
  onOverwrite: () => void;
  onOpenExternally: () => void;
};

export function EditorSaveError({
  message,
  recoveryError,
  saving,
  canOpenExternally,
  conflict,
  onRetry,
  onReload,
  onOverwrite,
  onOpenExternally,
}: EditorSaveErrorProps) {
  return (
    <div className="editor-error" role="alert">
      <div className="editor-error__title">Save failed</div>
      <div className="editor-error__body">{message}</div>
      {recoveryError ? <div className="editor-error__recovery">{recoveryError}</div> : null}
      <div className="editor-error__actions">
        {conflict ? (
          <>
            <button className="editor-error__button" type="button" disabled={saving} onClick={onReload}>
              Reload
            </button>
            <button className="editor-error__button" type="button" disabled={saving} onClick={onOverwrite}>
              {saving ? "Overwriting" : "Overwrite"}
            </button>
          </>
        ) : (
          <button className="editor-error__button" type="button" disabled={saving} onClick={onRetry}>
            {saving ? "Retrying" : "Retry"}
          </button>
        )}
        {canOpenExternally ? (
          <button className="editor-error__button" type="button" onClick={onOpenExternally}>
            Open externally
          </button>
        ) : null}
      </div>
    </div>
  );
}
