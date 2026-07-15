import { describe, expect, it, vi } from "vitest";
import type { AiConnectionSettings, McpServerConfig } from "./connectionSettings";
import {
  beginSettingsMcpOAuth,
  disconnectSettingsMcpOAuth,
  probeSettingsMcpServer,
} from "./settingsMcpActions";

const server: McpServerConfig = {
  args: [],
  authMode: "oauth",
  enabled: true,
  id: "remote",
  name: "Remote",
  oauthClientId: "client",
  oauthIssuer: "https://auth.example.test",
  oauthScopes: ["tools.read"],
  target: "https://mcp.example.test",
  transport: "http",
};

const settings: AiConnectionSettings = {
  environmentByProject: {
    "/repo": [{ id: "env", name: "NODE_ENV", secret: false, value: "test" }],
  },
  mcpServers: [server],
  providerModels: { claude: "", codex: "", gemini: "" },
};

describe("settings MCP actions", () => {
  it("probes with server config and project environment inputs", async () => {
    const probe = vi.fn(async () => ({ message: "ok", ok: true }));

    await probeSettingsMcpServer({ probe, server, settings, workspacePath: "/repo" });

    expect(probe).toHaveBeenCalledWith({
      request: { ...server, environment: [{ name: "NODE_ENV", value: "test" }] },
    });
  });

  it("starts OAuth with public registration fields and records pending status", async () => {
    const recordStatus = vi.fn();
    const start = vi.fn(async () => ({
      authorizationUrl: "https://auth.example.test/authorize",
      clientId: "client",
      message: "Open browser",
    }));

    const result = await beginSettingsMcpOAuth({ recordStatus, server, start });

    expect(start).toHaveBeenCalledWith({ request: {
      id: "remote",
      target: "https://mcp.example.test",
      oauthIssuer: "https://auth.example.test",
      oauthClientId: "client",
      oauthScopes: ["tools.read"],
    } });
    expect(recordStatus).toHaveBeenCalledWith("remote", {
      message: "Open browser", serverId: "remote", state: "pending",
    });
    expect(result.authorizationUrl).toContain("/authorize");
  });

  it("disconnects OAuth and clears both stored OAuth secret indicators", async () => {
    const clearSecretPresence = vi.fn();
    const recordStatus = vi.fn();
    const disconnect = vi.fn(async () => ({ message: "Disconnected", serverId: "remote", state: "idle" as const }));

    await disconnectSettingsMcpOAuth({ clearSecretPresence, disconnect, recordStatus, server });

    expect(disconnect).toHaveBeenCalledWith({ serverId: "remote" });
    expect(recordStatus).toHaveBeenCalledWith("remote", {
      message: "Disconnected", serverId: "remote", state: "idle",
    });
    expect(clearSecretPresence).toHaveBeenCalledWith([
      "mcp:remote:oauth-tokens",
      "mcp:remote:oauth-client-secret",
    ]);
  });
});
