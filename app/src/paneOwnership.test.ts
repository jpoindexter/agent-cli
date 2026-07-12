import { describe, expect, it } from "vitest";
import {
  paneContextBelongsToProject,
  paneContextKey,
  paneContextParts,
  removeProjectPaneContexts,
} from "./paneOwnership";

describe("pane ownership", () => {
  it("keys live panes by project and session", () => {
    expect(paneContextKey("/repo", "session-one")).toBe("/repo\nsession-one");
    expect(paneContextKey("/repo", null)).toBeNull();
    expect(paneContextParts("/repo\nsession-one")).toEqual({
      projectRoot: "/repo",
      sessionId: "session-one",
    });
  });

  it("keeps same-project sessions independent", () => {
    const contexts: Record<string, number[]> = {
      "/repo\none": [1, 2],
      "/repo\ntwo": [3],
      "/other\none": [4],
    };

    expect(contexts[paneContextKey("/repo", "one")!]).toEqual([1, 2]);
    expect(contexts[paneContextKey("/repo", "two")!]).toEqual([3]);
    expect(paneContextBelongsToProject("/repo\ntwo", "/repo")).toBe(true);
    expect(removeProjectPaneContexts(contexts, "/repo")).toEqual({ "/other\none": [4] });
  });

  it("rejects malformed context keys", () => {
    expect(paneContextParts("/repo")).toBeNull();
    expect(paneContextParts("\nsession")).toBeNull();
    expect(paneContextParts("/repo\n")).toBeNull();
  });
});
