import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

import { mcpOauthTokenKey, type McpOAuthStatus } from "./connectionSettings";

export type McpOAuthStatusSubscriber = (
  handler: (status: McpOAuthStatus) => void,
) => Promise<() => void>;

const subscribeNative: McpOAuthStatusSubscriber = (handler) =>
  listen<McpOAuthStatus>("mcp-oauth-result", (event) => handler(event.payload));

export function useMcpOAuthStatus(subscribe: McpOAuthStatusSubscriber = subscribeNative) {
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
  return { secretPresence, setSecretPresence, setStatuses, statuses };
}
