import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app editor menu runtime", () => {
  it("owns workspace, session, editor, and diff menu assembly outside App", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const runtime = readFileSync(new URL("./appEditorMenuRuntime.ts", import.meta.url), "utf8");

    for (const marker of [
      "createWorkspaceContextMenuAssembly({", "wireSessionCheckpointActions(",
      "createProjectSessionContextMenuAssembly({", "createEditorContextMenuAssembly({",
    ]) {
      expect(app).not.toContain(marker);
      expect(runtime).toContain(marker);
    }
  });
});
