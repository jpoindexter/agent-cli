// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConnectionSettingsPanel } from "./ConnectionSettingsPanel";
import { DEFAULT_AI_CONNECTION_SETTINGS, providerSecretKey, type McpServerConfig } from "./connectionSettings";

afterEach(cleanup);

const renderPanel = (overrides: Partial<Parameters<typeof ConnectionSettingsPanel>[0]> = {}) => {
  const onChange = vi.fn();
  const onSaveSecret = vi.fn().mockResolvedValue(undefined);
  const onDeleteSecret = vi.fn().mockResolvedValue(undefined);
  const onValidateTarget = vi.fn().mockResolvedValue({ ok: true, message: "Valid" });
  const onBeginOAuth = vi.fn().mockResolvedValue({ authorizationUrl: "https://auth.example.test", clientId: "client", message: "Browser authorization opened." });
  const onDisconnectOAuth = vi.fn().mockResolvedValue({ serverId: "docs", state: "idle", message: "Disconnected" });
  render(
    <ConnectionSettingsPanel
      settings={structuredClone(DEFAULT_AI_CONNECTION_SETTINGS)}
      workspacePath="/repo"
      secretPresence={{}}
      onChange={onChange}
      onSaveSecret={onSaveSecret}
      onDeleteSecret={onDeleteSecret}
      onValidateTarget={onValidateTarget}
      onBeginOAuth={onBeginOAuth}
      onDisconnectOAuth={onDisconnectOAuth}
      oauthStatuses={{}}
      {...overrides}
    />,
  );
  return { onChange, onSaveSecret, onDeleteSecret, onValidateTarget, onBeginOAuth, onDisconnectOAuth };
};

describe("ConnectionSettingsPanel", () => {
  it("sends provider keys to the Keychain callback without adding them to settings", async () => {
    const { onChange, onSaveSecret } = renderPanel();
    fireEvent.change(screen.getByLabelText("Gemini API key"), { target: { value: "qa-secret" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Save key" })[1]);

    await waitFor(() => expect(onSaveSecret).toHaveBeenCalledWith(providerSecretKey("gemini"), "qa-secret"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("stores secret environment metadata with a blank persisted value", async () => {
    const { onChange, onSaveSecret } = renderPanel();
    fireEvent.change(screen.getByLabelText("Environment variable name"), { target: { value: "API_TOKEN" } });
    fireEvent.change(screen.getByLabelText("Environment variable value"), { target: { value: "qa-secret" } });
    fireEvent.click(screen.getByLabelText("Secret"));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(onSaveSecret).toHaveBeenCalledTimes(1));
    const next = onChange.mock.calls[0][0];
    expect(next.environmentByProject["/repo"][0]).toMatchObject({ name: "API_TOKEN", value: "", secret: true });
    expect(JSON.stringify(next)).not.toContain("qa-secret");
  });

  it("runs a real MCP health callback and renders discovered tool status", async () => {
    const mcpServer: McpServerConfig = {
      id: "docs",
      name: "Docs",
      transport: "stdio",
      target: "docs-mcp",
      args: [],
      authMode: "none",
      oauthIssuer: "",
      oauthClientId: "",
      oauthScopes: [],
      enabled: true,
    };
    const onValidateTarget = vi.fn().mockResolvedValue({
      ok: true,
      message: "Connected; discovered 3 tools.",
      protocolVersion: "2025-06-18",
      toolCount: 3,
      tools: ["search", "open", "read"],
    });
    renderPanel({
      settings: { ...structuredClone(DEFAULT_AI_CONNECTION_SETTINGS), mcpServers: [mcpServer] },
      onValidateTarget,
    });

    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    await waitFor(() => expect(onValidateTarget).toHaveBeenCalledWith(mcpServer));
    expect(await screen.findByText(/Connected; discovered 3 tools/)).toBeTruthy();
    expect(screen.getByText(/MCP 2025-06-18/)).toBeTruthy();
    expect(screen.getByText(/search, open, read/)).toBeTruthy();
  });

  it("starts MCP OAuth and persists a dynamically registered client ID", async () => {
    const mcpServer: McpServerConfig = {
      id: "docs",
      name: "Docs",
      transport: "http",
      target: "https://mcp.example.test/mcp",
      args: [],
      authMode: "oauth",
      oauthIssuer: "",
      oauthClientId: "",
      oauthScopes: ["mcp:tools"],
      enabled: true,
    };
    const settings = { ...structuredClone(DEFAULT_AI_CONNECTION_SETTINGS), mcpServers: [mcpServer] };
    const onBeginOAuth = vi.fn().mockResolvedValue({
      authorizationUrl: "https://auth.example.test/authorize",
      clientId: "registered-client",
      message: "Browser authorization opened.",
    });
    const { onChange } = renderPanel({ settings, onBeginOAuth });

    fireEvent.click(screen.getByRole("button", { name: "Authorize" }));

    await waitFor(() => expect(onBeginOAuth).toHaveBeenCalledWith(mcpServer));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0][0].mcpServers[0].oauthClientId).toBe("registered-client");
    expect(await screen.findByText(/Browser authorization opened/)).toBeTruthy();
  });
});
