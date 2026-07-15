import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { BrowserPreviewPanel, type BrowserPreviewPanelProps } from "./BrowserPreviewPanel";

const props = (overrides: Partial<BrowserPreviewPanelProps> = {}): BrowserPreviewPanelProps => ({
  address: "http://localhost:3000", canGoBack: false, canGoForward: false,
  detectedPaneLabel: null, detectedUrl: null, error: null,
  onAddressChange: vi.fn(), onBack: vi.fn(), onContextMenu: vi.fn(), onForward: vi.fn(),
  onOpenDetected: vi.fn(), onOpenExternal: vi.fn(), onReload: vi.fn(), onSubmit: vi.fn(),
  reloadNonce: 0, url: "http://localhost:3000", ...overrides,
});

describe("BrowserPreviewPanel", () => {
  it("renders navigation and the preview frame", () => {
    const html = renderToStaticMarkup(<BrowserPreviewPanel {...props()} />);
    expect(html).toContain("Browser preview URL");
    expect(html).toContain("Browser preview: http://localhost:3000");
    expect(html).toContain('referrerPolicy="no-referrer"');
  });

  it("shows a different detected local server", () => {
    const html = renderToStaticMarkup(<BrowserPreviewPanel {...props({ detectedPaneLabel: "Shell 1", detectedUrl: "http://localhost:5173" })} />);
    expect(html).toContain("Detected dev server from Shell 1");
    expect(html).toContain("Open detected");
  });
});
