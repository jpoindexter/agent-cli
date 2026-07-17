import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app conversation bridge", () => {
  it("owns durable chat updates, harness logging, and server detection outside App", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const runtime = readFileSync(new URL("./useAppConversationBridge.ts", import.meta.url), "utf8");

    for (const marker of [
      "createChatConversationActions({", "useChatRunEvents(",
      "createComposerHarnessEventLog({", "createDevServerDetection({",
    ]) {
      expect(app).not.toContain(marker);
      expect(runtime).toContain(marker);
    }
  });
});
