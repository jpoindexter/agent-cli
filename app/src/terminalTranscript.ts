type TerminalCell = { t?: string };

type TerminalSnapshot = {
  cols: number;
  rows: number;
  cells: TerminalCell[];
};

export const terminalSnapshotText = (snapshot: TerminalSnapshot) =>
  Array.from({ length: snapshot.rows }, (_row, y) =>
    snapshot.cells
      .slice(y * snapshot.cols, y * snapshot.cols + snapshot.cols)
      .map((cell) => cell?.t ?? " ")
      .join("")
      .trimEnd(),
  ).join("\n").trimEnd();
