import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app runtime menu host", () => {
  it("owns terminal and app menu projection outside App", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const host = readFileSync(new URL("./appRuntimeMenuHost.ts", import.meta.url), "utf8");

    expect(app).not.toContain("buildTerminalContextMenuItems({");
    expect(app).not.toContain("createAppMenuAssembly({");
    expect(host).toContain("appRuntimeMenusFrom");
  });
});
