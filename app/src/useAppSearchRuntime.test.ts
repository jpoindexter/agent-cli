import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app search runtime", () => {
  it("owns drawer, chat discovery, and quick-open derivation outside App", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const runtime = readFileSync(new URL("./useAppSearchRuntime.ts", import.meta.url), "utf8");

    for (const marker of [
      "filterWorkspaceFiles(", "mergeChatDiscoveryResults(", "useQuickOpen(",
    ]) {
      expect(app).not.toContain(marker);
      expect(runtime).toContain(marker);
    }
  });
});
