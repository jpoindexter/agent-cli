import type { AgentApprovalMode } from "./agentSessionHandle";
import type { LaunchProfile } from "./launchProfiles";
import type { QuickSettingsDrawerProps } from "./QuickSettingsDrawer";
import type { AgentSurfaceMode } from "./useShellLayout";
import type { ToolTrayMode, WorkbenchLayoutMode } from "./workbenchLayout";

type QuickSettingsInput = {
  composer: { approvalMode: AgentApprovalMode; canSetApproval: boolean };
  handlers: {
    approvalChange: (mode: AgentApprovalMode) => Promise<unknown>;
    layoutChange: (layout: WorkbenchLayoutMode) => void;
    openFolder: () => Promise<unknown>;
    refreshFiles: () => void;
    setSurfaceMode: (mode: AgentSurfaceMode) => void;
    toggleRawTerminal: () => Promise<unknown>;
    toolModeChange: (mode: ToolTrayMode) => void;
  };
  layout: {
    surfaceMode: AgentSurfaceMode;
    toolMode: ToolTrayMode;
    workbenchLayout: WorkbenchLayoutMode;
  };
  profiles: {
    allProfiles: LaunchProfile[];
    changing: boolean;
    resolveProfile: (id: string) => LaunchProfile;
    switchTerminalProfile: (profile: LaunchProfile) => Promise<unknown>;
    terminalProfile: LaunchProfile;
  };
  workspacePath: string | null;
};

export const quickSettingsDrawerPropsFrom = (
  input: QuickSettingsInput,
): QuickSettingsDrawerProps => ({
  approvalMode: input.composer.approvalMode,
  canSetApproval: input.composer.canSetApproval,
  hasWorkspace: Boolean(input.workspacePath),
  launchProfile: input.profiles.terminalProfile,
  launchProfileChanging: input.profiles.changing,
  launchProfiles: input.profiles.allProfiles,
  terminalOpen: input.layout.surfaceMode === "terminal",
  toolMode: input.layout.toolMode,
  workbenchLayout: input.layout.workbenchLayout,
  onApprovalChange: (mode) => void input.handlers.approvalChange(mode),
  onBottomTrayChange: (open) =>
    open ? void input.handlers.toggleRawTerminal() : input.handlers.setSurfaceMode("chat"),
  onLayoutChange: input.handlers.layoutChange,
  onOpenFolder: () => void input.handlers.openFolder(),
  onProfileChange: (profileId) => {
    void input.profiles.switchTerminalProfile(input.profiles.resolveProfile(profileId));
  },
  onRefreshFiles: input.handlers.refreshFiles,
  onToolModeChange: input.handlers.toolModeChange,
});
