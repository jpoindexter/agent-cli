import { describe, expect, it } from "vitest";
import { terminalPaneCwdLabel, terminalPaneStateLabel } from "./terminalPane";

describe("terminal pane metadata", () => {
  it("formats lifecycle state for the terminal header", () => {
    expect(terminalPaneStateLabel("idle", null)).toBe("No pane");
    expect(terminalPaneStateLabel("starting", null)).toBe("Starting");
    expect(terminalPaneStateLabel("running", null)).toBe("Running");
    expect(terminalPaneStateLabel("exited", 130)).toBe("Exited 130");
    expect(terminalPaneStateLabel("error", null)).toBe("Error");
  });

  it("formats cwd compactly without losing the full path title", () => {
    expect(terminalPaneCwdLabel(null)).toBe("No cwd");
    expect(terminalPaneCwdLabel("/Users/jasonpoindexter/Documents/GitHub/apps/agent cli")).toBe("agent cli");
  });
});
