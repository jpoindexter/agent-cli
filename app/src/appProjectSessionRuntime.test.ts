import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app project session runtime", () => {
  it("owns session navigation, deletion, pane finalize, and project entry outside App", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const runtime = readFileSync(new URL("./appProjectSessionRuntime.ts", import.meta.url), "utf8");

    for (const marker of [
      "createProjectSessionNavigationActions({", "createProjectSessionDeletionController(",
      "createTerminalPaneFinalize({", "createWorkspacePicker({", "createProjectEntryActions({",
    ]) {
      expect(app).not.toContain(marker);
      expect(runtime).toContain(marker);
    }
  });
});
