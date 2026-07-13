// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SettingsModal } from "./SettingsModal";

afterEach(cleanup);

const renderWorkspace = (overrides: Partial<Parameters<typeof SettingsModal>[0]> = {}) => {
  const onClose = vi.fn();
  const onLayoutChange = vi.fn();
  render(
    <SettingsModal
      approvalMode="ask"
      browserUrl="http://localhost:5173"
      gitBranch="main"
      gitChangeCount={1}
      layout="right"
      profileId="codex"
      profiles={[{ id: "codex", label: "Codex" }, { id: "shell", label: "Shell" }]}
      trayMode="files"
      onApprovalModeChange={vi.fn()}
      onBrowserUrlCommit={vi.fn()}
      onClose={onClose}
      onLayoutChange={onLayoutChange}
      onProfileChange={vi.fn()}
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
    expect(screen.getByText("Default agent")).toBeTruthy();
  });

  it("returns to the workbench from Back or Escape", () => {
    const first = renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Back to app" }));
    expect(first.onClose).toHaveBeenCalledTimes(1);

    first.onClose.mockClear();
    fireEvent.keyDown(screen.getByLabelText("Settings"), { key: "Escape" });
    expect(first.onClose).toHaveBeenCalledTimes(1);
  });
});
