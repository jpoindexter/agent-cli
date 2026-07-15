import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

import {
  mcpOauthTokenKey,
  type AiConnectionSettings,
  type ConnectionSecretStatus,
  type McpOAuthStatus,
} from "./connectionSettings";
import { connectionSecretKeys } from "./settingsLocalReset";

export type McpOAuthStatusSubscriber = (
  handler: (status: McpOAuthStatus) => void,
) => Promise<() => void>;
export type ConnectionSecretServices = {
  deleteSecret: (key: string) => Promise<ConnectionSecretStatus>;
  readStatus: (key: string) => Promise<ConnectionSecretStatus>;
  saveSecret: (key: string, value: string) => Promise<ConnectionSecretStatus>;
};

const subscribeNative: McpOAuthStatusSubscriber = (handler) =>
  listen<McpOAuthStatus>("mcp-oauth-result", (event) => handler(event.payload));
const nativeSecretServices: ConnectionSecretServices = {
  deleteSecret: (key) => invoke("delete_connection_secret", { key }),
  readStatus: (key) => invoke("connection_secret_status", { key }),
  saveSecret: (key, value) => invoke("set_connection_secret", { key, value }),
};

export function useMcpOAuthStatus(
  subscribe: McpOAuthStatusSubscriber = subscribeNative,
  secretServices: ConnectionSecretServices = nativeSecretServices,
) {
  const [secretPresence, setSecretPresence] = useState<Record<string, boolean>>({});
  const [statuses, setStatuses] = useState<Record<string, McpOAuthStatus>>({});
  useEffect(() => {
    let disposed = false;
    let removeListener: (() => void) | null = null;
    void subscribe((status) => {
      setStatuses((current) => ({ ...current, [status.serverId]: status }));
      if (status.state === "connected" || status.state === "idle") {
        setSecretPresence((current) => ({
          ...current,
          [mcpOauthTokenKey(status.serverId)]: status.state === "connected",
        }));
      }
    }).then((remove) => {
      if (disposed) remove();
      else removeListener = remove;
    });
    return () => {
      disposed = true;
      removeListener?.();
    };
  }, [subscribe]);
  const refreshSecretPresence = async (settings: AiConnectionSettings) => {
    const entries = await Promise.all(connectionSecretKeys(settings).map(async (key) => {
      try {
        const status = await secretServices.readStatus(key);
        return [status.key, status.present] as const;
      } catch {
        return [key, false] as const;
      }
    }));
    setSecretPresence(Object.fromEntries(entries));
  };
  const saveSecret = async (key: string, value: string) => {
    const status = await secretServices.saveSecret(key, value);
    setSecretPresence((current) => ({ ...current, [status.key]: status.present }));
  };
  const deleteSecret = async (key: string) => {
    const status = await secretServices.deleteSecret(key);
    setSecretPresence((current) => ({ ...current, [status.key]: false }));
  };
  return {
    deleteSecret, refreshSecretPresence, saveSecret, secretPresence,
    setSecretPresence, setStatuses, statuses,
  };
}
