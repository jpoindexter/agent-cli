import { describe, expect, it } from "vitest";

import {
  addPaneTranscript,
  buildPaneTranscript,
  normalizePaneTranscripts,
  transcriptTimeLabel,
  transcriptsForSession,
  type PaneTranscript,
} from "./paneTranscripts";

const make = (id: string, text = "output", projectId = "/a", sessionId = "s1"): PaneTranscript =>
  buildPaneTranscript({
    id,
    projectId,
    projectSessionId: sessionId,
    paneLabel: "Codex",
    profileLabel: "Codex",
    savedAt: 1000,
    text,
  });

describe("pane transcripts", () => {
  it("truncates oversized text to the tail and drops empty captures", () => {
    const big = buildPaneTranscript({ ...make("x"), text: "a".repeat(200_000) });
    expect(big.text.length).toBe(100_000);
    expect(addPaneTranscript([], make("e", "   "))).toEqual([]);
  });

  it("stores newest first and caps the list", () => {
    let list: PaneTranscript[] = [];
    for (let i = 0; i < 65; i += 1) list = addPaneTranscript(list, make(`t${i}`));
    expect(list.length).toBe(60);
    expect(list[0].id).toBe("t64");
  });

  it("filters by project session and normalizes stored rows", () => {
    const list = [make("a", "o", "/a", "s1"), make("b", "o", "/a", "s2"), make("c", "o", "/b", "s1")];
    expect(transcriptsForSession(list, "/a", "s1").map((t) => t.id)).toEqual(["a"]);
    expect(normalizePaneTranscripts([{ id: "x" }, make("ok")])).toHaveLength(1);
    expect(normalizePaneTranscripts("nope")).toEqual([]);
  });

  it("labels relative save times", () => {
    expect(transcriptTimeLabel(1000, 1000 + 30_000)).toBe("just now");
    expect(transcriptTimeLabel(1000, 1000 + 5 * 60_000)).toBe("5m ago");
    expect(transcriptTimeLabel(1000, 1000 + 2 * 86_400_000)).toBe("2d ago");
  });
});
