import { describe, expect, it, vi } from "vitest";
import { createProjectSessionMetadataActions } from "./projectSessionMetadataActions";
import type { ProjectSession, ProjectSessionsByProject } from "./workspaceStateTypes";

const session = (id: string, extra: Partial<ProjectSession> = {}): ProjectSession => ({
  id, status: "running", title: `Chat ${id}`, updatedAt: 1, ...extra,
});

const createOptions = (sessions: ProjectSessionsByProject) => {
  const sessionsRef = { current: sessions };
  return {
    options: {
      getActiveSessions: vi.fn(() => ({ "/repo": "a" })),
      getSessions: vi.fn(() => sessionsRef.current),
      notify: vi.fn(),
      now: vi.fn(() => 99),
      persist: vi.fn(async () => {}),
    },
    sessionsRef,
  };
};

describe("createProjectSessionMetadataActions", () => {
  it("merges metadata into one session and persists with a fresh timestamp", async () => {
    const { options } = createOptions({ "/repo": [session("a"), session("b")] });
    const actions = createProjectSessionMetadataActions(options);

    await actions.updateSessionMetadata("/repo", "b", { title: "Renamed" });

    expect(options.persist).toHaveBeenCalledWith(
      {
        "/repo": [
          session("a"),
          { ...session("b"), title: "Renamed", updatedAt: 99 },
        ],
      },
      { "/repo": "a" },
    );
  });

  it("archives a session and skips persistence when nothing changes", async () => {
    const { options } = createOptions({ "/repo": [session("a"), session("b")] });
    const actions = createProjectSessionMetadataActions(options);

    await actions.archiveSession("/repo", session("b"), true);
    expect(options.persist).toHaveBeenCalledTimes(1);

    await actions.archiveSession("/missing", session("b"), true);
    expect(options.persist).toHaveBeenCalledTimes(1);
  });

  it("pins a session and announces the change", async () => {
    const { options } = createOptions({ "/repo": [session("a")] });
    const actions = createProjectSessionMetadataActions(options);

    await actions.pinSession("/repo", session("a"), true);

    expect(options.persist).toHaveBeenCalled();
    expect(options.notify).toHaveBeenCalledWith("Pinned Chat a");

    await actions.pinSession("/repo", session("a"), false);
    expect(options.notify).toHaveBeenCalledWith("Unpinned Chat a");
  });
});
