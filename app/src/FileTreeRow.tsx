import type { NodeRendererProps } from "react-arborist";

import { AppIcon } from "./icons";
import type { FileTreeNode } from "./fileTreeTypes";

export function FileTreeRow({ node, style, dragHandle }: NodeRendererProps<FileTreeNode>) {
  const isDirectory = node.data.kind === "directory";
  const gitStatus = node.data.gitStatus;
  const isDeleted = gitStatus?.code === "deleted";
  const title = [node.data.path, node.data.dirty ? "Unsaved changes" : null, gitStatus ? `Git: ${gitStatus.label}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <div
      ref={dragHandle}
      style={style}
      className={`file-node ${node.isSelected ? "file-node--selected" : ""} ${gitStatus ? `file-node--git-${gitStatus.code}` : ""}`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        if (isDirectory) node.toggle();
        else if (isDeleted) node.select();
        else {
          node.select();
          node.activate();
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("file-tree-context-menu", {
          detail: { node: node.data, x: event.clientX, y: event.clientY },
        }));
      }}
    >
      <span className="file-node__twisty" aria-hidden="true">
        {isDirectory ? <AppIcon name={node.isOpen ? "chevronDown" : "chevronRight"} /> : null}
      </span>
      <span className={`file-node__icon file-node__icon--${node.data.kind}`} aria-hidden="true">
        <AppIcon name={isDirectory ? (node.isOpen ? "folderOpen" : "folder") : "file"} />
      </span>
      <span className="file-node__name" title={title}>{node.data.name}</span>
      {gitStatus ? (
        <span className={`file-node__git file-node__git--${gitStatus.code}`} aria-label={`Git status: ${gitStatus.label}`}>
          {gitStatus.token}
        </span>
      ) : null}
      {node.data.dirty ? <span className="file-node__dirty" aria-label="Unsaved changes" /> : null}
    </div>
  );
}
