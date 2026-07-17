import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app command palette host", () => {
  it("owns the runtime option bags outside App", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const host = readFileSync(new URL("./appCommandPaletteHost.ts", import.meta.url), "utf8");

    expect(app).not.toContain("const commandPaletteNavigation =");
    expect(app).not.toContain("const commandPaletteTerminal =");
    expect(app).not.toContain("const commandPaletteWorkbench =");
    expect(app).not.toContain("const commandPaletteChats =");
    expect(host).toContain("appCommandPaletteInputsFrom");
  });
});
