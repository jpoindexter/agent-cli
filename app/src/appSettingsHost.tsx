import type { ComponentProps } from "react";
import { SettingsModal } from "./SettingsModal";

type ModalProps = ComponentProps<typeof SettingsModal>;

type HandlerKeys =
  | "onAddCustomTerminalProfile" | "onAiConnectionSettingsChange" | "onApprovalModeChange"
  | "onBeginMcpOAuth" | "onBrowserUrlCommit" | "onClose" | "onCommandPaletteSourceChange"
  | "onDeleteConnectionSecret" | "onDisconnectMcpOAuth" | "onKeybindingOverrideChange"
  | "onLayoutChange" | "onNotificationsChange" | "onOpenAgentConnection"
  | "onOpenSourceControlLink" | "onProfileChange" | "onRefreshAgentConnections"
  | "onRemoveCustomTerminalProfile" | "onResetLayout" | "onResetLocalData"
  | "onSaveConnectionSecret" | "onScopedSettingReset" | "onThemeChange"
  | "onTrayModeChange" | "onValidateConnectionTarget";

export type SettingsHostBundles = {
  connectionActions: {
    beginMcpOAuth: NonNullable<ModalProps["onBeginMcpOAuth"]>;
    disconnectMcpOAuth: NonNullable<ModalProps["onDisconnectMcpOAuth"]>;
    resetLocalData: () => Promise<unknown>;
    validateConnectionTarget: NonNullable<ModalProps["onValidateConnectionTarget"]>;
  };
  handlers: {
    close: () => void;
    deleteConnectionSecret: NonNullable<ModalProps["onDeleteConnectionSecret"]>;
    openAgentConnection: (providerId: "codex" | "gemini" | "claude") => Promise<unknown>;
    openSourceControlLink: (url: string) => Promise<unknown>;
    refreshAgentConnections: NonNullable<ModalProps["onRefreshAgentConnections"]>;
    resetLayout: NonNullable<ModalProps["onResetLayout"]>;
    saveConnectionSecret: NonNullable<ModalProps["onSaveConnectionSecret"]>;
    saveConnectionSettings: (
      next: Parameters<NonNullable<ModalProps["onAiConnectionSettingsChange"]>>[0],
    ) => Promise<unknown>;
    setLayout: NonNullable<ModalProps["onLayoutChange"]>;
    setTrayMode: NonNullable<ModalProps["onTrayModeChange"]>;
  };
  preferenceActions: {
    onCommandPaletteSourceChange: NonNullable<ModalProps["onCommandPaletteSourceChange"]>;
    onKeybindingOverrideChange: NonNullable<ModalProps["onKeybindingOverrideChange"]>;
    onNotificationsChange: NonNullable<ModalProps["onNotificationsChange"]>;
    onThemeChange: NonNullable<ModalProps["onThemeChange"]>;
  };
  profilesController: {
    addCustomProfile: (label: string, command: string) => Promise<unknown>;
    removeCustomProfile: (profileId: string) => Promise<unknown>;
  };
  scopedActions: {
    onApprovalModeChange: NonNullable<ModalProps["onApprovalModeChange"]>;
    onBrowserUrlCommit: NonNullable<ModalProps["onBrowserUrlCommit"]>;
    onProfileChange: NonNullable<ModalProps["onProfileChange"]>;
    onScopedSettingReset: NonNullable<ModalProps["onScopedSettingReset"]>;
  };
};

export const settingsModalHandlersFrom = (
  bundles: SettingsHostBundles,
): Required<Pick<ModalProps, HandlerKeys>> => ({
  onAddCustomTerminalProfile: (label, command) => {
    void bundles.profilesController.addCustomProfile(label, command);
  },
  onAiConnectionSettingsChange: (next) => void bundles.handlers.saveConnectionSettings(next),
  onApprovalModeChange: bundles.scopedActions.onApprovalModeChange,
  onBeginMcpOAuth: bundles.connectionActions.beginMcpOAuth,
  onBrowserUrlCommit: bundles.scopedActions.onBrowserUrlCommit,
  onClose: bundles.handlers.close,
  onCommandPaletteSourceChange: bundles.preferenceActions.onCommandPaletteSourceChange,
  onDeleteConnectionSecret: bundles.handlers.deleteConnectionSecret,
  onDisconnectMcpOAuth: bundles.connectionActions.disconnectMcpOAuth,
  onKeybindingOverrideChange: bundles.preferenceActions.onKeybindingOverrideChange,
  onLayoutChange: bundles.handlers.setLayout,
  onNotificationsChange: bundles.preferenceActions.onNotificationsChange,
  onOpenAgentConnection: (providerId) => void bundles.handlers.openAgentConnection(providerId),
  onOpenSourceControlLink: (url) => void bundles.handlers.openSourceControlLink(url),
  onProfileChange: bundles.scopedActions.onProfileChange,
  onRefreshAgentConnections: bundles.handlers.refreshAgentConnections,
  onRemoveCustomTerminalProfile: (profileId) => {
    void bundles.profilesController.removeCustomProfile(profileId);
  },
  onResetLayout: bundles.handlers.resetLayout,
  onResetLocalData: () => void bundles.connectionActions.resetLocalData(),
  onSaveConnectionSecret: bundles.handlers.saveConnectionSecret,
  onScopedSettingReset: bundles.scopedActions.onScopedSettingReset,
  onThemeChange: bundles.preferenceActions.onThemeChange,
  onTrayModeChange: bundles.handlers.setTrayMode,
  onValidateConnectionTarget: bundles.connectionActions.validateConnectionTarget,
});

export type AppSettingsHostProps = SettingsHostBundles & {
  modal: Omit<ModalProps, HandlerKeys>;
  open: boolean;
};

export const AppSettingsHost = (props: AppSettingsHostProps) =>
  props.open
    ? <SettingsModal {...props.modal} {...settingsModalHandlersFrom(props)} />
    : null;
