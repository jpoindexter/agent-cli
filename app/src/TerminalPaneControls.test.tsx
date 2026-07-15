import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TerminalPaneControls, type TerminalPaneControlsProps } from "./TerminalPaneControls";

const shell = { id: "shell", label: "Shell", command: "/bin/zsh", args: ["-l"], useLoginShell: false };
const pane = { id: 1, profile: shell, cwd: "/tmp", slot: 0, label: null, state: "running" as const, exitCode: null, createdAt: 0 };
const props = (): TerminalPaneControlsProps => ({
  activePane: pane, activePaneId: 1, canClose: true, hasWorkspace: true, launchProfile: shell,
  launchProfileChanging: false, launchProfiles: [shell], panes: [pane], onClose: vi.fn(),
  onContextMenu: vi.fn(), onCreate: vi.fn(), onFind: vi.fn(), onFocus: vi.fn(), onKill: vi.fn(),
  onProfileChange: vi.fn(), onRename: vi.fn(), onRestart: vi.fn(),
});

describe("TerminalPaneControls", () => {
  it("renders pane identity and lifecycle actions", () => {
    const html = renderToStaticMarkup(<TerminalPaneControls {...props()} />);
    expect(html).toContain("Shell 1");
    expect(html).toContain("Restart selected process");
    expect(html).toContain("Kill selected process");
    expect(html).toContain("Close selected pane");
  });
});
