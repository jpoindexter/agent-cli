import type { ComponentProps, MouseEvent } from "react";
import type { BrowserPreviewPanel } from "./BrowserPreviewPanel";
import type { BrowserToolsDrawerProps } from "./BrowserToolsDrawer";

type PanelProps = ComponentProps<typeof BrowserPreviewPanel>;

type BrowserPreviewSource = {
  activeDetectedServer: { paneLabel: string | null; url: string } | null;
  address: string;
  canGoBack: boolean;
  canGoForward: boolean;
  error: string | null;
  goHistory: (direction: -1 | 1) => void;
  openDetectedServer: () => Promise<unknown>;
  reload: () => void;
  reloadNonce: number;
  setAddress: (address: string) => void;
  setError: (error: string | null) => void;
  submitAddress: PanelProps["onSubmit"];
  url: string;
};

type BrowserPreviewHandlers = {
  contextMenu: (event: MouseEvent) => void;
  openExternal: (url: string) => Promise<unknown>;
};

export const browserPreviewPropsFrom = (
  browser: BrowserPreviewSource,
  handlers: BrowserPreviewHandlers,
): PanelProps => ({
  address: browser.address,
  canGoBack: browser.canGoBack,
  canGoForward: browser.canGoForward,
  detectedPaneLabel: browser.activeDetectedServer?.paneLabel ?? null,
  detectedUrl: browser.activeDetectedServer?.url ?? null,
  error: browser.error,
  onAddressChange: (address) => { browser.setAddress(address); browser.setError(null); },
  onBack: () => browser.goHistory(-1),
  onContextMenu: handlers.contextMenu,
  onForward: () => browser.goHistory(1),
  onOpenDetected: () => void browser.openDetectedServer(),
  onOpenExternal: () => void handlers.openExternal(browser.url),
  onReload: browser.reload,
  onSubmit: browser.submitAddress,
  reloadNonce: browser.reloadNonce,
  url: browser.url,
});

type BrowserDrawerHandlers = {
  openExternal: (url: string) => Promise<unknown>;
  show: () => void;
};

export const browserToolsDrawerPropsFrom = (
  browser: BrowserPreviewSource,
  handlers: BrowserDrawerHandlers,
): BrowserToolsDrawerProps => ({
  address: browser.address,
  canGoBack: browser.canGoBack,
  canGoForward: browser.canGoForward,
  detectedPaneLabel: browser.activeDetectedServer?.paneLabel ?? null,
  detectedUrl: browser.activeDetectedServer?.url ?? null,
  error: browser.error,
  url: browser.url,
  onAddressChange: (address) => { browser.setAddress(address); browser.setError(null); },
  onBack: () => browser.goHistory(-1),
  onForward: () => browser.goHistory(1),
  onOpenDetected: () => void browser.openDetectedServer(),
  onOpenExternal: () => void handlers.openExternal(browser.url),
  onReload: browser.reload,
  onShow: handlers.show,
  onSubmit: browser.submitAddress,
});
