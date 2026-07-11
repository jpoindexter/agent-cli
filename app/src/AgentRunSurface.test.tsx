import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AgentRunSurface } from "./AgentRunSurface";

describe("AgentRunSurface", () => {
  it("combines live output, activity provenance, and the raw terminal escape hatch", () => {
    const html = renderToStaticMarkup(
      <AgentRunSurface
        activityFilter="all"
        events={[{
          id: "event-1",
          projectId: "/repo",
          projectSessionId: "session-1",
          paneId: "pane:1",
          kind: "file",
          label: "Edited a file",
          detail: "App.tsx",
          status: "complete",
          timestamp: 100,
        }]}
        hasPane
        hasSession
        transcript="Agent response"
        onActivityFilterChange={() => undefined}
        onClearActivity={() => undefined}
        onShowTerminal={() => undefined}
      />,
    );

    expect(html).toContain("Agent response");
    expect(html).toContain("Edited a file");
    expect(html).toContain("App.tsx");
    expect(html).toContain("Raw terminal");
    expect(html).toContain("Clear");
  });
});
