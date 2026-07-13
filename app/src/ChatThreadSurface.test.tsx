import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChatThreadSurface } from "./ChatThreadSurface";

describe("ChatThreadSurface", () => {
  it("renders independent user, assistant, and structured tool messages", () => {
    const html = renderToStaticMarkup(
      <ChatThreadSurface
        conversation={{
          provider: "codex",
          providerThreadId: "thread-1",
          updatedAt: 4,
          messages: [
            { id: "user-1", role: "user", text: "Inspect the repo", timestamp: 1 },
            { id: "status-1", role: "status", title: "Codex", text: "Completed", status: "complete", timestamp: 2 },
            { id: "status-2", role: "status", title: "Codex", text: "Working", status: "running", timestamp: 2 },
            { id: "tool-1", role: "tool", title: "Ran command", text: "git status\n\nclean", status: "complete", timestamp: 2 },
            { id: "assistant-1", role: "assistant", text: "The repo is clean.", timestamp: 3 },
            { id: "assistant-2", role: "assistant", text: "No action is required.", timestamp: 4 },
          ],
        }}
        events={[]}
        onSuggestion={() => {}}
      />,
    );

    expect(html).toContain("You");
    expect(html).toContain("Inspect the repo");
    expect(html).toContain("Ran command");
    expect(html).toContain("The repo is clean.");
    expect(html).toContain("No action is required.");
    expect(html).not.toContain("Completed");
    expect(html).not.toContain("Working");
    expect(html.match(/>Codex</g)).toHaveLength(1);
    expect(html).not.toContain("Terminal-backed");
  });

  it("shows working status only while the selected chat owns a live run", () => {
    const html = renderToStaticMarkup(
      <ChatThreadSurface
        conversation={{
          provider: "codex",
          activeRunId: "run-1",
          messages: [
            { id: "status-1", role: "status", title: "Codex", text: "Working", status: "running", timestamp: 1 },
          ],
          updatedAt: 1,
        }}
        events={[]}
        onSuggestion={() => {}}
      />,
    );
    expect(html).toContain("Working");
  });

  it("offers concrete prompts in a new chat", () => {
    const html = renderToStaticMarkup(
      <ChatThreadSurface
        conversation={{ provider: "codex", messages: [], updatedAt: 0 }}
        events={[]}
        onSuggestion={() => {}}
      />,
    );
    expect(html).toContain("Start a new Codex chat");
    expect(html).toContain("Run the relevant tests");
  });
});
