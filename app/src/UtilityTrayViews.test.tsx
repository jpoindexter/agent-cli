import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { UtilityTrayLogs, UtilityTrayProcesses } from "./UtilityTrayViews";

describe("UtilityTrayViews", () => {
  it("renders process identity and state", () => {
    const html = renderToStaticMarkup(<UtilityTrayProcesses panes={[{ id: 1, label: null, profile: { id: "shell", label: "Shell", command: "/bin/zsh", args: [], useLoginShell: false }, state: "running", exitCode: null }]} onFocus={vi.fn()} />);
    expect(html).toContain("Shell 1");
    expect(html).toContain("Running");
  });

  it("renders activity log details", () => {
    const html = renderToStaticMarkup(<UtilityTrayLogs events={[{ id: "1", projectId: "p", projectSessionId: "s", paneId: "1", kind: "command", label: "Ran tests", detail: "npm test", status: "complete", timestamp: 0 }]} />);
    expect(html).toContain("Ran tests");
    expect(html).toContain("npm test");
  });
});
