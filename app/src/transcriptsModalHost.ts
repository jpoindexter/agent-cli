import type { ComponentProps } from "react";
import type { TranscriptsModal } from "./TranscriptsModal";

type ModalProps = ComponentProps<typeof TranscriptsModal>;

type TranscriptsController = {
  openTranscriptId: ModalProps["activeTranscriptId"];
  paneTranscripts: ModalProps["transcripts"];
  setOpenTranscriptId: ModalProps["onSelect"];
  setTranscriptsOpen: (open: boolean) => void;
  transcriptsOpen: boolean;
};

type TranscriptsScope = {
  projectId: string | null;
  projectSessionId: string | null;
};

export const transcriptsModalPropsFrom = (
  controller: TranscriptsController,
  scope: TranscriptsScope,
): ModalProps => ({
  activeTranscriptId: controller.openTranscriptId,
  onClose: () => controller.setTranscriptsOpen(false),
  onSelect: controller.setOpenTranscriptId,
  open: controller.transcriptsOpen,
  projectId: scope.projectId,
  projectSessionId: scope.projectSessionId,
  transcripts: controller.paneTranscripts,
});
