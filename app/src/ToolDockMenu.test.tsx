import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ToolDockMenu } from "./ToolDockMenu";

describe("ToolDockMenu", () => {
  it("keeps docking position-only; surface switching belongs to the tray tab strip", () => {
    const html = renderToStaticMarkup(
      <ToolDockMenu
        layout="hidden"
        toolMode="editor"
        onLayoutChange={() => undefined}
        onToolModeChange={() => undefined}
      />,
    );

    expect(html).toContain("Tools");
    expect(html).not.toContain("Split editor and browser");
    expect(html).toContain("Dock left");
    expect(html).toContain("Dock right");
    expect(html).toContain("Dock bottom");
    expect(html).toContain("Hide tools");
    expect(html).toContain('aria-label="Tools and dock position"');
  });
});
