import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { BrowserToolsDrawer, type BrowserToolsDrawerProps } from "./BrowserToolsDrawer";

const props = (overrides: Partial<BrowserToolsDrawerProps> = {}): BrowserToolsDrawerProps => ({
  address: "http://localhost:3000", canGoBack: false, canGoForward: true,
  detectedPaneLabel: "Shell 1", detectedUrl: "http://localhost:5173", error: null,
  url: "http://localhost:3000", onAddressChange: vi.fn(), onBack: vi.fn(), onForward: vi.fn(),
  onOpenDetected: vi.fn(), onOpenExternal: vi.fn(), onReload: vi.fn(), onShow: vi.fn(),
  onSubmit: vi.fn(), ...overrides,
});

describe("BrowserToolsDrawer", () => {
  it("renders preview navigation and detected server actions", () => {
    const html = renderToStaticMarkup(<BrowserToolsDrawer {...props()} />);
    expect(html).toContain("Preview URL");
    expect(html).toContain("Detected from Shell 1");
    expect(html).toContain("Open detected");
    expect(html).toContain("External");
  });

  it("shows browser errors", () => {
    const html = renderToStaticMarkup(<BrowserToolsDrawer {...props({ error: "Invalid URL" })} />);
    expect(html).toContain("Invalid URL");
  });
});
