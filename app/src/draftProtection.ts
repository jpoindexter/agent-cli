export type DraftNavigationTarget =
  | { kind: "file"; path: string }
  | { kind: "workspace"; path: string };

export const shouldPromptForDirtyDraft = (
  editorDirty: boolean,
  currentFilePath: string | null,
  target: DraftNavigationTarget,
) => {
  if (!editorDirty) return false;
  return target.kind !== "file" || target.path !== currentFilePath;
};
