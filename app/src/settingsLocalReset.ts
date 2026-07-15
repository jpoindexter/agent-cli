import {
  CONNECTION_PROVIDER_IDS,
  environmentSecretKey,
  mcpOauthClientSecretKey,
  mcpOauthTokenKey,
  mcpSecretKey,
  providerSecretKey,
  type AiConnectionSettings,
} from "./connectionSettings";

export const connectionSecretKeys = (settings: AiConnectionSettings) => [
  ...CONNECTION_PROVIDER_IDS.map(providerSecretKey),
  ...settings.mcpServers.filter((server) => server.authMode === "bearer").map((server) => mcpSecretKey(server.id)),
  ...settings.mcpServers.filter((server) => server.authMode === "oauth")
    .flatMap((server) => [mcpOauthTokenKey(server.id), mcpOauthClientSecretKey(server.id)]),
  ...Object.values(settings.environmentByProject).flat()
    .filter((variable) => variable.secret).map((variable) => environmentSecretKey(variable.id)),
];

type SettingsLocalResetWorkflow = {
  clearStore: () => Promise<unknown>;
  confirmReset: (message: string) => Promise<boolean>;
  deleteSecret: (key: string) => Promise<unknown>;
  reload: () => void;
  resetDurableChats: () => Promise<unknown>;
  resetNativeState: () => Promise<unknown>;
  settings: AiConnectionSettings;
};

export const resetSettingsLocalData = async (workflow: SettingsLocalResetWorkflow) => {
  const confirmed = await workflow.confirmReset(
    "Reset all local data? This clears saved projects, chats, transcripts, layout, and local state files. This cannot be undone.",
  );
  if (!confirmed) return false;
  await Promise.all(connectionSecretKeys(workflow.settings).map((key) =>
    workflow.deleteSecret(key).catch(() => undefined)
  ));
  await workflow.clearStore();
  await workflow.resetDurableChats();
  await workflow.resetNativeState().catch(() => undefined);
  workflow.reload();
  return true;
};
