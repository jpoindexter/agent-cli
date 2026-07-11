export const WORKSPACE_SCHEMA_VERSION = 1;

type StoreData = Record<string, unknown>;

export type WorkspaceMigrationResult = {
  data: StoreData;
  fromVersion: number;
  migrated: boolean;
};

/* Each step upgrades exactly one version and must never delete keys it does
   not understand — downgrade safety means an older app can still read what
   it recognizes after a newer app touched the store. */
const MIGRATIONS: Record<number, (data: StoreData) => StoreData> = {
  // v0 -> v1: first versioned schema. The read-path normalizers already
  // dedupe recents in memory; v1 makes the stored shape canonical.
  0: (data) => {
    const next = { ...data };
    if (Array.isArray(next.recentFolders)) {
      const seen = new Set<string>();
      next.recentFolders = next.recentFolders.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0 && !seen.has(value) && Boolean(seen.add(value)),
      );
    }
    return next;
  },
};

export const readWorkspaceSchemaVersion = (data: StoreData): number => {
  const value = data.schemaVersion;
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
};

export const migrateWorkspaceStore = (data: StoreData): WorkspaceMigrationResult => {
  const fromVersion = readWorkspaceSchemaVersion(data);
  if (fromVersion >= WORKSPACE_SCHEMA_VERSION) {
    return { data, fromVersion, migrated: false };
  }
  let next: StoreData = { ...data };
  for (let version = fromVersion; version < WORKSPACE_SCHEMA_VERSION; version += 1) {
    const step = MIGRATIONS[version];
    if (step) next = step(next);
  }
  next.schemaVersion = WORKSPACE_SCHEMA_VERSION;
  return { data: next, fromVersion, migrated: true };
};
