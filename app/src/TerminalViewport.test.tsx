import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TerminalViewport } from "./TerminalViewport";

const refs = () => ({ canvasRef: createRef<HTMLCanvasElement>(), imeInputRef: createRef<HTMLTextAreaElement>(), terminalHostRef: createRef<HTMLDivElement>() });

describe("TerminalViewport", () => {
  it("offers the folder action before a workspace is open", () => {
    const html = renderToStaticMarkup(<TerminalViewport {...refs()} activeProfileLabel="Shell" paneCount={0} workspaceOpen={false} onContextMenu={vi.fn()} onOpenFolder={vi.fn()} onPaste={vi.fn()} onStartShell={vi.fn()} />);
    expect(html).toContain("Open a folder to start a terminal");
    expect(html).toContain("Open folder");
  });

  it("offers a shell after the workspace opens", () => {
    const html = renderToStaticMarkup(<TerminalViewport {...refs()} activeProfileLabel="Shell" paneCount={0} workspaceOpen onContextMenu={vi.fn()} onOpenFolder={vi.fn()} onPaste={vi.fn()} onStartShell={vi.fn()} />);
    expect(html).toContain("No terminal panes");
    expect(html).toContain("Start Shell");
  });
});
