import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app editor surface runtime", () => {
  it("owns editor workflow, surface, file actions, and navigation outside App", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const runtime = readFileSync(new URL("./useAppEditorSurfaceRuntime.ts", import.meta.url), "utf8");

    for (const marker of [
      "wireEditorFileWorkflow(", "createEditorSurfaceActions<", "wireWorkspaceFileActions(",
      "useEditorNavigationLifecycle({",
    ]) {
      expect(app).not.toContain(marker);
      expect(runtime).toContain(marker);
    }
  });
});
