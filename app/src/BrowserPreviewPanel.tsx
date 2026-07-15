import type { FormEvent, MouseEvent } from "react";

import { AppIcon } from "./icons";

export type BrowserPreviewPanelProps = {
  address: string;
  canGoBack: boolean;
  canGoForward: boolean;
  detectedPaneLabel: string | null;
  detectedUrl: string | null;
  error: string | null;
  onAddressChange: (address: string) => void;
  onBack: () => void;
  onContextMenu: (event: MouseEvent<HTMLElement>) => void;
  onForward: () => void;
  onOpenDetected: () => void;
  onOpenExternal: () => void;
  onReload: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  reloadNonce: number;
  url: string;
};

const BrowserToolbar = (props: BrowserPreviewPanelProps) => (
  <div className="browser-toolbar">
    <div className="browser-toolbar__nav" aria-label="Browser navigation">
      <button className="browser-button" type="button" title="Back" aria-label="Back" disabled={!props.canGoBack} onClick={props.onBack}><AppIcon name="back" /></button>
      <button className="browser-button" type="button" title="Forward" aria-label="Forward" disabled={!props.canGoForward} onClick={props.onForward}><AppIcon name="forward" /></button>
      <button className="browser-button" type="button" title="Reload" aria-label="Reload browser preview" onClick={props.onReload}><AppIcon name="reload" /></button>
    </div>
    <form className="browser-address" onSubmit={props.onSubmit}>
      <label className="browser-address__label" htmlFor="browser-preview-url">Preview URL</label>
      <AppIcon name="browser" />
      <input id="browser-preview-url" value={props.address} aria-label="Browser preview URL" spellCheck={false} inputMode="url" placeholder="localhost:3000" onChange={(event) => props.onAddressChange(event.currentTarget.value)} />
      <button className="browser-button browser-button--go" type="submit" title="Open preview URL">Open</button>
    </form>
    <button className="browser-button" type="button" title="Open preview externally" aria-label="Open preview externally" onClick={props.onOpenExternal}><AppIcon name="openExternal" /></button>
  </div>
);

const BrowserFrame = ({ error, reloadNonce, url }: Pick<BrowserPreviewPanelProps, "error" | "reloadNonce" | "url">) => (
  <div className="browser-frame-wrap">
    {error ? <div className="browser-error" role="alert">{error}</div> : null}
    <iframe key={`${url}-${reloadNonce}`} className="browser-frame" title={`Browser preview: ${url}`} src={url} referrerPolicy="no-referrer" />
  </div>
);

export const BrowserPreviewPanel = (props: BrowserPreviewPanelProps) => (
  <section className="browser-preview" aria-label="Browser preview" onContextMenu={props.onContextMenu}>
    <BrowserToolbar {...props} />
    {props.detectedUrl && props.detectedUrl !== props.url ? (
      <div className="browser-detected-banner" title={props.detectedUrl}>
        <AppIcon name="browser" />
        <span>Detected dev server from {props.detectedPaneLabel}</span>
        <button type="button" onClick={props.onOpenDetected}>Open detected</button>
      </div>
    ) : null}
    <BrowserFrame error={props.error} reloadNonce={props.reloadNonce} url={props.url} />
  </section>
);
