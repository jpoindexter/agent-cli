import { describe, expect, it, vi } from "vitest";
import { createWorkspaceOpenActions } from "./workspaceOpenActions";

const file = { id: "/repo/a.ts", kind: "file" as const, name: "a.ts", path: "/repo/a.ts" };

const createOptions = () => {
  const calls: string[] = [];
  const profile = { id: "codex" };
  const opened = { root: "/next" };
  const options = {
    applyOpened: vi.fn(() => calls.push("apply")),
    captureCurrentSession: vi.fn(() => calls.push("capture")),
    clearBackgroundExits: vi.fn((path: string) => calls.push(`clear:${path}`)),
    completeOpened: vi.fn(async () => { calls.push("complete"); }),
    confirmDiscard: vi.fn(async () => true),
    dirtyTabPaths: [] as string[],
    editorDirty: false,
    editorTabs: [file],
    flushComposer: vi.fn(async () => { calls.push("flush"); }),
    getDefaultProfile: vi.fn(() => profile),
    getPreviousActivePaneId: vi.fn(() => 7 as number | null),
    getPreviousPanes: vi.fn(() => [{ id: 7 }]),
    getPreviousRoot: vi.fn(() => "/previous" as string | null),
    getSelectedFilePath: vi.fn(() => null as string | null),
    getStore: vi.fn(() => ({ id: "store" })),
    handleError: vi.fn(async () => {}),
    openEditorFile: vi.fn(async () => {}),
    openTarget: vi.fn(async () => { calls.push("open"); return opened; }),
    setFocusedPane: vi.fn(() => calls.push("clear-focus")),
  };
  return { calls, opened, options, profile };
};

describe("createWorkspaceOpenActions", () => {
  it("opens directly with the current default profile", async () => {
    const { calls, opened, options, profile } = createOptions();
    const actions = createWorkspaceOpenActions(options);

    const result = await actions.openWorkspaceDirect("/next");

    expect(result).toBe(true);
    expect(calls).toEqual(["flush", "capture", "clear-focus", "open", "apply", "complete"]);
    expect(options.completeOpened).toHaveBeenCalledWith(
      opened, profile, "/previous", { id: "store" },
    );
  });

  it("can open directly without capturing the current session", async () => {
    const { options } = createOptions();
    const actions = createWorkspaceOpenActions(options);

    await actions.openWorkspaceDirect("/next", undefined, { captureCurrentSession: false });

    expect(options.captureCurrentSession).not.toHaveBeenCalled();
  });

  it("clears background exits before deferring a dirty-tab workspace request", async () => {
    const { calls, options } = createOptions();
    options.dirtyTabPaths = [file.path];
    options.editorDirty = true;
    options.getSelectedFilePath.mockReturnValue("/repo/b.ts");
    const actions = createWorkspaceOpenActions(options);
    const deferNavigation = vi.fn(() => calls.push("defer"));

    const result = await actions.requestOpenWorkspace("/next", deferNavigation);

    expect(result).toBe(false);
    expect(options.openEditorFile).toHaveBeenCalledWith(file);
    expect(calls).toEqual(["clear:/next", "defer"]);
    expect(options.openTarget).not.toHaveBeenCalled();
  });
});
