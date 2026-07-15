import { useState } from "react";

import {
  discardDraftAndContinueNavigation,
  saveDraftAndContinueNavigation,
} from "./draftProtection";
import { removeEditorTab } from "./editorTabs";
import type { FileTreeNode } from "./fileTreeTypes";

export type EditorNavigationFileOptions = { focusEditor?: boolean };
export type EditorPendingNavigation =
  | { kind: "file"; file: FileTreeNode; options: EditorNavigationFileOptions }
  | { kind: "workspace"; path: string }
  | { kind: "close-project"; projectPath: string };

type EditorNavigationOptions = {
  activeFile: FileTreeNode | null;
  captureEditor: () => void;
  closeProject: (projectPath: string) => Promise<void>;
  confirmClose: (message: string) => Promise<boolean>;
  editorTabs: FileTreeNode[];
  isDirty: (path: string) => boolean;
  onActivateTab: (file: FileTreeNode) => Promise<void>;
  onRemoveTab: (path: string) => void;
  onResetAfterClose: () => void;
  openFile: (file: FileTreeNode, options: EditorNavigationFileOptions) => Promise<void>;
  openWorkspace: (path: string) => Promise<void>;
  saveEditorFile: () => Promise<boolean>;
  setEditorTabs: (tabs: FileTreeNode[]) => void;
};

const continueNavigation = async (
  options: EditorNavigationOptions,
  navigation: EditorPendingNavigation,
) => {
  if (navigation.kind === "file") {
    await options.openFile(navigation.file, navigation.options);
  } else if (navigation.kind === "workspace") {
    await options.openWorkspace(navigation.path);
  } else {
    await options.closeProject(navigation.projectPath);
  }
};

const closeTab = async (options: EditorNavigationOptions, tab: FileTreeNode) => {
  options.captureEditor();
  if (options.isDirty(tab.path) && !await options.confirmClose(`Close ${tab.name} and discard unsaved changes?`)) return;
  const activePath = options.activeFile?.path ?? null;
  const result = removeEditorTab(options.editorTabs, activePath, tab.path);
  options.setEditorTabs(result.tabs);
  options.onRemoveTab(tab.path);
  if (!result.nextActivePath) {
    options.onResetAfterClose();
    return;
  }
  if (result.nextActivePath === activePath) return;
  const nextTab = result.tabs.find((candidate) => candidate.path === result.nextActivePath);
  if (nextTab) await options.onActivateTab(nextTab);
};

export function useEditorNavigationLifecycle(options: EditorNavigationOptions) {
  const [pendingNavigation, setPendingNavigation] = useState<EditorPendingNavigation | null>(null);
  const [draftDialogError, setDraftDialogError] = useState<string | null>(null);
  const handlers = {
    pendingNavigation,
    continuePendingNavigation: (navigation: EditorPendingNavigation) => continueNavigation(options, navigation),
    setPendingNavigation,
    setDraftDialogError,
  };
  return {
    cancelNavigation: () => setPendingNavigation(null),
    closeActiveTab: () => options.activeFile ? closeTab(options, options.activeFile) : Promise.resolve(),
    closeTab: (tab: FileTreeNode) => closeTab(options, tab),
    discardAndContinue: () => discardDraftAndContinueNavigation(handlers),
    draftDialogError,
    pendingNavigation,
    requestNavigation: (navigation: EditorPendingNavigation) => {
      setDraftDialogError(null);
      setPendingNavigation(navigation);
    },
    saveAndContinue: () => saveDraftAndContinueNavigation({
      ...handlers,
      saveEditorFile: options.saveEditorFile,
    }),
  };
}
