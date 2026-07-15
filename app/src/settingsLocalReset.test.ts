import { describe, expect, it, vi } from "vitest";
import type { AiConnectionSettings } from "./connectionSettings";
import { connectionSecretKeys, resetSettingsLocalData } from "./settingsLocalReset";

const settings: AiConnectionSettings = {
  environmentByProject: {
    "/repo": [
      { id: "plain", name: "NODE_ENV", secret: false, value: "test" },
      { id: "token", name: "API_TOKEN", secret: true, value: "" },
    ],
  },
  mcpServers: [{
    args: [], authMode: "bearer", enabled: true, id: "bearer", name: "Bearer",
    oauthClientId: "", oauthIssuer: "", oauthScopes: [], target: "mcp", transport: "stdio",
  }, {
    args: [], authMode: "oauth", enabled: true, id: "oauth", name: "OAuth",
    oauthClientId: "client", oauthIssuer: "", oauthScopes: [], target: "https://mcp.test", transport: "http",
  }],
  providerModels: { claude: "", codex: "", gemini: "" },
};

describe("settings local reset", () => {
  it("enumerates every provider, authenticated MCP, and secret environment key", () => {
    expect(connectionSecretKeys(settings)).toEqual([
      "provider:codex:api-key",
      "provider:gemini:api-key",
      "provider:claude:api-key",
      "mcp:bearer:bearer",
      "mcp:oauth:oauth-tokens",
      "mcp:oauth:oauth-client-secret",
      "environment:token",
    ]);
  });

  it("does nothing when destructive reset confirmation is declined", async () => {
    const clearStore = vi.fn();
    const result = await resetSettingsLocalData({
      clearStore,
      confirmReset: async () => false,
      deleteSecret: vi.fn(),
      reload: vi.fn(),
      resetDurableChats: vi.fn(),
      resetNativeState: vi.fn(),
      settings,
    });

    expect(result).toBe(false);
    expect(clearStore).not.toHaveBeenCalled();
  });

  it("clears secrets and stores before reloading after confirmation", async () => {
    const calls: string[] = [];
    const result = await resetSettingsLocalData({
      clearStore: async () => { calls.push("store"); },
      confirmReset: async () => true,
      deleteSecret: async (key) => { calls.push(`secret:${key}`); },
      reload: () => { calls.push("reload"); },
      resetDurableChats: async () => { calls.push("chats"); },
      resetNativeState: async () => { calls.push("native"); },
      settings,
    });

    expect(result).toBe(true);
    expect(calls.slice(0, 7).every((call) => call.startsWith("secret:"))).toBe(true);
    expect(calls.slice(7)).toEqual(["store", "chats", "native", "reload"]);
  });
});
