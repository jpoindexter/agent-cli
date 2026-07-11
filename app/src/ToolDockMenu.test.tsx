import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ToolDockMenu } from "./ToolDockMenu";

describe("ToolDockMenu", () => {
  it("keeps every tray and docking action behind one compact control", () => {
    const html = renderToStaticMarkup(
      <ToolDockMenu
        layout="hidden"
        toolMode="editor"
        onLayoutChange={() => undefined}
        onToolModeChange={() => undefined}
      />,
    );

    expect(html).toContain("Tools");
    expect(html).toContain("Editor");
    expect(html).toContain("Browser");
    expect(html).toContain("Split editor and browser");
    expect(html).toContain("Dock left");
    expect(html).toContain("Dock right");
    expect(html).toContain("Dock bottom");
    expect(html).toContain("Hide tools");
    expect(html).toContain('aria-label="Tools and dock position"');
  });
});
