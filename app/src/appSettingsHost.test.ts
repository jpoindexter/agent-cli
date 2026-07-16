import { describe, expect, it, vi } from "vitest";
import { settingsModalHandlersFrom } from "./appSettingsHost";

const createBundles = () => ({
  connectionActions: {
    beginMcpOAuth: vi.fn(async () => ({
      authorizationUrl: "", clientId: "", message: "",
    })),
    disconnectMcpOAuth: vi.fn(async () => ({
      message: "", serverId: "s", state: "idle" as const,
    })),
    resetLocalData: vi.fn(async () => {}),
    validateConnectionTarget: vi.fn(async () => ({} as never)),
  },
  handlers: {
    close: vi.fn(),
    deleteConnectionSecret: vi.fn(async () => {}),
    openAgentConnection: vi.fn(async () => {}),
    openSourceControlLink: vi.fn(async () => {}),
    refreshAgentConnections: vi.fn(),
    resetLayout: vi.fn(),
    saveConnectionSecret: vi.fn(async () => {}),
    saveConnectionSettings: vi.fn(async () => {}),
    setLayout: vi.fn(),
    setTrayMode: vi.fn(),
  },
  preferenceActions: {
    onCommandPaletteSourceChange: vi.fn(),
    onKeybindingOverrideChange: vi.fn(),
    onNotificationsChange: vi.fn(),
    onThemeChange: vi.fn(),
  },
  profilesController: {
    addCustomProfile: vi.fn(async () => {}),
    removeCustomProfile: vi.fn(async () => {}),
  },
  scopedActions: {
    onApprovalModeChange: vi.fn(),
    onBrowserUrlCommit: vi.fn(),
    onProfileChange: vi.fn(),
    onScopedSettingReset: vi.fn(),
  },
});

describe("settingsModalHandlersFrom", () => {
  it("routes scoped, preference, and connection actions straight through", () => {
    const bundles = createBundles();
    const handlers = settingsModalHandlersFrom(bundles);

    expect(handlers.onApprovalModeChange).toBe(bundles.scopedActions.onApprovalModeChange);
    expect(handlers.onThemeChange).toBe(bundles.preferenceActions.onThemeChange);
    expect(handlers.onValidateConnectionTarget).toBe(bundles.connectionActions.validateConnectionTarget);
    expect(handlers.onClose).toBe(bundles.handlers.close);
  });

  it("void-wraps the async profile and reset flows", () => {
    const bundles = createBundles();
    const handlers = settingsModalHandlersFrom(bundles);

    handlers.onAddCustomTerminalProfile("Build", "make dev");
    expect(bundles.profilesController.addCustomProfile).toHaveBeenCalledWith("Build", "make dev");

    handlers.onRemoveCustomTerminalProfile("p1");
    expect(bundles.profilesController.removeCustomProfile).toHaveBeenCalledWith("p1");

    handlers.onResetLocalData();
    expect(bundles.connectionActions.resetLocalData).toHaveBeenCalled();

    handlers.onOpenAgentConnection("codex");
    expect(bundles.handlers.openAgentConnection).toHaveBeenCalledWith("codex");
  });
});
