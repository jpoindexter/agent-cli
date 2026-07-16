import { describe, expect, it, vi } from "vitest";
import { DEFAULT_AI_CONNECTION_SETTINGS, type McpServerConfig } from "./connectionSettings";
import { createSettingsConnectionActionsController } from "./settingsConnectionActionsController";

const server: McpServerConfig = {
  args: [], authMode: "oauth", enabled: true, id: "linear", name: "Linear",
  oauthClientId: "client", oauthIssuer: "https://auth.example", oauthScopes: ["read"],
  target: "https://mcp.example", transport: "http",
};

const createOptions = () => ({
  applySettings: vi.fn(),
  persistSettings: vi.fn(async () => {}),
  clearSecretPresence: vi.fn(),
  clearStore: vi.fn(async () => {}),
  confirmReset: vi.fn(async () => true),
  deleteSecret: vi.fn(async () => {}),
  disconnectOAuth: vi.fn(async () => ({
    message: "disconnected", serverId: "linear", state: "idle" as const,
  })),
  getSettings: vi.fn(() => structuredClone(DEFAULT_AI_CONNECTION_SETTINGS)),
  getWorkspacePath: vi.fn(() => "/repo" as string | null),
  probe: vi.fn(async () => ({ ok: true } as never)),
  recordOAuthStatus: vi.fn(),
  reload: vi.fn(),
  resetDurableChats: vi.fn(async () => {}),
  resetNativeState: vi.fn(async () => {}),
  startOAuth: vi.fn(async () => ({
    authorizationUrl: "https://auth.example/authorize", clientId: "client", message: "opened",
  })),
});

describe("createSettingsConnectionActionsController", () => {
  it("probes a connection target with workspace-scoped environment", async () => {
    const options = createOptions();
    const actions = createSettingsConnectionActionsController(options);

    await actions.validateConnectionTarget(server);

    expect(options.probe).toHaveBeenCalledWith({
      request: expect.objectContaining({ id: "linear", environment: [] }),
    });
  });

  it("starts oauth and records the pending status", async () => {
    const options = createOptions();
    const actions = createSettingsConnectionActionsController(options);

    await actions.beginMcpOAuth(server);

    expect(options.startOAuth).toHaveBeenCalledWith({
      request: expect.objectContaining({ id: "linear", oauthClientId: "client" }),
    });
    expect(options.recordOAuthStatus).toHaveBeenCalledWith("linear", expect.objectContaining({ state: "pending" }));
  });

  it("disconnects oauth, records status, and clears secret presence", async () => {
    const options = createOptions();
    const actions = createSettingsConnectionActionsController(options);

    await actions.disconnectMcpOAuth(server);

    expect(options.disconnectOAuth).toHaveBeenCalledWith({ serverId: "linear" });
    expect(options.recordOAuthStatus).toHaveBeenCalledWith("linear", expect.objectContaining({ state: "idle" }));
    expect(options.clearSecretPresence).toHaveBeenCalledWith([
      "mcp:linear:oauth-tokens", "mcp:linear:oauth-client-secret",
    ]);
  });


  it("applies and persists updated connection settings in order", async () => {
    const options = createOptions();
    const actions = createSettingsConnectionActionsController(options);
    const next = structuredClone(DEFAULT_AI_CONNECTION_SETTINGS);

    await actions.saveSettings(next);

    expect(options.applySettings).toHaveBeenCalledWith(next);
    expect(options.persistSettings).toHaveBeenCalledWith(next);
    expect(options.applySettings.mock.invocationCallOrder[0])
      .toBeLessThan(options.persistSettings.mock.invocationCallOrder[0]);
  });

  it("resets local data through the confirmed reset workflow", async () => {
    const options = createOptions();
    const actions = createSettingsConnectionActionsController(options);

    await actions.resetLocalData();

    expect(options.confirmReset).toHaveBeenCalled();
    expect(options.clearStore).toHaveBeenCalled();
    expect(options.resetNativeState).toHaveBeenCalled();
    expect(options.reload).toHaveBeenCalled();
  });
});
