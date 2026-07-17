// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SettingsModal } from "./SettingsModal";
import { defaultScopedSettings, scopedSettingView, setScopedSetting } from "./scopedSettings";

afterEach(cleanup);

const renderWorkspace = (overrides: Partial<Parameters<typeof SettingsModal>[0]> = {}) => {
  const onClose = vi.fn();
  const onLayoutChange = vi.fn();
  const scoped = defaultScopedSettings("codex", "http://localhost:5173");
  render(
    <SettingsModal
      approvalSetting={scopedSettingView(scoped, "approvalMode", "/repo", "chat-a")}
      browserSetting={scopedSettingView(scoped, "browserUrl", "/repo", "chat-a")}
      gitBranch="main"
      gitChangeCount={1}
      layout="right"
      profileSetting={scopedSettingView(scoped, "agentProfileId", "/repo", "chat-a")}
      profiles={[{ id: "codex", label: "Codex" }, { id: "shell", label: "Shell" }]}
      trayMode="files"
      onApprovalModeChange={vi.fn()}
      onBrowserUrlCommit={vi.fn()}
      onClose={onClose}
      onLayoutChange={onLayoutChange}
      onProfileChange={vi.fn()}
      onScopedSettingReset={vi.fn()}
      onResetLayout={vi.fn()}
      onTrayModeChange={vi.fn()}
      {...overrides}
    />,
  );
  return { onClose, onLayoutChange };
};

describe("Settings workspace interactions", () => {
  it("switches categories and applies a real layout setting", () => {
    const { onLayoutChange } = renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Layout" }));
    expect(screen.getByRole("heading", { name: "Layout" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Tool tray position"), { target: { value: "bottom" } });
    expect(onLayoutChange).toHaveBeenCalledWith("bottom");
  });

  it("searches across categories and clears search when navigating", () => {
    renderWorkspace();
    const search = screen.getByLabelText("Search settings");

    fireEvent.change(search, { target: { value: "localhost" } });
    expect(screen.getByText("Preview URL")).toBeTruthy();
    expect(screen.queryByText("Background notifications")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Agents" }));
    expect((search as HTMLInputElement).value).toBe("");
    expect(screen.getByText("Default chat provider")).toBeTruthy();
  });

  it("returns to the workbench from Back or Escape", () => {
    const first = renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Back to app" }));
    expect(first.onClose).toHaveBeenCalledTimes(1);

    first.onClose.mockClear();
    fireEvent.keyDown(screen.getByLabelText("Settings"), { key: "Escape" });
    expect(first.onClose).toHaveBeenCalledTimes(1);
  });

  it("edits a project override and resets it back to the inherited value", () => {
    const onProfileChange = vi.fn();
    const onScopedSettingReset = vi.fn();
    const base = defaultScopedSettings("codex", "http://localhost:5173");
    const scoped = setScopedSetting(base, "project", "agentProfileId", "shell", "/repo", "chat-a");
    renderWorkspace({
      profileSetting: scopedSettingView(scoped, "agentProfileId", "/repo", "chat-a"),
      onProfileChange,
      onScopedSettingReset,
    });

    fireEvent.click(screen.getByRole("button", { name: "Agents" }));
    fireEvent.change(screen.getByLabelText("Default chat provider scope"), { target: { value: "project" } });
    expect(screen.getByText("Project override")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Default agent profile"), { target: { value: "codex" } });
    expect(onProfileChange).toHaveBeenCalledWith("project", "codex");
    fireEvent.click(screen.getByRole("button", { name: "Reset override" }));
    expect(onScopedSettingReset).toHaveBeenCalledWith("agents.profile", "project");
  });

  it("changes a real command palette source", () => {
    const onCommandPaletteSourceChange = vi.fn();
    renderWorkspace({ onCommandPaletteSourceChange });

    fireEvent.click(screen.getByRole("button", { name: "Keyboard shortcuts" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Toggle Files command palette source" }));
    expect(onCommandPaletteSourceChange).toHaveBeenCalledWith("files", false);
  });

  it("opens an installed provider CLI for authentication recovery", () => {
    const onOpenAgentConnection = vi.fn();
    renderWorkspace({
      initialCategory: "agents",
      workspacePath: "/repo",
      onOpenAgentConnection,
      agentConnectionsStatus: {
        providers: [
          { id: "codex", label: "Codex", installed: true, version: "codex-cli 0.141.0", authenticated: true, structuredChat: true },
          { id: "gemini", label: "Gemini", installed: true, version: "0.47.0", authenticated: null, structuredChat: false },
          { id: "claude", label: "Claude", installed: false, version: null, authenticated: null, structuredChat: true },
          { id: "opencode", label: "OpenCode", installed: true, version: "1.4.3", authenticated: null, structuredChat: true },
        ],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Open Gemini CLI for setup" }));
    expect(onOpenAgentConnection).toHaveBeenCalledWith("gemini");
    expect((screen.getByRole("button", { name: "Open Claude CLI for setup" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
