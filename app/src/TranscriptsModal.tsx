import type { KeyboardEvent, PointerEvent } from "react";

import { AppIcon } from "./icons";
import { transcriptTimeLabel, transcriptsForSession, type PaneTranscript } from "./paneTranscripts";

type TranscriptsModalProps = {
  activeTranscriptId: string | null;
  onClose: () => void;
  onSelect: (transcriptId: string) => void;
  open: boolean;
  projectId: string | null;
  projectSessionId: string | null;
  transcripts: PaneTranscript[];
};

const TranscriptNavigation = ({ activeId, onSelect, transcripts }: {
  activeId: string | null;
  onSelect: (transcriptId: string) => void;
  transcripts: PaneTranscript[];
}) => (
  <nav className="settings-modal__nav" aria-label="Saved transcripts">
    {transcripts.length === 0 ? (
      <div className="settings-modal__empty">No saved terminal transcripts for this chat yet.</div>
    ) : transcripts.map((transcript) => (
      <button key={transcript.id} className={`settings-modal__nav-row ${activeId === transcript.id ? "settings-modal__nav-row--active" : ""}`} type="button" onClick={() => onSelect(transcript.id)}>
        <AppIcon name="file" />
        <span>{`${transcript.paneLabel} · ${transcriptTimeLabel(transcript.savedAt, Date.now())}`}</span>
      </button>
    ))}
  </nav>
);

export const TranscriptsModal = ({ activeTranscriptId, onClose, onSelect, open, projectId, projectSessionId, transcripts }: TranscriptsModalProps) => {
  if (!open) return null;
  const sessionTranscripts = projectId && projectSessionId ? transcriptsForSession(transcripts, projectId, projectSessionId) : [];
  const active = sessionTranscripts.find((transcript) => transcript.id === activeTranscriptId) ?? sessionTranscripts[0] ?? null;
  const closeFromBackdrop = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };
  const closeFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    onClose();
  };
  return (
    <div className="command-palette-backdrop" role="presentation" onPointerDown={closeFromBackdrop} onKeyDown={closeFromKeyboard}>
      <div className="transcripts-modal" role="dialog" aria-modal="true" aria-label="Saved transcripts">
        <header className="settings-modal__head">
          <strong>Transcripts</strong>
          <button className="settings-modal__close" type="button" aria-label="Close transcripts" onClick={onClose}><AppIcon name="close" /></button>
        </header>
        <div className="settings-modal__grid">
          <TranscriptNavigation activeId={active?.id ?? null} onSelect={onSelect} transcripts={sessionTranscripts} />
          <div className="settings-modal__content">
            {active ? <pre className="transcripts-modal__body" aria-label={`Transcript from ${active.paneLabel}`}>{active.text}</pre> : null}
          </div>
        </div>
      </div>
    </div>
  );
};
