import type { MouseEvent } from "react";

import type { ParsedDiff } from "./diffView";
import { gitStatusLabel, type GitStatusFile } from "./fileGitStatus";

export type EditorDiffReview = {
  file: GitStatusFile;
  parsed: ParsedDiff;
  response: { diff: string; path: string; source: string };
};

export type EditorDiffViewProps = {
  canOpenFile: boolean;
  error: string | null;
  loading: boolean;
  review: EditorDiffReview | null;
  onContextMenu: (event: MouseEvent<HTMLDivElement>) => void;
  onOpenFile: (line?: number) => void;
};

export function EditorDiffView(props: EditorDiffViewProps) {
  const review = props.review;
  return (
    <div className="diff-view" aria-label="Diff review" onContextMenu={props.onContextMenu}>
      {props.loading ? <div className="diff-empty">Loading diff…</div> : null}
      {props.error ? (
        <div className="editor-error editor-error--inline">
          <div className="editor-error__title">Diff failed</div>
          <div className="editor-error__body">{props.error}</div>
        </div>
      ) : null}
      {review && !props.loading ? (
        <>
          <div className="diff-view__header">
            <div><div className="diff-view__title">{review.response.path}</div><div className="diff-view__meta">{gitStatusLabel(review.file)} · {review.response.source}</div></div>
            <div className="diff-view__summary" aria-label="Diff summary"><span className="diff-view__additions">+{review.parsed.additions}</span><span className="diff-view__deletions">-{review.parsed.deletions}</span></div>
          </div>
          {review.parsed.lines.length === 0 ? <div className="diff-empty">No diff for this file.</div> : (
            <div className="diff-view__body" role="table" aria-label={`Diff for ${review.response.path}`}>
              {review.parsed.lines.map((line) => (
                <div className={`diff-line diff-line--${line.kind}`} role="row" key={line.id}>
                  <span className="diff-line__number" aria-label={line.oldLine == null ? "No old line" : `Old line ${line.oldLine}`}>{line.oldLine ?? ""}</span>
                  <span className="diff-line__number" aria-label={line.newLine == null ? "No new line" : `New line ${line.newLine}`}>{line.newLine ?? ""}</span>
                  {line.kind === "hunk" ? <button className="diff-line__jump" type="button" disabled={!props.canOpenFile || line.hunkNewStart == null} title={props.canOpenFile ? "Open file at hunk" : "File cannot be opened from this diff"} onClick={() => props.onOpenFile(line.hunkNewStart ?? undefined)}>{line.text}</button> : <code className="diff-line__code">{line.text || " "}</code>}
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
