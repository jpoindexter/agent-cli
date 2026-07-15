import type { MouseEvent } from "react";

import type { FileTreeNode } from "./fileTreeTypes";
import { AppIcon } from "./icons";
import { shortcutTitle } from "./shortcuts";

type DiffTab = { absolutePath: string; hasDiff: boolean; path: string };

export type EditorChromeProps = {
  activeFileMissing: boolean;
  breadcrumbs: string[];
  canCopyDiff: boolean;
  canDiscardDiff: boolean;
  canOpenDiff: boolean;
  canStageDiff: boolean;
  canUnstageDiff: boolean;
  cursorColumn: number;
  cursorLine: number;
  diff: DiffTab | null;
  diffError: string | null;
  diffLoading: boolean;
  editorBytesLabel: string;
  editorDirty: boolean;
  editorLanguage: string;
  editorLoading: boolean;
  editorSaving: boolean;
  selectedFile: FileTreeNode | null;
  tabs: FileTreeNode[];
  tabIsDirty: (path: string) => boolean;
  onCloseDiff: () => void;
  onCloseTab: (tab: FileTreeNode) => void;
  onCopyDiff: () => void;
  onDiscardDiff: () => void;
  onFind: () => void;
  onOpenDiff: () => void;
  onSave: () => void;
  onSelectTab: (tab: FileTreeNode) => void;
  onStageDiff: () => void;
  onTabContextMenu: (event: MouseEvent<HTMLDivElement>, tab: FileTreeNode) => void;
  onUnstageDiff: () => void;
};

const basename = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;

function EditorTabs({ props }: { props: EditorChromeProps }) {
  const hasDiff = Boolean(props.diff || props.diffLoading || props.diffError);
  return (
    <div className="editor-tabs" role="tablist" aria-label="Open files">
      {hasDiff ? (
        <div className="editor-tab editor-tab--active editor-tab--diff" title={props.diff?.path ?? props.diffError ?? "Loading diff"}>
          <button className="editor-tab__activate" type="button" role="tab" aria-selected="true" aria-label={props.diff ? `Diff for ${props.diff.path}` : "Diff review"}><span className="editor-tab__name">{props.diff ? `Diff: ${basename(props.diff.path)}` : "Diff review"}</span></button>
          <button className="editor-tab__close" type="button" aria-label="Close diff review" title="Close diff review" onPointerDown={(event) => { if (event.button === 0) { event.preventDefault(); event.stopPropagation(); props.onCloseDiff(); } }}><AppIcon name="close" /></button>
        </div>
      ) : null}
      {props.tabs.map((tab) => {
        const active = props.selectedFile?.path === tab.path;
        const dirty = props.tabIsDirty(tab.path);
        return (
          <div className={`editor-tab ${dirty ? "editor-tab--dirty" : ""} ${active ? "editor-tab--active" : ""}`} title={tab.path} key={tab.path} onContextMenu={(event) => props.onTabContextMenu(event, tab)}>
            <button className="editor-tab__activate" type="button" role="tab" aria-selected={active} aria-label={`${tab.name}${dirty ? ", unsaved changes" : ""}`} onPointerDown={(event) => { if (event.button === 0) { event.preventDefault(); props.onSelectTab(tab); } }}><span className="editor-tab__name">{tab.name}</span>{dirty ? <span className="editor-tab__dirty" aria-label="Unsaved changes" /> : null}</button>
            <button className="editor-tab__close" type="button" aria-label={`Close ${tab.name}`} title={shortcutTitle("editor.close-tab", `Close ${tab.name}`)} onPointerDown={(event) => { if (event.button === 0) { event.preventDefault(); event.stopPropagation(); props.onCloseTab(tab); } }}><AppIcon name="close" /></button>
          </div>
        );
      })}
      {props.tabs.length === 0 && !hasDiff ? <div className="editor-tab editor-tab--empty"><span className="editor-tab__name">No file open</span></div> : null}
    </div>
  );
}

function DiffActions({ props }: { props: EditorChromeProps }) {
  return (
    <div className="editor-actions editor-actions--diff">
      <button className="editor-command" type="button" disabled={!props.diff || !props.canStageDiff || props.diffLoading} title="Stage file" onClick={props.onStageDiff}><AppIcon name="git" /><span>Stage</span></button>
      <button className="editor-command" type="button" disabled={!props.diff || !props.canUnstageDiff || props.diffLoading} title="Unstage file" onClick={props.onUnstageDiff}><AppIcon name="git" /><span>Unstage</span></button>
      <button className="editor-command editor-command--danger" type="button" disabled={!props.diff || !props.canDiscardDiff || props.diffLoading} title="Discard unstaged changes" onClick={props.onDiscardDiff}><AppIcon name="error" /><span>Discard</span></button>
      <button className="editor-command" type="button" disabled={!props.canCopyDiff} title="Copy shown diff" onClick={props.onCopyDiff}><AppIcon name="copy" /><span>Copy</span></button>
      <button className="editor-command" type="button" disabled={!props.diff || !props.canOpenDiff} title={props.canOpenDiff ? "Open file" : "File cannot be opened from this diff"} onClick={props.onOpenDiff}><AppIcon name="file" /></button>
      <button className="editor-command" type="button" title="Close diff review" onClick={props.onCloseDiff}><AppIcon name="close" /></button>
    </div>
  );
}

function FileActions({ props }: { props: EditorChromeProps }) {
  if (!props.selectedFile) return null;
  return (
    <div className="editor-actions">
      {props.activeFileMissing ? <span className="editor-badge editor-badge--warn">Missing from tree</span> : null}
      <span className="editor-meta">{props.editorLanguage}</span><span className="editor-meta">{props.editorBytesLabel}</span>
      <span className="editor-meta">Ln {props.cursorLine}, Col {props.cursorColumn}</span>
      <span className="editor-status" title={props.selectedFile.path}>{props.editorLoading ? "Loading" : props.editorDirty ? "Unsaved" : "Saved"}</span>
      <button className="editor-command" type="button" disabled={props.editorLoading} title={shortcutTitle("editor.find", "Find and replace")} onClick={props.onFind}><AppIcon name="search" /><span>Find</span></button>
      <button className="editor-save" type="button" disabled={!props.editorDirty || props.editorSaving || props.editorLoading} title={shortcutTitle("editor.save", "Save")} onClick={props.onSave}><AppIcon name={props.editorSaving ? "loading" : "save"} /><span>{props.editorSaving ? "Saving" : "Save"}</span></button>
    </div>
  );
}

function Pathbar({ breadcrumbs, title, diff }: { breadcrumbs: string[]; title: string; diff: boolean }) {
  return (
    <nav className="editor-pathbar" aria-label={diff ? "Diff file path" : "Active file path"} title={title}>
      {breadcrumbs.map((part, index) => <span className="editor-crumb" key={`${part}-${index}`}>{index > 0 ? <span className="editor-crumb__separator">/</span> : null}<span className={index === breadcrumbs.length - 1 ? "editor-crumb__current" : ""}>{part}</span></span>)}
    </nav>
  );
}

export function EditorChrome(props: EditorChromeProps) {
  const hasDiff = Boolean(props.diff || props.diffLoading || props.diffError);
  return (
    <>
      <div className="editor-tabbar"><EditorTabs props={props} />{hasDiff ? <DiffActions props={props} /> : <FileActions props={props} />}</div>
      {props.diff ? <Pathbar breadcrumbs={props.breadcrumbs} title={props.diff.absolutePath} diff /> : props.selectedFile ? <Pathbar breadcrumbs={props.breadcrumbs} title={props.selectedFile.path} diff={false} /> : null}
    </>
  );
}
