import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./App.css", import.meta.url), "utf8");

describe("responsive shell CSS contract", () => {
  it("keeps the agent surface full-width and full-height when tools are hidden at narrow widths", () => {
    const compactStart = css.indexOf("@media (max-width: 960px)");
    const mobileStart = css.indexOf("@media (max-width: 720px)");
    const compact = css.slice(compactStart, mobileStart);
    const mobile = css.slice(mobileStart);
    const hiddenTray = /\.workbench--drawer-hidden\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\);[^}]*grid-template-areas:\s*"terminal";/s;

    expect(compact).toMatch(hiddenTray);
    expect(mobile).toMatch(hiddenTray);
  });
});
