import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { RunCardKind } from "./runCards";

export type AgentHookRequest = {
  requestId: string;
  tool: "focus_pane" | "open_file" | "create_shell" | "report_status";
  arguments: Record<string, unknown>;
  requestedBy: "agent-hook";
};

export type AgentHookStatus = { endpoint: string; configPath: string; running: boolean };
export type AgentHookReport = {
  status: string;
  detail: string;
  runCardKind: RunCardKind;
  runCardStatus: "running" | "error" | "complete";
  targets: string[];
};

type AgentHookDependencies = {
  setStatus: (status: AgentHookStatus | null) => void;
  isPaneOpen: (paneId: number) => boolean;
  focusPane: (paneId: number) => Promise<unknown>;
  getWorkspacePath: () => string | null;
  openFile: (root: string, relativePath: string) => Promise<boolean>;
  createShell: () => Promise<boolean>;
  recordReport: (report: AgentHookReport) => void;
};

const REPORT_KINDS: RunCardKind[] = ["thinking", "plan", "file", "approval", "command", "tool"];

export const normalizeAgentHookReport = (args: Record<string, unknown>): AgentHookReport => ({
  status: typeof args.status === "string" ? args.status.trim().slice(0, 160) : "",
  detail: typeof args.detail === "string" ? args.detail.trim().slice(0, 1000) : "",
  runCardKind: REPORT_KINDS.includes(args.kind as RunCardKind) ? args.kind as RunCardKind : "tool",
  runCardStatus: args.state === "running" || args.state === "error" ? args.state : "complete",
  targets: Array.isArray(args.targets)
    ? args.targets.filter((target): target is string => typeof target === "string" && Boolean(target.trim()))
      .map((target) => target.trim()).slice(0, 24)
    : [],
});

const respond = (requestId: string, ok: boolean, message: string) =>
  invoke("resolve_agent_hook_request", { requestId, ok, message }).catch(() => {});

const focusRequestedPane = async (request: AgentHookRequest, deps: AgentHookDependencies) => {
  const paneId = typeof request.arguments.paneId === "number" ? request.arguments.paneId : -1;
  if (!deps.isPaneOpen(paneId)) throw new Error("Pane is not open in the active chat.");
  await deps.focusPane(paneId);
  return `Focused pane ${paneId}.`;
};

const openRequestedFile = async (request: AgentHookRequest, deps: AgentHookDependencies) => {
  const root = deps.getWorkspacePath();
  const path = typeof request.arguments.path === "string" ? request.arguments.path.trim() : "";
  if (!root || !path || path.startsWith("/") || path.split(/[\\/]/).includes("..")) {
    throw new Error("open_file requires a workspace-relative path inside the active project.");
  }
  if (!await deps.openFile(root, path.replace(/^\.\//, ""))) throw new Error("The file-open request was denied.");
  return `Opened ${path}.`;
};

const runRequest = async (request: AgentHookRequest, deps: AgentHookDependencies) => {
  if (request.tool === "focus_pane") return focusRequestedPane(request, deps);
  if (request.tool === "open_file") return openRequestedFile(request, deps);
  if (request.tool === "create_shell") {
    if (!await deps.createShell()) throw new Error("The shell-pane request was denied or could not run.");
    return "Created a blank shell pane.";
  }
  const report = normalizeAgentHookReport(request.arguments);
  if (!report.status) throw new Error("report_status requires a status label.");
  deps.recordReport(report);
  return "Status recorded in the active chat activity log.";
};

const handleRequest = async (request: AgentHookRequest, deps: AgentHookDependencies) => {
  try {
    await respond(request.requestId, true, await runRequest(request, deps));
  } catch (error) {
    await respond(request.requestId, false, String(error));
  }
};

export const useAgentHookRequests = (deps: AgentHookDependencies) => {
  useEffect(() => {
    void invoke<AgentHookStatus>("agent_hook_status").then(deps.setStatus).catch(() => deps.setStatus(null));
    let disposed = false;
    let polling = false;
    const poll = async () => {
      if (disposed || polling) return;
      polling = true;
      try {
        const requests = await invoke<AgentHookRequest[]>("take_agent_hook_requests");
        for (const request of requests) {
          if (disposed) break;
          await handleRequest(request, deps);
        }
      } catch {
        // The next interval retries while the backend starts.
      } finally {
        polling = false;
      }
    };
    const interval = window.setInterval(() => void poll(), 250);
    void poll();
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, []);
};
