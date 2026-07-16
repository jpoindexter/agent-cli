import type { ComponentProps, KeyboardEvent, MouseEvent } from "react";
import { EditorChrome } from "./EditorChrome";
import { EditorCodeSurface } from "./EditorCodeSurface";
import { EditorDiffView } from "./EditorDiffView";
import type { FileTreeNode } from "./fileTreeTypes";

type ChromeProps = ComponentProps<typeof EditorChrome>;
type CodeProps = ComponentProps<typeof EditorCodeSurface>;
type DiffReview =
  (NonNullable<ComponentProps<typeof EditorDiffView>["review"]> & { absolutePath: string }) | null;

export type WorkbenchEditorSectionProps = {
  activeFileMissing: boolean;
  code: {
    conflict: CodeProps["conflict"]; error: string | null; loading: boolean;
    recoveryError: string | null; saving: boolean; text: string;
  };
  cursor: { column: number; line: number };
  diff: {
    breadcrumbs: ChromeProps["breadcrumbs"]; canDiscard: boolean; canOpenFile: boolean;
    canStage: boolean; canUnstage: boolean; error: string | null; loading: boolean;
    review: DiffReview;
  };
  editorBreadcrumbs: ChromeProps["breadcrumbs"];
  editorBytesLabel: string;
  editorDirty: boolean;
  editorLanguage: ChromeProps["editorLanguage"];
  editorLoading: boolean;
  editorSaving: boolean;
  handlers: {
    closeActiveTab: () => void;
    closeDiff: () => void;
    closeTab: (tab: FileTreeNode) => void;
    copyDiff: () => void;
    find: () => void;
    onChange: CodeProps["onChange"];
    onCreateEditor: CodeProps["onCreateEditor"];
    onUpdate: CodeProps["onUpdate"];
    openContextMenu: (kind: "diff" | "editor", event: MouseEvent) => void;
    openDiff: (line?: number | null) => void;
    openExternally: () => void;
    overwrite: () => void;
    reload: () => void;
    runDiffAction: (action: "discard" | "stage" | "unstage") => void;
    save: () => void;
    selectTab: (tab: FileTreeNode) => void;
    tabContextMenu: (event: MouseEvent, tab: FileTreeNode) => void;
  };
  selectedFile: FileTreeNode | null;
  tabIsDirty: (path: string) => boolean;
  tabs: FileTreeNode[];
};

const sectionChrome = (props: WorkbenchEditorSectionProps) => (
  <EditorChrome
    activeFileMissing={props.activeFileMissing}
    breadcrumbs={props.diff.review ? props.diff.breadcrumbs : props.editorBreadcrumbs}
    canCopyDiff={Boolean(props.diff.review?.response.diff.length)}
    canDiscardDiff={props.diff.canDiscard}
    canOpenDiff={props.diff.canOpenFile}
    canStageDiff={props.diff.canStage}
    canUnstageDiff={props.diff.canUnstage}
    cursorColumn={props.cursor.column}
    cursorLine={props.cursor.line}
    diff={props.diff.review ? {
      absolutePath: props.diff.review.absolutePath,
      hasDiff: Boolean(props.diff.review.response.diff.length),
      path: props.diff.review.response.path,
    } : null}
    diffError={props.diff.error}
    diffLoading={props.diff.loading}
    editorBytesLabel={props.editorBytesLabel}
    editorDirty={props.editorDirty}
    editorLanguage={props.editorLanguage}
    editorLoading={props.editorLoading}
    editorSaving={props.editorSaving}
    selectedFile={props.selectedFile}
    tabs={props.tabs}
    tabIsDirty={props.tabIsDirty}
    onCloseDiff={props.handlers.closeDiff}
    onCloseTab={props.handlers.closeTab}
    onCopyDiff={props.handlers.copyDiff}
    onDiscardDiff={() => props.handlers.runDiffAction("discard")}
    onFind={props.handlers.find}
    onOpenDiff={() => props.handlers.openDiff()}
    onSave={props.handlers.save}
    onSelectTab={props.handlers.selectTab}
    onTabContextMenu={props.handlers.tabContextMenu}
    onUnstageDiff={() => props.handlers.runDiffAction("unstage")}
    onStageDiff={() => props.handlers.runDiffAction("stage")}
  />
);

const sectionBody = (props: WorkbenchEditorSectionProps) => {
  if (props.diff.review || props.diff.loading || props.diff.error) {
    return (
      <EditorDiffView
        canOpenFile={props.diff.canOpenFile}
        error={props.diff.error}
        loading={props.diff.loading}
        review={props.diff.review}
        onContextMenu={(event) => props.handlers.openContextMenu("diff", event)}
        onOpenFile={(line) => props.handlers.openDiff(line)}
      />
    );
  }
  if (props.selectedFile) {
    return (
      <EditorCodeSurface
        conflict={props.code.conflict}
        error={props.code.error}
        filePath={props.selectedFile.path}
        loading={props.code.loading}
        recoveryError={props.code.recoveryError}
        saving={props.code.saving}
        value={props.code.text}
        onChange={props.handlers.onChange}
        onContextMenu={(event) => props.handlers.openContextMenu("editor", event)}
        onCreateEditor={props.handlers.onCreateEditor}
        onOpenExternally={props.handlers.openExternally}
        onOverwrite={props.handlers.overwrite}
        onReload={props.handlers.reload}
        onRetry={props.handlers.save}
        onSave={props.handlers.save}
        onUpdate={props.handlers.onUpdate}
      />
    );
  }
  return (
    <div className="editor-empty">
      <div className="editor-empty-title">Select a file</div>
      <div className="editor-empty-path">Project editor surface</div>
    </div>
  );
};

export const WorkbenchEditorSection = (props: WorkbenchEditorSectionProps) => (
  <section
    className="editor-area"
    aria-label="Editor"
    onKeyDown={(event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "w") {
        event.preventDefault();
        props.handlers.closeActiveTab();
      }
    }}
  >
    {sectionChrome(props)}
    {sectionBody(props)}
  </section>
);
