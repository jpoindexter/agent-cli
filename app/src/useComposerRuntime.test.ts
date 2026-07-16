// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useComposerRuntime } from "./useComposerRuntime";

const attachWorkspaceFile = vi.fn();
vi.mock("./useComposerLocalState", () => ({
  useComposerLocalState: () => ({ draft: "hello @src/a", updateHarness: vi.fn() }),
}));
vi.mock("./useComposerAttachments", () => ({
  useComposerAttachments: () => ({ attachWorkspaceFile }),
}));

const ref = <T,>(current: T) => ({ current });
const file = { id: "a", name: "a.ts", path: "src/a.ts", kind: "file" as const };

const createOptions = () =>
  ({
    activeChat: { activeComposerHarness: {}, activeComposerHarnessKey: "/repo\nchat" },
    agentActivityHook: { gateAppAction: vi.fn() },
    browser: { urlRef: ref("http://localhost:3000") },
    composerWorkspace: { composerHarnessBySessionRef: ref({}), persistComposerHarnessRecords: vi.fn() },
    editorSession: { selectedFile: file },
    logEvent: vi.fn(),
    profiles: { launchProfileRef: ref({ id: "codex" }) },
    searchableFiles: [file],
    setError: vi.fn(),
    setNotice: vi.fn(),
    shellLayout: { agentSurfaceMode: "chat" },
    workspacePathRef: ref("/repo"),
  }) as unknown as Parameters<typeof useComposerRuntime>[0];

describe("useComposerRuntime", () => {
  it("derives the mention query and results from the local draft", () => {
    const { result } = renderHook(() => useComposerRuntime(createOptions()));

    expect(result.current.composerMentionQuery).toBe("src/a");
    expect(result.current.composerMentionResults).toEqual([file]);
  });

  it("attaches the selected editor file through the attachments controller", () => {
    const { result } = renderHook(() => useComposerRuntime(createOptions()));

    void result.current.attachSelectedFileToComposer();
    expect(attachWorkspaceFile).toHaveBeenCalledWith(file);
  });
});
