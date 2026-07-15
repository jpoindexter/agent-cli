import { describe, expect, it } from "vitest";

import {
  nudgeWorkbenchSizing,
  resizeWorkbenchSizing,
  workbenchShellStyles,
} from "./workbenchLayoutSizing";

const rect = { left: 100, right: 1100, top: 50, bottom: 650, width: 1000, height: 600 };
const sizing = { trayPercent: 39, toolSplitPercent: 55 };

describe("workbench layout sizing", () => {
  it("derives shell tokens from persisted sizing and drawer state", () => {
    expect(workbenchShellStyles(sizing, 1440, 332, false)).toEqual({
      appShellStyle: {
        "--side-drawer-width": "332px",
        "--titlebar-leading-width": "332px",
        "--dock-width": "430px",
      },
      workbenchStyle: {
        "--tool-tray-size": "39%",
        "--tool-primary-size": "55%",
      },
    });
  });

  it("converts pointer positions into dock-aware tray and tool percentages", () => {
    expect(resizeWorkbenchSizing("tray", "right", sizing, rect, 800, 200)).toEqual({
      trayPercent: 30,
      toolSplitPercent: 55,
    });
    expect(resizeWorkbenchSizing("tools", "bottom", sizing, rect, 700, 200)).toEqual({
      trayPercent: 39,
      toolSplitPercent: 60,
    });
  });

  it("nudges the active split in the expected visual direction", () => {
    expect(nudgeWorkbenchSizing("tray", "right", sizing, "ArrowRight").trayPercent).toBe(36);
    expect(nudgeWorkbenchSizing("tray", "left", sizing, "ArrowRight").trayPercent).toBe(42);
    expect(nudgeWorkbenchSizing("tools", "bottom", sizing, "ArrowLeft").toolSplitPercent).toBe(52);
    expect(nudgeWorkbenchSizing("tools", "right", sizing, "ArrowDown").toolSplitPercent).toBe(58);
  });
});
