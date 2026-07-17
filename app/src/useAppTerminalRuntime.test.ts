import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app terminal runtime", () => {
  it("owns bootstrap, canvas, terminal events, and native app events outside App", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const runtime = readFileSync(new URL("./useAppTerminalRuntime.ts", import.meta.url), "utf8");

    for (const marker of [
      "createWorkspaceBootstrapController({", "useTerminalCanvasRuntime({",
      "createTerminalRuntimeEventHandlers(", "useNativeAppEvents<",
    ]) {
      expect(app).not.toContain(marker);
      expect(runtime).toContain(marker);
    }
  });
});
