export const PROJECT_ENTRY_LABELS = {
  newProject: "New Project…",
  newTask: "New Task",
  openProject: "Open Project…",
  switchProject: "Switch Project…",
} as const;

type ProjectEntryDependencies = {
  beginCreateProject?: () => Promise<unknown>;
  createTask: (projectPath: string) => Promise<unknown>;
  getActiveProject: () => string | null;
  openProjectPicker: () => Promise<unknown>;
  switchProjectPath: (projectPath: string) => Promise<unknown>;
};

export const createProjectEntryActions = (dependencies: ProjectEntryDependencies) => ({
  newProject: () => dependencies.beginCreateProject?.() ?? Promise.resolve(false),
  openProject: () => dependencies.openProjectPicker(),
  switchProject: (projectPath: string) => dependencies.switchProjectPath(projectPath),
  newTask: async () => {
    const projectPath = dependencies.getActiveProject();
    if (!projectPath) {
      await dependencies.openProjectPicker();
      return false;
    }
    await dependencies.createTask(projectPath);
    return true;
  },
});
