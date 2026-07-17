import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("agent hook runtime", () => {
  it("owns the native agent hook bridge outside App", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const runtime = readFileSync(new URL("./useAgentHookRuntime.ts", import.meta.url), "utf8");

    expect(app).not.toContain('invoke("update_agent_hook_snapshot"');
    expect(app).not.toContain("useAgentHookRequests({");
    expect(runtime).toContain("buildAgentHookSnapshot");
    expect(runtime).toContain("useAgentHookRequests");
  });
});
