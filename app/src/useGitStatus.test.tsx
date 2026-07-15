// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useGitStatus, type GitStatusResponse } from "./useGitStatus";

const cleanStatus: GitStatusResponse = {
  ahead: 0,
  behind: 0,
  branch: "main",
  files: [],
  isRepository: true,
  staged: 0,
  unstaged: 0,
  untracked: 0,
};

describe("useGitStatus", () => {
  it("refreshes the active workspace and records its root", async () => {
    const readStatus = vi.fn().mockResolvedValue(cleanStatus);
    const { result } = renderHook(() => useGitStatus({
      active: true,
      readStatus,
      refreshKey: 0,
      resolveRoot: () => "/workspace",
      workspacePath: "/workspace",
    }));

    await waitFor(() => expect(result.current.status).toEqual(cleanStatus));

    expect(readStatus).toHaveBeenCalledWith("/workspace");
    expect(result.current.root).toBe("/workspace");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("clears stale status when refresh has no workspace", async () => {
    const { result } = renderHook(() => useGitStatus({
      active: false,
      readStatus: vi.fn(),
      refreshKey: 0,
      resolveRoot: () => null,
      workspacePath: null,
    }));

    act(() => result.current.setStatus(cleanStatus));
    await act(() => result.current.refresh());

    expect(result.current.status).toBeNull();
    expect(result.current.root).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
