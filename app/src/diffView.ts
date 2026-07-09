export type DiffLineKind = "meta" | "hunk" | "add" | "delete" | "context";

export type DiffLine = {
  id: string;
  kind: DiffLineKind;
  text: string;
  oldLine: number | null;
  newLine: number | null;
  hunkNewStart: number | null;
};

export type ParsedDiff = {
  additions: number;
  deletions: number;
  lines: DiffLine[];
};

const hunkPattern = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export const parseUnifiedDiff = (diff: string): ParsedDiff => {
  let oldLine = 0;
  let newLine = 0;
  let hunkNewStart: number | null = null;
  let additions = 0;
  let deletions = 0;
  const rawLines = diff.split("\n");
  if (rawLines[rawLines.length - 1] === "") rawLines.pop();
  const lines = rawLines.map((text, index) => {
    const hunk = text.match(hunkPattern);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      hunkNewStart = newLine;
      return { id: `${index}:hunk`, kind: "hunk" as const, text, oldLine, newLine, hunkNewStart };
    }
    if (text.startsWith("diff --git") || text.startsWith("index ") || text.startsWith("--- ") || text.startsWith("+++ ") || text.startsWith("new file mode") || text.startsWith("deleted file mode")) {
      return { id: `${index}:meta`, kind: "meta" as const, text, oldLine: null, newLine: null, hunkNewStart: null };
    }
    if (text.startsWith("+")) {
      const line = { id: `${index}:add`, kind: "add" as const, text, oldLine: null, newLine, hunkNewStart: null };
      newLine += 1;
      additions += 1;
      return line;
    }
    if (text.startsWith("-")) {
      const line = { id: `${index}:delete`, kind: "delete" as const, text, oldLine, newLine: null, hunkNewStart: null };
      oldLine += 1;
      deletions += 1;
      return line;
    }
    if (text.startsWith(" ")) {
      const line = { id: `${index}:context`, kind: "context" as const, text, oldLine, newLine, hunkNewStart: null };
      oldLine += 1;
      newLine += 1;
      return line;
    }
    return { id: `${index}:meta`, kind: "meta" as const, text, oldLine: null, newLine: null, hunkNewStart: null };
  });
  return {
    additions,
    deletions,
    lines,
  };
};
