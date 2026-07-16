import type {
  AiConnectionSettings,
  ConnectionEnvironmentInput,
  ConnectionTargetStatus,
  McpOAuthStart,
  McpOAuthStatus,
  McpServerConfig,
} from "./connectionSettings";
import { resetSettingsLocalData } from "./settingsLocalReset";
import {
  beginSettingsMcpOAuth,
  disconnectSettingsMcpOAuth,
  probeSettingsMcpServer,
} from "./settingsMcpActions";

type SettingsConnectionActionsControllerOptions = {
  applySettings: (settings: AiConnectionSettings) => void;
  clearSecretPresence: (keys: string[]) => void;
  clearStore: () => Promise<unknown>;
  confirmReset: (message: string) => Promise<boolean>;
  deleteSecret: (key: string) => Promise<unknown>;
  disconnectOAuth: (input: { serverId: string }) => Promise<McpOAuthStatus>;
  getSettings: () => AiConnectionSettings;
  getWorkspacePath: () => string | null;
  probe: (input: {
    request: McpServerConfig & { environment: ConnectionEnvironmentInput[] };
  }) => Promise<ConnectionTargetStatus>;
  persistSettings: (settings: AiConnectionSettings) => Promise<unknown>;
  recordOAuthStatus: (serverId: string, status: McpOAuthStatus) => void;
  reload: () => void;
  resetDurableChats: () => Promise<unknown>;
  resetNativeState: () => Promise<unknown>;
  startOAuth: (input: {
    request: Pick<McpServerConfig, "id" | "target" | "oauthIssuer" | "oauthClientId" | "oauthScopes">;
  }) => Promise<McpOAuthStart>;
};

export const createSettingsConnectionActionsController = (
  options: SettingsConnectionActionsControllerOptions,
) => ({
  beginMcpOAuth: (server: McpServerConfig) => beginSettingsMcpOAuth({
    recordStatus: options.recordOAuthStatus,
    server,
    start: options.startOAuth,
  }),
  disconnectMcpOAuth: (server: McpServerConfig) => disconnectSettingsMcpOAuth({
    clearSecretPresence: options.clearSecretPresence,
    disconnect: options.disconnectOAuth,
    recordStatus: options.recordOAuthStatus,
    server,
  }),
  saveSettings: async (settings: AiConnectionSettings) => {
    options.applySettings(settings);
    await options.persistSettings(settings);
  },
  resetLocalData: () => resetSettingsLocalData({
    clearStore: options.clearStore,
    confirmReset: options.confirmReset,
    deleteSecret: options.deleteSecret,
    reload: options.reload,
    resetDurableChats: options.resetDurableChats,
    resetNativeState: options.resetNativeState,
    settings: options.getSettings(),
  }),
  validateConnectionTarget: (server: McpServerConfig) => probeSettingsMcpServer({
    probe: options.probe,
    server,
    settings: options.getSettings(),
    workspacePath: options.getWorkspacePath() ?? "",
  }),
});
