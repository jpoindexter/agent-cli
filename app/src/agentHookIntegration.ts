import type { AgentActivityEvent } from "./agentActivity";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { terminalPaneLabelForDisplay } from "./terminalPane";
import type { AgentHookReport } from "./useAgentHookRequests";

const DEFAULT_HOOK_DETAIL = "Reported through the Keelhouse agent hook.";

type AgentHookSnapshotInput = {
  activeChatId: string | null;
  activeProjectPath: string | null;
  editorTabs: { path: string }[];
  openProjects: { path: string; status: string }[];
  panes: ManagedTerminalPane[];
  selectedFilePath: string | null;
};

export const buildAgentHookSnapshot = (input: AgentHookSnapshotInput) => ({
  activeChatId: input.activeChatId,
  activeProjectPath: input.activeProjectPath,
  openFiles: input.editorTabs.map((file) => file.path),
  panes: input.panes.map((pane, index) => ({
    cwd: pane.cwd,
    id: pane.id,
    label: terminalPaneLabelForDisplay(pane.label, pane.profile.label, index),
    state: pane.state,
  })),
  projects: input.openProjects.map((project) => ({ path: project.path, status: project.status })),
  selectedFile: input.selectedFilePath,
});

type HookActivity = Pick<AgentActivityEvent, "kind" | "label" | "status">
  & Partial<Pick<AgentActivityEvent, "detail" | "provenance" | "runCardKind" | "targets">>;

export const hookReportToActivity = (report: AgentHookReport): HookActivity => ({
  detail: report.detail || DEFAULT_HOOK_DETAIL,
  kind: report.runCardKind === "file"
    ? "file"
    : report.runCardKind === "approval" ? "approval" : "tool",
  label: report.status,
  provenance: "agent-hook",
  runCardKind: report.runCardKind,
  status: report.runCardStatus,
  targets: report.targets,
});
