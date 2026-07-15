import type { FormEvent } from "react";

import { AppIcon } from "./icons";

export type BrowserToolsDrawerProps = {
  address: string;
  canGoBack: boolean;
  canGoForward: boolean;
  detectedPaneLabel: string | null;
  detectedUrl: string | null;
  error: string | null;
  url: string;
  onAddressChange: (address: string) => void;
  onBack: () => void;
  onForward: () => void;
  onOpenDetected: () => void;
  onOpenExternal: () => void;
  onReload: () => void;
  onShow: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const DetectedServer = (props: Pick<BrowserToolsDrawerProps, "detectedPaneLabel" | "detectedUrl" | "url" | "onOpenDetected">) => props.detectedUrl ? (
  <div className="drawer-detected-server" title={props.detectedUrl}>
    <div><span>Detected from {props.detectedPaneLabel}</span><strong>{props.detectedUrl}</strong></div>
    <button className="rail-open-button" type="button" disabled={props.detectedUrl === props.url} onClick={props.onOpenDetected}>
      <AppIcon name="browser" /><span>{props.detectedUrl === props.url ? "Current" : "Open detected"}</span>
    </button>
  </div>
) : null;

const BrowserActions = (props: Pick<BrowserToolsDrawerProps, "canGoBack" | "canGoForward" | "onBack" | "onForward" | "onOpenExternal" | "onReload">) => (
  <div className="drawer-action-grid">
    <button className="rail-open-button" type="button" disabled={!props.canGoBack} onClick={props.onBack}><AppIcon name="back" /><span>Back</span></button>
    <button className="rail-open-button" type="button" disabled={!props.canGoForward} onClick={props.onForward}><AppIcon name="forward" /><span>Forward</span></button>
    <button className="rail-open-button" type="button" onClick={props.onReload}><AppIcon name="reload" /><span>Reload</span></button>
    <button className="rail-open-button" type="button" onClick={props.onOpenExternal}><AppIcon name="openExternal" /><span>External</span></button>
  </div>
);

export const BrowserToolsDrawer = (props: BrowserToolsDrawerProps) => (
  <section className="drawer-panel" aria-label="Browser tools">
    <div className="panel-title panel-title--with-action">
      <span>Browser</span>
      <button className="rail-open-button" type="button" onClick={props.onShow}><AppIcon name="browser" /><span>Show</span></button>
    </div>
    <form className="drawer-form" onSubmit={props.onSubmit}>
      <label className="drawer-field"><span>Preview URL</span><input value={props.address} placeholder="localhost:5173" onChange={(event) => props.onAddressChange(event.currentTarget.value)} /></label>
      <button className="rail-open-button" type="submit"><AppIcon name="browser" /><span>Open</span></button>
    </form>
    {props.error ? <div className="rail-status rail-status--error">{props.error}</div> : null}
    <DetectedServer {...props} />
    <BrowserActions {...props} />
    <div className="drawer-callout" title={props.url}><AppIcon name="browser" /><span>{props.url}</span></div>
  </section>
);
