import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app workbench view", () => {
  it("owns shell slots and runtime overlays outside App", () => {
    const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const view = ["AppWorkbenchView.tsx", "AppWorkbenchMain.tsx", "AppWorkbenchOverlays.tsx"]
      .map((file) => readFileSync(new URL(`./${file}`, import.meta.url), "utf8"))
      .join("\n");

    for (const marker of [
      "<WorkbenchShell", "<AgentConversationPanel", "<ProjectCreationDialog",
      "<SearchCommandDialog", "<StatusBar",
    ]) {
      expect(app).not.toContain(marker);
      expect(view).toContain(marker);
    }
  });
});
