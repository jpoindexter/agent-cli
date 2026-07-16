import { useState } from "react";
import { addPaneTranscript, buildPaneTranscript, type PaneTranscript } from "./paneTranscripts";
import { terminalPaneLabelForDisplay } from "./terminalPane";

type TranscriptPane = {
  label?: string | null;
  profile: { label: string };
};

type PaneTranscriptControllerOptions = {
  saveStore: () => void;
  setStoreValue: (key: string, value: unknown) => void;
};

export function usePaneTranscriptController(options: PaneTranscriptControllerOptions) {
  const [paneTranscripts, setPaneTranscripts] = useState<PaneTranscript[]>([]);
  const [transcriptsOpen, setTranscriptsOpen] = useState(false);
  const [openTranscriptId, setOpenTranscriptId] = useState<string | null>(null);
  const persistPaneTranscript = (
    projectId: string,
    projectSessionId: string,
    pane: TranscriptPane,
    paneIndex: number,
    text: string,
    savedAt: number,
  ) => {
    const transcript = buildPaneTranscript({
      id: `transcript-${savedAt.toString(36)}-${Math.max(0, paneIndex)}`,
      projectId,
      projectSessionId,
      paneLabel: terminalPaneLabelForDisplay(pane.label, pane.profile.label, paneIndex),
      profileLabel: pane.profile.label,
      savedAt,
      text,
    });
    setPaneTranscripts((current) => {
      const next = addPaneTranscript(current, transcript);
      options.setStoreValue("paneTranscripts", next);
      options.saveStore();
      return next;
    });
  };
  return {
    openTranscriptId, paneTranscripts, persistPaneTranscript, setOpenTranscriptId,
    setPaneTranscripts, setTranscriptsOpen, transcriptsOpen,
  };
}
