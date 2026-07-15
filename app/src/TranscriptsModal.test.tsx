import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TranscriptsModal } from "./TranscriptsModal";
import type { PaneTranscript } from "./paneTranscripts";

const transcript = (id: string, sessionId: string, text: string): PaneTranscript => ({
  id,
  paneLabel: "Shell",
  profileLabel: "Shell",
  projectId: "/repo",
  projectSessionId: sessionId,
  savedAt: Date.now(),
  text,
});

describe("TranscriptsModal", () => {
  it("shows only transcripts from the active project chat", () => {
    const html = renderToStaticMarkup(<TranscriptsModal activeTranscriptId="one" onClose={vi.fn()} onSelect={vi.fn()} open projectId="/repo" projectSessionId="chat-a" transcripts={[transcript("one", "chat-a", "active output"), transcript("two", "chat-b", "hidden output")]} />);
    expect(html).toContain("active output");
    expect(html).not.toContain("hidden output");
    expect(html).toContain("Transcript from Shell");
  });

  it("renders the session empty state", () => {
    const html = renderToStaticMarkup(<TranscriptsModal activeTranscriptId={null} onClose={vi.fn()} onSelect={vi.fn()} open projectId="/repo" projectSessionId="missing" transcripts={[]} />);
    expect(html).toContain("No saved terminal transcripts for this chat yet.");
  });
});
