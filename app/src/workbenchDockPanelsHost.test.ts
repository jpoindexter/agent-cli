import { describe, expect, it, vi } from "vitest";
import { workbenchDockPanelsPropsFrom } from "./workbenchDockPanelsHost";

const file = { id: "a", name: "a.ts", path: "src/a.ts", kind: "file" as const };

const createOptions = () =>
  ({
    activeChat: {
      activeChatConversation: {
        messages: [{ id: "m1" }], runStatus: "running",
        usage: { inputTokens: 800, cachedInputTokens: 0, outputTokens: 100 },
      },
      activeComposerProviderLabel: "Codex",
    },
    browser: { url: "http://localhost:4173" },
    contextMenuHost: { openContextMenu: vi.fn() },
    diffReviewHook: { open: vi.fn() },
    drawerSearchQuery: "term",
    drawerSearchResults: [file],
    editorFileWorkflow: { requestOpen: vi.fn() },
    editorWorkspace: { searchableFiles: [file] },
    editorSession: { selectedFile: file },
    gitStatusHook: { error: null, loading: false, refresh: vi.fn(), status: null },
    setDrawerSearchQuery: vi.fn(),
    surfaceLabels: { activeSessionTitle: "Implement demo" },
    workspaceContextMenuActions: {},
    workspaceFileActions: { createFile: vi.fn(), createFolder: vi.fn() },
    workspacePath: "/repo",
    workspaceTree: { error: null, loading: false, refresh: vi.fn() },
  }) as unknown as Parameters<typeof workbenchDockPanelsPropsFrom>[0];

describe("workbenchDockPanelsPropsFrom", () => {
  it("maps search and git panel state onto dock props", () => {
    const props = workbenchDockPanelsPropsFrom(createOptions());

    expect(props.files.query).toBe("term");
    expect(props.files.selectedFilePath).toBe("src/a.ts");
    expect(props.git.status).toBeNull();
    expect(props.workspacePath).toBe("/repo");
    expect(props.context).toEqual({
      session: { title: "Implement demo", provider: "Codex", status: "running", messages: 1, usageTokens: 900 },
      workspace: { path: "/repo", branch: null, changedFiles: 0 },
      tools: { activeFile: "src/a.ts", browserUrl: "http://localhost:4173" },
    });
  });

  it("routes dock handlers to file and git controllers", () => {
    const options = createOptions();
    const props = workbenchDockPanelsPropsFrom(options);

    props.handlers.createFile();
    expect(options.workspaceFileActions.createFile).toHaveBeenCalled();
    props.handlers.openFile(file);
    expect(options.editorFileWorkflow.requestOpen).toHaveBeenCalledWith(file, { focusEditor: true });
    props.handlers.setQuery("next");
    expect(options.setDrawerSearchQuery).toHaveBeenCalledWith("next");
  });
});
