// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useProjectEntryOpenState } from "./useProjectEntryOpenState";

describe("useProjectEntryOpenState", () => {
  it("tracks loading through a successful project open", async () => {
    let finish: ((value: boolean) => void) | undefined;
    const operation = new Promise<boolean>((resolve) => { finish = resolve; });
    const { result } = renderHook(() => useProjectEntryOpenState());
    let pending: Promise<boolean>;

    act(() => { pending = result.current.track("/repo", () => operation); });
    expect(result.current.status).toEqual({ kind: "loading", path: "/repo" });
    await act(async () => { finish?.(true); await pending; });

    expect(result.current.status).toEqual({ kind: "idle" });
  });

  it("preserves a lifecycle-reported error for retry", async () => {
    const { result } = renderHook(() => useProjectEntryOpenState());

    await act(async () => {
      await result.current.track("/missing", async () => {
        result.current.reportError("Project folder is unavailable");
        return false;
      });
    });

    expect(result.current.status).toEqual({ kind: "error", path: "/missing", message: "Project folder is unavailable" });
  });
});
