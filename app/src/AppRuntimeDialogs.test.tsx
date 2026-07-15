import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AppRuntimeDialogs } from "./AppRuntimeDialogs";

const orchestration = {
  open: false,
  projectPath: "/workspace",
  parentTitle: "Current chat",
  provider: "codex" as const,
  approvalMode: "ask" as const,
  activeRunCount: 0,
  launching: false,
  error: null,
  onClose: vi.fn(),
  onLaunch: vi.fn(),
};

describe("AppRuntimeDialogs", () => {
  it("renders runtime notices while orchestration is closed", () => {
    const html = renderToStaticMarkup(
      <AppRuntimeDialogs
        notices={{
          actionNotice: "Copied path",
          canUseShellProfile: true,
          crashNotice: null,
          launchError: null,
          onDismissAction: vi.fn(),
          onDismissCrash: vi.fn(),
          onOpenFolder: vi.fn(),
          onUseShellProfile: vi.fn(),
        }}
        orchestration={orchestration}
      />,
    );

    expect(html).toContain("Copied path");
    expect(html).not.toContain("Parallel child chats");
  });

  it("renders the orchestration dialog when open", () => {
    const html = renderToStaticMarkup(
      <AppRuntimeDialogs
        notices={{
          actionNotice: null,
          canUseShellProfile: true,
          crashNotice: null,
          launchError: null,
          onDismissAction: vi.fn(),
          onDismissCrash: vi.fn(),
          onOpenFolder: vi.fn(),
          onUseShellProfile: vi.fn(),
        }}
        orchestration={{ ...orchestration, open: true }}
      />,
    );

    expect(html).toContain("Parallel child chats");
    expect(html).toContain("Current chat");
  });
});
