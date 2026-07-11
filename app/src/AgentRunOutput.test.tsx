import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AgentRunOutput } from "./AgentRunOutput";

describe("AgentRunOutput", () => {
  it("shows live terminal-backed output as the primary run content", () => {
    const html = renderToStaticMarkup(<AgentRunOutput hasPane transcript={"Working\nDone"} />);

    expect(html).toContain("Live agent output");
    expect(html).toContain("Terminal-backed");
    expect(html).toContain("Working\nDone");
  });

  it("uses actionable empty states instead of a blank main surface", () => {
    expect(renderToStaticMarkup(<AgentRunOutput hasPane transcript="" />)).toContain("Waiting for agent output");
    expect(renderToStaticMarkup(<AgentRunOutput hasPane={false} transcript="" />)).toContain("Start or select an agent");
  });
});
