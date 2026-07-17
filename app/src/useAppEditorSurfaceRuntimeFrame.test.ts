import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app editor surface frame scheduling", () => {
  it("calls requestAnimationFrame through its Window receiver", () => {
    const runtime = readFileSync(
      new URL("./useAppEditorSurfaceRuntime.ts", import.meta.url),
      "utf8",
    );

    expect(runtime).toContain("scheduleFrame: (callback) => window.requestAnimationFrame(callback)");
    expect(runtime).not.toContain("scheduleFrame: requestAnimationFrame");
  });
});
