import type { UtilityTrayMode } from "./BottomUtilityTabs";
import type { LaunchProfile } from "./launchProfiles";
import type { AgentSurfaceMode } from "./useShellLayout";

type SurfaceModeUpdate = AgentSurfaceMode | ((current: AgentSurfaceMode) => AgentSurfaceMode);

type UtilityTrayControlsOptions = {
  closeSettings: () => void;
  createTerminalPane: (profile: LaunchProfile) => Promise<boolean>;
  defaultProfile: () => LaunchProfile;
  getRoot: () => string | null;
  getSessionId: (root: string | null) => string | null;
  getSurfaceMode: () => AgentSurfaceMode;
  getTrayMode: () => UtilityTrayMode;
  hasTerminalPanes: (root: string, sessionId: string) => boolean;
  pickWorkspace: (options: { openTerminal?: boolean }) => Promise<boolean>;
  resolveProfile: (id: string) => LaunchProfile;
  setSurfaceMode: (mode: SurfaceModeUpdate) => void;
  setTrayMode: (mode: UtilityTrayMode) => void;
};

const toggleRawTerminal = async (options: UtilityTrayControlsOptions) => {
  if (options.getSurfaceMode() === "terminal" && options.getTrayMode() === "terminal") {
    options.setSurfaceMode("chat");
    return;
  }
  const root = options.getRoot();
  if (!root) {
    options.setTrayMode("terminal");
    options.setSurfaceMode("terminal");
    await options.pickWorkspace({ openTerminal: true });
    return;
  }
  const sessionId = options.getSessionId(root);
  const hasTerminal = Boolean(root && sessionId && options.hasTerminalPanes(root, sessionId));
  if (!hasTerminal && !await options.createTerminalPane(options.defaultProfile())) return;
  options.setTrayMode("terminal");
  options.setSurfaceMode("terminal");
};

const openUtilityTray = async (options: UtilityTrayControlsOptions, mode: UtilityTrayMode) => {
  if (options.getSurfaceMode() === "terminal" && options.getTrayMode() === mode) {
    options.setSurfaceMode("chat");
    return;
  }
  if (mode === "terminal") {
    await toggleRawTerminal(options);
    return;
  }
  options.setTrayMode(mode);
  options.setSurfaceMode("terminal");
};

const openAgentConnection = async (
  options: UtilityTrayControlsOptions,
  providerId: "codex" | "gemini" | "claude",
) => {
  options.closeSettings();
  const created = await options.createTerminalPane(options.resolveProfile(providerId));
  if (!created) return;
  options.setTrayMode("terminal");
  options.setSurfaceMode("terminal");
};

export const createUtilityTrayControls = (options: UtilityTrayControlsOptions) => ({
  openAgentConnection: (providerId: "codex" | "gemini" | "claude") =>
    openAgentConnection(options, providerId),
  openUtilityTray: (mode: UtilityTrayMode) => openUtilityTray(options, mode),
  toggleRawTerminal: () => toggleRawTerminal(options),
  toggleUtilityTrayVisibility: () => {
    options.setSurfaceMode((current) => current === "terminal" ? "chat" : "terminal");
  },
});
