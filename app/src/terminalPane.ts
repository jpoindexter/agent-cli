export type TerminalPaneState = "idle" | "starting" | "running" | "exited" | "error";

export const terminalPaneStateLabel = (state: TerminalPaneState, exitCode: number | null) => {
  if (state === "idle") return "No pane";
  if (state === "starting") return "Starting";
  if (state === "running") return "Running";
  if (state === "exited") return exitCode == null ? "Exited" : `Exited ${exitCode}`;
  return "Error";
};

export const terminalPaneCwdLabel = (path: string | null) => {
  if (!path) return "No cwd";
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
};
