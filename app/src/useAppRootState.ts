import { useRef, useState } from "react";
import { load } from "@tauri-apps/plugin-store";
import type { TreeApi } from "react-arborist";
import type { AgentSessionHandleDescriptor } from "./agentSessionHandle";
import {
  DEFAULT_AI_CONNECTION_SETTINGS, type AiConnectionSettings,
} from "./connectionSettings";
import type { ContextMenuItem } from "./ContextMenu";
import type { FileTreeNode } from "./fileTreeTypes";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { createRenderPerfState } from "./renderPerf";
import type { SelectionRange } from "./selection";
import type { AgentHookStatus } from "./useAgentHookRequests";
import { useWorktreeLabelRequest } from "./useWorktreeLabelRequest";

export const useAppRootState = <TSnapshot,>() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imeInputRef = useRef<HTMLTextAreaElement>(null);
  const terminalHostRef = useRef<HTMLDivElement>(null);
  const railBodyRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<TreeApi<FileTreeNode> | undefined>(undefined);
  const workspacePathRef = useRef<string | null>(null);
  const storeRef = useRef<Awaited<ReturnType<typeof load>> | null>(null);
  const aiConnectionSettingsRef = useRef<AiConnectionSettings>(DEFAULT_AI_CONNECTION_SETTINGS);
  const activeAgentSessionDescriptorRef = useRef<AgentSessionHandleDescriptor | null>(null);
  const fileNodeContextMenuItemsRef = useRef<(node: FileTreeNode) => ContextMenuItem[]>(() => []);
  const activeSessionLookupRef = useRef<(root: string | null) => string | null>(() => null);
  const persistPaneLayoutRef = useRef<(root: string, sessionId: string, panes: ManagedTerminalPane[]) => void>(() => {});
  const latest = useRef<TSnapshot | null>(null);
  const frame = useRef<number | null>(null);
  const metrics = useRef({ cw: 9, ch: 19 });
  const renderPerfRef = useRef(createRenderPerfState());
  const ipcSampleCounter = useRef(0);
  const selection = useRef<SelectionRange | null>(null);
  const selecting = useRef(false);
  const [agentHookStatus, setAgentHookStatus] = useState<AgentHookStatus | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [projectCreationOpen, setProjectCreationOpen] = useState(false);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  return {
    activeAgentSessionDescriptorRef, activeSessionLookupRef, agentHookStatus,
    aiConnectionSettingsRef, canvasRef,
    fileNodeContextMenuItemsRef, frame, imeInputRef, ipcSampleCounter, latest, launchError, metrics,
    persistPaneLayoutRef, projectCreationOpen, projectSwitcherOpen, railBodyRef, renderPerfRef,
    selection, selecting, setAgentHookStatus, setLaunchError, setProjectCreationOpen, setProjectSwitcherOpen,
    setWorkspacePath, storeRef, terminalHostRef, treeRef, workspacePath, workspacePathRef,
    worktreeLabelRequest: useWorktreeLabelRequest(),
  };
};
