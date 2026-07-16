import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const bootstrap = readFileSync(new URL("./workspaceBootstrap.ts", import.meta.url), "utf8");

describe("agent activity persistence key", () => {
  it("writes activity events under the same Store key the loader reads", () => {
    expect(app).toContain('storeRef.current?.set("agentActivityEvents", events)');
    expect(app).not.toContain('"agentActivityHook.agentActivityEvents"');
    expect(bootstrap).toContain('"agentActivityEvents"');
  });
});
