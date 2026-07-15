import type { MouseEvent, RefObject } from "react";
import { Tree, type TreeApi } from "react-arborist";

import { FileTreeRow } from "./FileTreeRow";
import type { FileTreeNode } from "./fileTreeTypes";
import { AppIcon } from "./icons";

export type FilesSideDrawerProps = {
  fileOpError: string | null;
  fileTree: FileTreeNode[];
  fileTreeError: string | null;
  fileTreeLoading: boolean;
  fileTreeTruncated: boolean;
  railBodyRef: RefObject<HTMLDivElement | null>;
  railHeight: number;
  selectedFileId?: string;
  treeRef: RefObject<TreeApi<FileTreeNode> | null | undefined>;
  visibleFileTree: FileTreeNode[];
  workspaceName: string | null;
  workspacePath: string | null;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onOpenFile: (file: FileTreeNode) => void;
  onOpenFolder: () => void;
  onWorkspaceContextMenu: (event: MouseEvent<HTMLButtonElement>) => void;
};

function FileTree({ props }: { props: FilesSideDrawerProps }) {
  if (!props.workspacePath || props.fileTree.length === 0) return null;
  return (
    <Tree<FileTreeNode>
      ref={props.treeRef}
      aria-label="Project files"
      data={props.visibleFileTree}
      idAccessor="id"
      childrenAccessor="children"
      rowHeight={24}
      height={props.railHeight}
      width="100%"
      indent={14}
      overscanCount={8}
      disableDrag
      disableDrop
      disableEdit
      disableMultiSelection
      selection={props.selectedFileId}
      onActivate={(node) => {
        if (node.data.kind === "directory") node.toggle();
        else if (node.data.gitStatus?.code === "deleted") node.select();
        else props.onOpenFile(node.data);
      }}
    >
      {FileTreeRow}
    </Tree>
  );
}

export function FilesSideDrawer(props: FilesSideDrawerProps) {
  const hasEmptyWorkspace = Boolean(props.workspacePath) && !props.fileTreeLoading && !props.fileTreeError && props.fileTree.length === 0;
  return (
    <>
      <div className="panel-title panel-title--with-action">
        <span>Files</span>
        <button className="rail-open-button" type="button" disabled={!props.workspacePath} title="New file" aria-label="Create new file" onClick={props.onCreateFile}>
          <AppIcon name="filePlus" /><span>File</span>
        </button>
        <button className="rail-open-button" type="button" disabled={!props.workspacePath} title="New folder" aria-label="Create new folder" onClick={props.onCreateFolder}>
          <AppIcon name="folderPlus" /><span>Folder</span>
        </button>
        <button className="rail-open-button" type="button" title="Open folder" aria-label="Open folder" onClick={props.onOpenFolder}>
          <AppIcon name="folderOpen" /><span>Open</span>
        </button>
      </div>
      <div className="rail-root" title={props.workspacePath ?? ""}>
        <button className="rail-root__button" type="button" aria-label={props.workspaceName ? `Workspace ${props.workspaceName}` : "No workspace selected"} onContextMenu={props.onWorkspaceContextMenu}>
          <AppIcon name={props.workspacePath ? "workspace" : "folderOpen"} />
          {props.workspaceName ?? "No workspace"}
        </button>
      </div>
      <div ref={props.railBodyRef} className="rail-tree">
        {props.fileTreeLoading ? <div className="rail-status">Loading…</div> : null}
        {props.fileTreeError ? <div className="rail-status rail-status--error">{props.fileTreeError}</div> : null}
        {props.fileOpError ? <div className="rail-status rail-status--error">{props.fileOpError}</div> : null}
        {hasEmptyWorkspace ? <div className="rail-status">Empty folder</div> : null}
        {!props.workspacePath ? <div className="rail-status">Open a folder</div> : null}
        <FileTree props={props} />
        {props.fileTreeTruncated ? <div className="rail-status rail-status--muted">Showing first 8000 entries</div> : null}
      </div>
    </>
  );
}
