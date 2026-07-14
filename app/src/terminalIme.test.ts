import { describe, expect, it } from "vitest";

import { imeCaretStyle, shouldDeferTerminalKeyToIme } from "./terminalIme";

describe("imeCaretStyle", () => {
  it("scales the cursor cell to a pixel transform and cell-sized box", () => {
    expect(imeCaretStyle(0, 0, 8, 16)).toEqual({
      transform: "translate(0px, 0px)",
      width: "8px",
      height: "16px",
    });
    expect(imeCaretStyle(10, 3, 8.4, 17)).toEqual({
      transform: "translate(84px, 51px)",
      width: "8.4px",
      height: "17px",
    });
  });

  it("lets WebKit handle dead and IME process keys before PTY encoding", () => {
    expect(shouldDeferTerminalKeyToIme({ key: "Dead", keyCode: 69, isComposing: false })).toBe(true);
    expect(shouldDeferTerminalKeyToIme({ key: "Process", keyCode: 0, isComposing: false })).toBe(true);
    expect(shouldDeferTerminalKeyToIme({ key: "a", keyCode: 229, isComposing: false })).toBe(true);
    expect(shouldDeferTerminalKeyToIme({ key: "a", keyCode: 65, isComposing: true })).toBe(true);
    expect(shouldDeferTerminalKeyToIme({ key: "a", keyCode: 65, isComposing: false })).toBe(false);
    expect(shouldDeferTerminalKeyToIme({ key: "ArrowLeft", keyCode: 37, isComposing: false })).toBe(false);
  });
});
