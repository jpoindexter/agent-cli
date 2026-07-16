import { describe, expect, it, vi } from "vitest";
import { workspaceSideRailPropsFrom } from "./workspaceSideRailHost";

const ref = <T,>(current: T) => ({ current });

const createOptions = () =>
  ({
    activeChat: {
      activeComposerHarness: { approvalMode: "ask" },
      activeComposerHarnessKey: "/repo\nchat",
      activeSessionId: "chat",
    },
    backgroundExits: [],
    browser: { urlRef: ref("http://localhost:3000") },
    composerSettingsActions: { setApprovalMode: vi.fn() },
    contextMenuHost: { openContextMenu: vi.fn() },
    diffReviewHook: { open: vi.fn() },
    drawerActiveTitle: "Files",
    editorFileWorkflow: { requestOpen: vi.fn() },
    editorSession: { fileOpError: null, selectedFile: { id: "a" } },
    editorWorkspace: { visibleFileTree: [] },
    gitStatusHook: { error: null, loading: false, refresh: vi.fn(), status: null },
    openUrl: vi.fn(),
    persistence: {
      expandedSessionProjects: {}, projectSessions: {}, setExpandedSessionProjects: vi.fn(),
      setShowArchivedSessions: vi.fn(), showArchivedSessions: false,
    },
    pickWorkspace: vi.fn(),
    profiles: {},
    projectRailContextMenuItems: () => [],
    projectRailStatus: () => "running",
    projectSessionContextMenuItems: () => [],
    projectSessionNavigationActions: { switchSession: vi.fn() },
    projectSessionStatus: () => "running",
    railBodyRef: ref(null),
    railHeight: 100,
    requestOpenWorkspace: vi.fn(),
    setSettingsOpen: vi.fn(),
    shellLayout: {
      agentSurfaceMode: "chat", renderedWorkbenchLayout: "hidden", setAgentSurfaceMode: vi.fn(),
      setSideDrawerCollapsed: vi.fn(), setSideDrawerMode: vi.fn(), setToolTrayMode: vi.fn(), setWorkbenchLayout: vi.fn(),
      sideDrawerCollapsed: false, sideDrawerMode: "files", toolTrayMode: "files", workbenchLayout: "hidden",
      viewportWidth: 900,
    },
    treeRef: ref(undefined),
    utilityTrayControls: { toggleRawTerminal: vi.fn() },
    visibleOpenProjects: [],
    workspaceContextMenuItems: () => [],
    workspaceFileActions: { createFile: vi.fn(), createFolder: vi.fn() },
    workspacePath: "/repo",
    workspaceTree: { error: null, loading: false, refresh: vi.fn(), tree: [], truncated: false },
  }) as unknown as Parameters<typeof workspaceSideRailPropsFrom>[0];

describe("workspaceSideRailPropsFrom", () => {
  it("assembles the rail drawer props from grouped bundles", () => {
    const props = workspaceSideRailPropsFrom(createOptions());

    expect(props.activeTitle).toBe("Files");
    expect(props.collapsed).toBe(false);
    expect(props.mode).toBe("files");
    expect(props.projects.activeProjectPath).toBe("/repo");
    expect(props.projects.activeSessionId).toBe("chat");
    expect(props.git.hasWorkspace).toBe(true);
    expect(props.files.workspaceName).toBe("repo");
    expect(props.settings.hasWorkspace).toBe(true);
  });

  it("routes rail actions to their owning controllers", () => {
    const options = createOptions();
    const props = workspaceSideRailPropsFrom(options);

    props.onOpenSettings();
    expect(options.setSettingsOpen).toHaveBeenCalledWith(true);
    props.projects.onSelectSession("/repo", "chat");
    expect(options.projectSessionNavigationActions.switchSession).toHaveBeenCalledWith("/repo", "chat");
    expect(options.shellLayout.setSideDrawerCollapsed).toHaveBeenCalledWith(true);
    void props.git.onRefresh();
    expect(options.gitStatusHook.refresh).toHaveBeenCalled();
  });
});
