import { describe, expect, it } from "vitest";

import {
  DEFAULT_SIDE_DRAWER_WIDTH,
  DEFAULT_TOOL_TRAY_MODE,
  DEFAULT_WORKBENCH_LAYOUT,
  DEFAULT_WORKBENCH_SIZING,
  effectiveWorkbenchLayout,
  usableAgentWidth,
} from "./workbenchLayout";

describe("workbench layout contract", () => {
  it("opens agent-first without a tool tray consuming the main surface", () => {
    expect(DEFAULT_WORKBENCH_LAYOUT).toBe("hidden");
    expect(DEFAULT_TOOL_TRAY_MODE).toBe("editor");
    expect(DEFAULT_SIDE_DRAWER_WIDTH).toBeLessThanOrEqual(280);
  });

  it("moves side-docked tools to the bottom before they squeeze the agent surface", () => {
    expect(effectiveWorkbenchLayout("right", 1024)).toBe("bottom");
    expect(effectiveWorkbenchLayout("left", 1024)).toBe("bottom");
    expect(effectiveWorkbenchLayout("right", 1440)).toBe("right");
    expect(effectiveWorkbenchLayout("hidden", 800)).toBe("hidden");
  });

  it("keeps a readable agent surface at the supported minimum window width", () => {
    expect(
      usableAgentWidth({
        viewportWidth: 900,
        drawerWidth: DEFAULT_SIDE_DRAWER_WIDTH,
        drawerCollapsed: false,
        layout: effectiveWorkbenchLayout("right", 900),
        trayPercent: DEFAULT_WORKBENCH_SIZING.trayPercent,
      }),
    ).toBeGreaterThanOrEqual(600);
  });
});
