import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { WorkbenchResizers } from "./WorkbenchResizers";

const renderResizers = (layout: "right" | "bottom" | "hidden", trayMode: "files" | "split") =>
  renderToStaticMarkup(
    <WorkbenchResizers
      layout={layout}
      onKeyDown={vi.fn()}
      onPointerDown={vi.fn()}
      sizing={{ toolSplitPercent: 58.4, trayPercent: 39.4 }}
      trayMode={trayMode}
    />,
  );

describe("WorkbenchResizers", () => {
  it("renders no separators when the tool tray is hidden", () => {
    expect(renderResizers("hidden", "split")).toBe("");
  });

  it("renders tray and tool separators with dock-aware orientations", () => {
    const right = renderResizers("right", "split");
    const bottom = renderResizers("bottom", "split");

    expect(right.match(/role="separator"/g)).toHaveLength(2);
    expect(right).toContain('aria-label="Resize tool tray" aria-orientation="vertical"');
    expect(right).toContain('aria-label="Resize editor and browser trays" aria-orientation="horizontal"');
    expect(right).toContain('aria-valuenow="39"');
    expect(right).toContain('aria-valuenow="58"');
    expect(bottom).toContain('aria-label="Resize tool tray" aria-orientation="horizontal"');
    expect(bottom).toContain('aria-label="Resize editor and browser trays" aria-orientation="vertical"');
  });
});
