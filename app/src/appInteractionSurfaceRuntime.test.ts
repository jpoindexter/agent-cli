import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app interaction surface runtime", () => {
  it("owns composer and terminal surface assembly", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const runtime = readFileSync(new URL("./appInteractionSurfaceRuntime.ts", import.meta.url), "utf8");

    for (const marker of [
      "appComposerSurfaceRuntimeFrom(",
      "appTerminalSurfaceRuntimeFrom(",
    ]) {
      expect(app).not.toContain(marker);
      expect(runtime).toContain(marker);
    }
  });
});
