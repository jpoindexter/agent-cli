import { describe, expect, it, vi } from "vitest";
import {
  persistWorkspaceOpenFailure,
  persistWorkspaceOpenSuccess,
} from "./workspaceOpenPersistence";

const recordingStore = (operations: string[]) => ({
  save: vi.fn(async () => { operations.push("save"); }),
  set: vi.fn(async (key: string) => { operations.push(`set:${key}`); }),
});

describe("workspace open persistence", () => {
  it("persists successful workspace state in order", async () => {
    const operations: string[] = [];
    await persistWorkspaceOpenSuccess({
      activeSessions: {}, launchProfile: { id: "shell" }, openProjects: [],
      recentProjects: [], root: "/repo", sessions: {},
      store: recordingStore(operations),
    });

    expect(operations).toEqual([
      "set:launchProfile", "set:folder", "set:recentFolders",
      "set:openProjects", "set:projectSessions",
      "set:activeSessionByProject", "save",
    ]);
  });

  it("persists recoverable failure state in order", async () => {
    const operations: string[] = [];
    await persistWorkspaceOpenFailure({
      activeSessions: {}, openProjects: [], sessions: {},
      store: recordingStore(operations),
    });

    expect(operations).toEqual([
      "set:openProjects", "set:projectSessions",
      "set:activeSessionByProject", "save",
    ]);
  });
});
