import { describe, expect, it } from "vitest";
import { terminalWheelRows } from "./useTerminalCanvasRuntime";

describe("terminalWheelRows", () => {
  it("converts wheel distance to at least one terminal row", () => {
    expect(terminalWheelRows(2, 20)).toBe(1);
    expect(terminalWheelRows(-2, 20)).toBe(-1);
    expect(terminalWheelRows(48, 20)).toBe(2);
  });
});
