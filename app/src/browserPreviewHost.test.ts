import { describe, expect, it, vi } from "vitest";
import { browserPreviewPropsFrom, browserToolsDrawerPropsFrom } from "./browserPreviewHost";

const createBrowser = () => ({
  activeDetectedServer: { paneLabel: "Vite", url: "http://localhost:5173" } as
    { paneLabel: string | null; url: string } | null,
  address: "localhost:5173",
  canGoBack: true,
  canGoForward: false,
  error: "old error" as string | null,
  goHistory: vi.fn(),
  openDetectedServer: vi.fn(async () => {}),
  reload: vi.fn(),
  reloadNonce: 3,
  setAddress: vi.fn(),
  setError: vi.fn(),
  submitAddress: vi.fn(),
  url: "http://localhost:5173/",
});

const handlers = () => ({ contextMenu: vi.fn(), openExternal: vi.fn(async () => {}) });

describe("browserPreviewPropsFrom", () => {
  it("maps detected server fields and navigation state", () => {
    const props = browserPreviewPropsFrom(createBrowser(), handlers());

    expect(props).toMatchObject({
      address: "localhost:5173", canGoBack: true, canGoForward: false,
      detectedPaneLabel: "Vite", detectedUrl: "http://localhost:5173",
      reloadNonce: 3, url: "http://localhost:5173/",
    });
  });

  it("clears the error when the address changes and routes history", () => {
    const browser = createBrowser();
    const props = browserPreviewPropsFrom(browser, handlers());

    props.onAddressChange("localhost:3000");
    expect(browser.setAddress).toHaveBeenCalledWith("localhost:3000");
    expect(browser.setError).toHaveBeenCalledWith(null);

    props.onBack();
    props.onForward();
    expect(browser.goHistory).toHaveBeenNthCalledWith(1, -1);
    expect(browser.goHistory).toHaveBeenNthCalledWith(2, 1);
  });

  it("hides detected fields without a detected server", () => {
    const browser = { ...createBrowser(), activeDetectedServer: null };
    const props = browserPreviewPropsFrom(browser, handlers());

    expect(props.detectedPaneLabel).toBeNull();
    expect(props.detectedUrl).toBeNull();
  });
});

describe("browserToolsDrawerPropsFrom", () => {
  it("maps the drawer fields and show/reveal handlers", () => {
    const browser = createBrowser();
    const show = vi.fn();
    const openExternal = vi.fn(async () => {});
    const props = browserToolsDrawerPropsFrom(browser, { openExternal, show });

    expect(props).toMatchObject({
      address: "localhost:5173", canGoBack: true, canGoForward: false,
      detectedPaneLabel: "Vite", detectedUrl: "http://localhost:5173",
      url: "http://localhost:5173/",
    });

    props.onAddressChange("x");
    expect(browser.setError).toHaveBeenCalledWith(null);
    props.onShow();
    expect(show).toHaveBeenCalled();
    props.onOpenExternal();
    expect(openExternal).toHaveBeenCalledWith("http://localhost:5173/");
  });
});
