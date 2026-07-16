// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { useWorkspaceDomain } from "./useWorkspaceDomain";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(async () => ({ nodes: [], truncated: false })) }));

const createOptions = () => ({
  activeSessionLookupRef: { current: (() => null) as (root: string | null) => string | null },
  persistPaneLayoutRef: {
    current: (() => {}) as (root: string, sessionId: string, panes: ManagedTerminalPane[]) => void,
  },
  storeRef: { current: null },
  workspacePath: null,
  workspacePathRef: { current: null as string | null },
});

describe("useWorkspaceDomain", () => {
  it("returns the six workspace hook bundles", () => {
    const { result } = renderHook(() => useWorkspaceDomain(createOptions()));

    expect(result.current.composerWorkspace.scopedSettingsRef).toBeDefined();
    expect(result.current.editorSession.activeFilesByWorkspaceRef).toBeDefined();
    expect(result.current.persistence.projectSessionsRef).toBeDefined();
    expect(result.current.profiles.launchProfileRef).toBeDefined();
    expect(result.current.terminal.paneLayoutsRef).toBeDefined();
    expect(result.current.workspaceTree.tree).toEqual([]);
  });

  it("wires the session lookup and pane layout refs to the persistence controller", () => {
    const options = createOptions();
    const { result } = renderHook(() => useWorkspaceDomain(options));

    expect(options.activeSessionLookupRef.current).toBe(result.current.persistence.activeSessionForProject);
    expect(options.persistPaneLayoutRef.current).toBe(result.current.persistence.persistPaneLayout);
  });
});
