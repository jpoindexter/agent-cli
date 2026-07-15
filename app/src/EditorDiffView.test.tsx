import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { EditorDiffView } from "./EditorDiffView";

describe("EditorDiffView", () => {
  it("renders a diff summary and lines", () => {
    const review = { file: { path: "App.tsx", index: " ", worktree: "M" }, response: { diff: "+line", path: "App.tsx", source: "working-tree" }, parsed: { additions: 1, deletions: 0, lines: [{ id: "1", kind: "add" as const, oldLine: null, newLine: 1, text: "+line", hunkNewStart: null }] } };
    const html = renderToStaticMarkup(<EditorDiffView canOpenFile error={null} loading={false} review={review} onContextMenu={vi.fn()} onOpenFile={vi.fn()} />);
    expect(html).toContain("Diff summary");
    expect(html).toContain("+1");
    expect(html).toContain("+line");
  });

  it("renders a diff failure", () => {
    expect(renderToStaticMarkup(<EditorDiffView canOpenFile={false} error="Read failed" loading={false} review={null} onContextMenu={vi.fn()} onOpenFile={vi.fn()} />)).toContain("Read failed");
  });
});
