import { describe, expect, it } from "vitest";
import { activityIconNames, agentActivityAccessibleLabel, agentActivityIconName, paneStateAccessibleLabel, paneStateIconName } from "./icons";

describe("icon system", () => {
  it("maps terminal pane states to status icons", () => {
    expect(paneStateIconName("running")).toBe("loading");
    expect(paneStateIconName("starting")).toBe("waiting");
    expect(paneStateIconName("exited")).toBe("error");
    expect(paneStateIconName("error")).toBe("error");
    expect(paneStateIconName("idle")).toBe("idle");
  });

  it("keeps agent activity icon names available for future activity rows", () => {
    expect(activityIconNames).toEqual(["thinking", "loading", "waiting", "error", "complete"]);
  });

  it("maps agent activity statuses to status icons", () => {
    expect(agentActivityIconName("thinking")).toBe("thinking");
    expect(agentActivityIconName("running")).toBe("loading");
    expect(agentActivityIconName("waiting")).toBe("waiting");
    expect(agentActivityIconName("error")).toBe("error");
    expect(agentActivityIconName("exited")).toBe("error");
    expect(agentActivityIconName("complete")).toBe("complete");
  });

  it("labels status icons with visible state and raw state", () => {
    expect(paneStateAccessibleLabel("running", "Running")).toBe("Running terminal pane state: running");
    expect(agentActivityAccessibleLabel("thinking", "Thinking")).toBe("Thinking agent activity status: thinking");
  });
});
