import { describe, expect, it } from "vitest";
import {
  normalizePaneLayoutsBySession,
  normalizeSessionEditorSnapshots,
  paneLayoutFromPanes,
} from "./sessionRestore";

describe("session restore helpers", () => {
  it("normalizes persisted editor snapshots", () => {
    expect(
      normalizeSessionEditorSnapshots({
        "root\none": {
          tabs: [
            { id: "a", name: "a.ts", path: "/repo/a.ts", kind: "file", dirty: true },
            { id: "bad", name: "bad", path: "/repo", kind: "directory" },
          ],
          activePath: "/repo/a.ts",
          buffers: {
            "/repo/a.ts": {
              text: "draft",
              savedText: "saved",
              bytes: 11,
              modifiedMs: 22,
              error: "stale",
              recoveryError: null,
            },
            "/repo/bad.ts": { text: 1, savedText: "" },
          },
          viewStates: {
            "/repo/a.ts": { anchor: 4, head: 8, scrollTop: 12, focused: true },
            "/repo/bad.ts": { anchor: Number.NaN, head: 0, scrollTop: 0, focused: false },
          },
        },
        "": { tabs: [] },
      }),
    ).toEqual({
      "root\none": {
        tabs: [{ id: "a", name: "a.ts", path: "/repo/a.ts", kind: "file", dirty: true }],
        activePath: "/repo/a.ts",
        buffers: {
          "/repo/a.ts": {
            text: "draft",
            savedText: "saved",
            bytes: 11,
            modifiedMs: 22,
            error: "stale",
            recoveryError: null,
          },
        },
        viewStates: {
          "/repo/a.ts": { anchor: 4, head: 8, scrollTop: 12, focused: true },
        },
      },
    });
  });

  it("normalizes pane layouts by session", () => {
    expect(
      normalizePaneLayoutsBySession({
        "root\none": [
          { slot: 1, profileId: "gemini", label: " Review " },
          { slot: 1, profileId: "claude", label: "Later wins" },
          { slot: -1, profileId: "codex", label: "bad" },
          { slot: 0, profileId: "unknown", label: "" },
        ],
      }),
    ).toEqual({
      "root\none": [
        { slot: 0, profileId: "codex", label: null },
        { slot: 1, profileId: "claude", label: "Later wins" },
      ],
    });
  });

  it("captures pane layout from live panes", () => {
    expect(
      paneLayoutFromPanes([
        { slot: 2, profile: { id: "shell" }, label: "Logs" },
        { slot: 0, profile: { id: "codex" }, label: null },
      ]),
    ).toEqual([
      { slot: 0, profileId: "codex", label: null },
      { slot: 2, profileId: "shell", label: "Logs" },
    ]);
  });
});
