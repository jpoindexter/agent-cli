import { describe, expect, it } from "vitest";

import { migrateWorkspaceStore, readWorkspaceSchemaVersion, WORKSPACE_SCHEMA_VERSION } from "./workspaceMigrations";

describe("workspace store migrations", () => {
  it("stamps unversioned stores, dedupes recents, and preserves unknown keys", () => {
    const legacy = {
      recentFolders: ["/a", "/b", "/a", "", 42],
      launchProfile: { id: "shell" },
      someFutureKey: { keep: true },
    };

    const result = migrateWorkspaceStore(legacy);

    expect(result.migrated).toBe(true);
    expect(result.fromVersion).toBe(0);
    expect(result.data.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION);
    expect(result.data.recentFolders).toEqual(["/a", "/b"]);
    expect(result.data.someFutureKey).toEqual({ keep: true });
    expect(result.data.launchProfile).toEqual({ id: "shell" });
  });

  it("leaves current-version stores untouched", () => {
    const current = { schemaVersion: WORKSPACE_SCHEMA_VERSION, recentFolders: ["/a", "/a"] };

    const result = migrateWorkspaceStore(current);

    expect(result.migrated).toBe(false);
    expect(result.data).toBe(current);
  });

  it("treats garbage versions as unversioned", () => {
    expect(readWorkspaceSchemaVersion({ schemaVersion: "2" })).toBe(0);
    expect(readWorkspaceSchemaVersion({ schemaVersion: -1 })).toBe(0);
    expect(readWorkspaceSchemaVersion({ schemaVersion: 1.5 })).toBe(0);
    expect(readWorkspaceSchemaVersion({})).toBe(0);
  });
});
