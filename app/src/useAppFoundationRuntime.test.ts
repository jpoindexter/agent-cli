import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app foundation runtime", () => {
  it("owns root, workspace, shell, search, conversation, and composer hook setup", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const runtime = readFileSync(new URL("./useAppFoundationRuntime.ts", import.meta.url), "utf8");

    for (const marker of [
      "useAppRootState<", "useWorkspaceDomain<", "useAppShellDomain(",
      "useAppSearchRuntime<", "useConversationRuntime(", "useComposerRuntime(",
      "deriveActiveAgentSessionState(",
    ]) {
      expect(app).not.toContain(marker);
      expect(runtime).toContain(marker);
    }
  });
});
