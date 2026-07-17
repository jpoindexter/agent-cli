import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { buildAgentHookSnapshot, hookReportToActivity } from "./agentHookIntegration";
import { defaultTerminalLaunchProfile } from "./launchProfiles";
import { fileTreeNodeFromPath } from "./fileTreeTypes";
import type { createTerminalSurfaceActions } from "./terminalSurfaceController";
import type { useConversationRuntime } from "./useConversationRuntime";
import { useAgentHookRequests, type AgentHookStatus } from "./useAgentHookRequests";
import type { useWorkspaceDomain } from "./useWorkspaceDomain";
import type { wireEditorFileWorkflow } from "./editorFileWorkflowSurface";

type ConversationRuntime = ReturnType<typeof useConversationRuntime>;
type WorkspaceDomain = ReturnType<typeof useWorkspaceDomain>;

type AgentHookRuntimeInput = {
  activeChat: ConversationRuntime["activeChat"];
  agentActivityHook: ConversationRuntime["agentActivityHook"];
  editorFileWorkflow: ReturnType<typeof wireEditorFileWorkflow>;
  editorSession: WorkspaceDomain["editorSession"];
  persistence: WorkspaceDomain["persistence"];
  setStatus: (status: AgentHookStatus | null) => void;
  terminal: WorkspaceDomain["terminal"];
  terminalSurface: ReturnType<typeof createTerminalSurfaceActions>;
  workspacePath: string | null;
  workspacePathRef: { current: string | null };
};

export const useAgentHookRuntime = (input: AgentHookRuntimeInput) => {
  useEffect(() => {
    void invoke("update_agent_hook_snapshot", {
      snapshot: buildAgentHookSnapshot({
        activeChatId: input.activeChat.activeSessionId,
        activeProjectPath: input.workspacePath,
        editorTabs: input.editorSession.editorTabs,
        openProjects: input.persistence.openProjects,
        panes: input.terminal.panes,
        selectedFilePath: input.editorSession.selectedFile?.path ?? null,
      }),
    }).catch(() => {});
  }, [
    input.activeChat.activeSessionId, input.editorSession.editorTabs,
    input.persistence.openProjects, input.editorSession.selectedFile?.path,
    input.terminal.panes, input.workspacePath,
  ]);

  useAgentHookRequests({
    setStatus: input.setStatus,
    isPaneOpen: (paneId) => input.terminal.panesRef.current.some((pane) => pane.id === paneId),
    focusPane: (paneId) => input.terminalSurface.focusTerminalPane(paneId, "agent"),
    getWorkspacePath: () => input.workspacePathRef.current,
    openFile: (root, path) => input.editorFileWorkflow.requestOpen(
      fileTreeNodeFromPath(`${root}/${path}`, "file"), { focusEditor: true }, "agent",
    ),
    createShell: () => input.terminalSurface.createTerminalPane(defaultTerminalLaunchProfile(), "agent"),
    recordReport: (report) => input.agentActivityHook.recordAgentActivity(
      input.agentActivityHook.activeChatActivityHandle(), hookReportToActivity(report),
    ),
  });
};
