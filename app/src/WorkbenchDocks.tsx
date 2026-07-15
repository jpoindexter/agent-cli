import type { ChangeEvent, MouseEvent } from "react";

import { pathBreadcrumbs } from "./editorState";
import { gitStatusLabel, type GitStatusFile } from "./fileGitStatus";
import type { FileTreeNode } from "./fileTreeTypes";
import { AppIcon } from "./icons";

export type FilesDockProps = {
  files: FileTreeNode[];
  loading: boolean;
  error: string | null;
  query: string;
  selectedFilePath: string | null;
  workspacePath: string | null;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onOpenFile: (file: FileTreeNode) => void;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
};

export function FilesDock(props: FilesDockProps) {
  const workspaceName = props.workspacePath?.split(/[\\/]/).filter(Boolean).pop() ?? "Files";
  return (
    <section className="files-dock" aria-label="Project files">
      <div className="dock-surface__header">
        <span title={props.workspacePath ?? ""}>{workspaceName}</span>
        <div className="dock-surface__actions">
          <button type="button" disabled={!props.workspacePath} title="New file" aria-label="Create new file" onClick={props.onCreateFile}><AppIcon name="filePlus" /></button>
          <button type="button" disabled={!props.workspacePath} title="New folder" aria-label="Create new folder" onClick={props.onCreateFolder}><AppIcon name="folderPlus" /></button>
          <button type="button" disabled={!props.workspacePath} title="Refresh files" aria-label="Refresh files" onClick={props.onRefresh}><AppIcon name="reload" /></button>
        </div>
      </div>
      <label className="dock-file-filter">
        <AppIcon name="search" />
        <input aria-label="Filter files" value={props.query} placeholder="Filter files…" onChange={(event: ChangeEvent<HTMLInputElement>) => props.onQueryChange(event.currentTarget.value)} />
      </label>
      <div className="dock-file-list">
        {props.loading ? <div className="rail-status">Loading files…</div> : null}
        {props.error ? <div className="rail-status rail-status--error">{props.error}</div> : null}
        {!props.workspacePath ? <div className="rail-status">Open a folder to browse files</div> : null}
        {props.workspacePath && !props.loading && props.files.length === 0 ? <div className="rail-status">Empty folder</div> : null}
        {props.files.slice(0, 600).map((file) => (
          <button className={`dock-file-row ${props.selectedFilePath === file.path ? "dock-file-row--active" : ""}`} type="button" key={file.path} title={file.path} onClick={() => props.onOpenFile(file)}>
            <AppIcon name="file" /><span className="dock-file-row__name">{file.name}</span>
            <span className="dock-file-row__path">{pathBreadcrumbs(props.workspacePath, file.path).slice(0, -1).join(" / ")}</span>
          </button>
        ))}
        {!props.query.trim() && props.files.length > 600 ? <div className="rail-status rail-status--muted">Showing first 600 files. Use Quick Open for the full workspace.</div> : null}
      </div>
    </section>
  );
}

export type SourceControlDockProps = {
  branch: string | null;
  error: string | null;
  files: GitStatusFile[];
  isRepository: boolean | null;
  loading: boolean;
  staged: number;
  untracked: number;
  workspacePath: string | null;
  onFileContextMenu: (event: MouseEvent<HTMLButtonElement>, file: GitStatusFile) => void;
  onOpenDiff: (file: GitStatusFile) => void;
  onRefresh: () => void;
};

export function SourceControlDock(props: SourceControlDockProps) {
  return (
    <section className="git-dock" aria-label="Source control">
      <div className="dock-surface__header">
        <span>{props.branch ?? "Source Control"}</span>
        <div className="dock-surface__actions"><button type="button" disabled={!props.workspacePath || props.loading} title="Refresh source control" aria-label="Refresh source control" onClick={props.onRefresh}><AppIcon name="reload" /></button></div>
      </div>
      <div className="git-dock__summary"><span>{props.files.length} changes</span><span>{props.staged} staged</span><span>{props.untracked} untracked</span></div>
      <div className="dock-file-list">
        {props.loading ? <div className="rail-status">Reading git status…</div> : null}
        {props.error ? <div className="rail-status rail-status--error">{props.error}</div> : null}
        {!props.workspacePath ? <div className="rail-status">Open a folder to read source control</div> : null}
        {props.workspacePath && props.isRepository === false ? <div className="rail-status">This workspace is not a Git repository</div> : null}
        {props.isRepository && props.files.length === 0 ? <div className="rail-status">Working tree clean</div> : null}
        {props.files.map((file) => (
          <button className="dock-file-row" type="button" key={`${file.index}${file.worktree}${file.path}`} title={`${gitStatusLabel(file)} · ${file.path}`} onClick={() => props.onOpenDiff(file)} onContextMenu={(event) => props.onFileContextMenu(event, file)}>
            <AppIcon name={file.index === "?" ? "filePlus" : "git"} /><span className="dock-file-row__name">{file.path.split(/[\\/]/).pop()}</span><span className="dock-file-row__path">{gitStatusLabel(file)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
