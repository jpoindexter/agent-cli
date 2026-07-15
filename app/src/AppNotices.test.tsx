import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AppNotices } from "./AppNotices";

describe("AppNotices", () => {
  it("renders recovery and action notices with dismiss controls", () => {
    const html = renderToStaticMarkup(<AppNotices actionNotice="Copied path" canUseShellProfile crashNotice="Recovered projects" launchError={null} onDismissAction={vi.fn()} onDismissCrash={vi.fn()} onOpenFolder={vi.fn()} onUseShellProfile={vi.fn()} />);
    expect(html).toContain("Recovered projects");
    expect(html).toContain("Copied path");
    expect(html).toContain("Dismiss recovery notice");
  });

  it("renders launch recovery actions", () => {
    const html = renderToStaticMarkup(<AppNotices actionNotice={null} canUseShellProfile={false} crashNotice={null} launchError="Agent failed" onDismissAction={vi.fn()} onDismissCrash={vi.fn()} onOpenFolder={vi.fn()} onUseShellProfile={vi.fn()} />);
    expect(html).toContain("Agent failed");
    expect(html).toContain("Open Folder");
    expect(html).toContain("disabled");
  });
});
