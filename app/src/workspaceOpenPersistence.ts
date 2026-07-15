type WorkspaceOpenStore = {
  save: () => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
};

type WorkspaceProjectState = {
  activeSessions: unknown;
  openProjects: unknown;
  sessions: unknown;
  store: WorkspaceOpenStore | null;
};

type WorkspaceOpenSuccessState = WorkspaceProjectState & {
  launchProfile: unknown;
  recentProjects: unknown;
  root: string;
};

export const persistWorkspaceOpenSuccess = async ({
  activeSessions, launchProfile, openProjects, recentProjects, root, sessions, store,
}: WorkspaceOpenSuccessState) => {
  await store?.set("launchProfile", launchProfile);
  await store?.set("folder", root);
  await store?.set("recentFolders", recentProjects);
  await store?.set("openProjects", openProjects);
  await store?.set("projectSessions", sessions);
  await store?.set("activeSessionByProject", activeSessions);
  await store?.save();
};

export const persistWorkspaceOpenFailure = async ({
  activeSessions, openProjects, sessions, store,
}: WorkspaceProjectState) => {
  await store?.set("openProjects", openProjects);
  await store?.set("projectSessions", sessions);
  await store?.set("activeSessionByProject", activeSessions);
  await store?.save();
};
