import type { ManagedTerminalPane } from "./managedTerminalPane";
import { useComposerWorkspaceState } from "./useComposerWorkspaceState";
import { useEditorSessionController } from "./useEditorSessionController";
import { useLaunchProfileController } from "./useLaunchProfileController";
import { useTerminalPaneController } from "./useTerminalPaneController";
import { useWorkspacePersistenceController } from "./useWorkspacePersistenceController";
import { useWorkspaceTree } from "./useWorkspaceTree";
import { activeProjectSessionId } from "./workspaceState";

type Ref<T> = { current: T };

type WorkspaceDomainOptions = {
  activeSessionLookupRef: Ref<(root: string | null) => string | null>;
  persistPaneLayoutRef: Ref<(
    root: string, sessionId: string, panes: ManagedTerminalPane[],
  ) => void>;
  storeRef: Parameters<typeof useWorkspacePersistenceController>[0]["store"];
  workspacePath: string | null;
  workspacePathRef: Ref<string | null>;
};

export const useWorkspaceDomain = <TSnapshot,>(options: WorkspaceDomainOptions) => {
  const { activeSessionLookupRef, persistPaneLayoutRef, storeRef, workspacePathRef } = options;
  const composerWorkspace = useComposerWorkspaceState({
    getRoot: () => workspacePathRef.current,
    getSessionId: (root) => activeProjectSessionId(
      persistence.activeSessionByProjectRef.current, persistence.projectSessionsRef.current, root,
    ),
    saveStore: async () => { await storeRef.current?.save(); },
    setStoreValue: async (key, value) => { await storeRef.current?.set(key, value); },
  });
  const editorSession = useEditorSessionController();
  const terminal = useTerminalPaneController<TSnapshot>({
    activeSessionForProject: (root) => activeSessionLookupRef.current(root),
    activeWorkspace: workspacePathRef,
    persistPaneLayout: (root, sessionId, panes) => {
      persistPaneLayoutRef.current(root, sessionId, panes);
    },
  });
  const workspaceTree = useWorkspaceTree({
    onClearWorkspace: () => editorSession.resetEditor(),
    onRootResolved: (root) => { workspacePathRef.current = root; },
    workspacePath: options.workspacePath,
  });
  const persistence = useWorkspacePersistenceController({
    activeFiles: editorSession.activeFilesByWorkspaceRef,
    getPanes: (root, sessionId) => terminal.panesForSession(root, sessionId),
    paneLabels: terminal.paneLabelsRef,
    paneLayouts: terminal.paneLayoutsRef,
    sessionSnapshots: editorSession.sessionEditorSnapshotsRef,
    setPaneLabels: terminal.setPaneLabels,
    store: storeRef,
  });
  activeSessionLookupRef.current = persistence.activeSessionForProject;
  persistPaneLayoutRef.current = persistence.persistPaneLayout;
  const profiles = useLaunchProfileController({
    getCurrentRoot: () => workspacePathRef.current,
    getCurrentSessionId: () => persistence.activeSessionForProject(workspacePathRef.current),
    randomId: () => crypto.randomUUID(),
    saveStore: async () => { await storeRef.current?.save(); },
    scopedSettings: composerWorkspace.scopedSettingsRef,
    setScopedSettings: composerWorkspace.setScopedSettings,
    setStoreValue: async (key, value) => { await storeRef.current?.set(key, value); },
  });
  return { composerWorkspace, editorSession, persistence, profiles, terminal, workspaceTree };
};
