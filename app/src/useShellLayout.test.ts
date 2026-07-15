import { describe, expect, it } from "vitest";

import { utilityTrayHeightFromPointer } from "./useShellLayout";

const rect = { bottom: 800, height: 600 } as DOMRect;

describe("utilityTrayHeightFromPointer", () => {
  it("clamps the bottom tray between its minimum and workbench share", () => {
    expect(utilityTrayHeightFromPointer(rect, 780)).toBe(150);
    expect(utilityTrayHeightFromPointer(rect, 550)).toBe(250);
    expect(utilityTrayHeightFromPointer(rect, 100)).toBe(390);
  });
});
