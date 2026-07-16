import type { ComponentProps } from "react";
import type { DraftNavigationDialog } from "./DraftNavigationDialog";
import type { FileTreeNode } from "./fileTreeTypes";

type DialogProps = ComponentProps<typeof DraftNavigationDialog>;

type DraftNavigationInput = {
  cancel: DialogProps["onCancel"];
  discard: () => Promise<unknown>;
  error: string | null;
  hasPendingNavigation: boolean;
  save: () => Promise<unknown>;
  saving: boolean;
  selectedFile: FileTreeNode | null;
};

export const draftNavigationPropsFrom = (input: DraftNavigationInput): DialogProps | null => {
  if (!input.hasPendingNavigation || !input.selectedFile) return null;
  return {
    error: input.error,
    fileName: input.selectedFile.name,
    onCancel: input.cancel,
    onDiscard: () => void input.discard(),
    onSave: () => void input.save(),
    saving: input.saving,
  };
};
