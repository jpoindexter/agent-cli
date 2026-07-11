import { describe, expect, it } from "vitest";

import { terminalSnapshotText } from "./terminalTranscript";

const snapshot = (lines: string[]) => {
  const cols = Math.max(1, ...lines.map((line) => line.length));
  return {
    cols,
    rows: lines.length,
    cells: lines.flatMap((line) => Array.from({ length: cols }, (_, index) => ({ t: line[index] ?? " " }))),
  };
};

describe("terminal-backed agent run transcript", () => {
  it("turns the selected terminal viewport into readable live output", () => {
    expect(terminalSnapshotText(snapshot(["Working", "", "Done"]))).toBe("Working\n\nDone");
  });

  it("removes terminal padding without collapsing meaningful blank lines", () => {
    expect(terminalSnapshotText(snapshot(["  prompt  ", "", "   "]))).toBe("  prompt");
  });

  it("returns an empty string for an empty terminal viewport", () => {
    expect(terminalSnapshotText(snapshot(["", ""]))).toBe("");
  });
});
