import {
  connectionEnvironmentInputs,
  mcpOauthClientSecretKey,
  mcpOauthTokenKey,
  type AiConnectionSettings,
  type ConnectionEnvironmentInput,
  type ConnectionTargetStatus,
  type McpOAuthStart,
  type McpOAuthStatus,
  type McpServerConfig,
} from "./connectionSettings";

type RecordStatus = (serverId: string, status: McpOAuthStatus) => void;

export const probeSettingsMcpServer = ({
  probe,
  server,
  settings,
  workspacePath,
}: {
  probe: (input: { request: McpServerConfig & { environment: ConnectionEnvironmentInput[] } }) => Promise<ConnectionTargetStatus>;
  server: McpServerConfig;
  settings: AiConnectionSettings;
  workspacePath: string;
}) => probe({
  request: { ...server, environment: connectionEnvironmentInputs(settings, workspacePath) },
});

export const beginSettingsMcpOAuth = async ({
  recordStatus,
  server,
  start,
}: {
  recordStatus: RecordStatus;
  server: McpServerConfig;
  start: (input: { request: Pick<McpServerConfig, "id" | "target" | "oauthIssuer" | "oauthClientId" | "oauthScopes"> }) => Promise<McpOAuthStart>;
}) => {
  const result = await start({ request: {
    id: server.id,
    target: server.target,
    oauthIssuer: server.oauthIssuer,
    oauthClientId: server.oauthClientId,
    oauthScopes: server.oauthScopes,
  } });
  recordStatus(server.id, { serverId: server.id, state: "pending", message: result.message });
  return result;
};

export const disconnectSettingsMcpOAuth = async ({
  clearSecretPresence,
  disconnect,
  recordStatus,
  server,
}: {
  clearSecretPresence: (keys: string[]) => void;
  disconnect: (input: { serverId: string }) => Promise<McpOAuthStatus>;
  recordStatus: RecordStatus;
  server: McpServerConfig;
}) => {
  const status = await disconnect({ serverId: server.id });
  recordStatus(server.id, status);
  clearSecretPresence([mcpOauthTokenKey(server.id), mcpOauthClientSecretKey(server.id)]);
  return status;
};
