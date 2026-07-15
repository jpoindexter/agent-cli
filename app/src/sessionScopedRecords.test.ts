import { describe, expect, it } from "vitest";
import { planSessionScopedRecordRemoval } from "./sessionScopedRecords";

describe("planSessionScopedRecordRemoval", () => {
  it("removes only the deleted session records and pane context", () => {
    const removed = planSessionScopedRecordRemoval({
      activePanes: { "/repo\none": 1, "/repo\ntwo": 2 },
      browserSessionKey: "/repo\none",
      browserSessions: { "/repo\none": "one", "/repo\ntwo": "two" },
      chatSessionKey: "/repo\none",
      composerHarness: { "/repo\none": { value: 1 }, "/repo\ntwo": { value: 2 } },
      contextKey: "/repo\none",
      conversations: { "/repo\none": { value: 1 }, "/repo\ntwo": { value: 2 } },
      projectPanes: { "/repo\none": [1], "/repo\ntwo": [2] },
    });

    expect(Object.keys(removed.activePanes)).toEqual(["/repo\ntwo"]);
    expect(Object.keys(removed.projectPanes)).toEqual(["/repo\ntwo"]);
    expect(Object.keys(removed.browserSessions)).toEqual(["/repo\ntwo"]);
    expect(Object.keys(removed.composerHarness)).toEqual(["/repo\ntwo"]);
    expect(Object.keys(removed.conversations)).toEqual(["/repo\ntwo"]);
  });
});
