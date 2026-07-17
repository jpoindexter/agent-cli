// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAppRootState } from "./useAppRootState";

describe("app root state", () => {
  it("owns root refs and local dialog state outside App", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    const owner = readFileSync("src/useAppRootState.ts", "utf8");

    expect(app).not.toContain("useRef<");
    expect(app).not.toContain("useState<");
    expect(owner).toContain("useRef<");
    expect(owner).toContain("useState<");
  });

  it("starts with closed project dialogs and no workspace or launch error", () => {
    const { result } = renderHook(() => useAppRootState<{ value: string }>());

    expect(result.current.launchError).toBeNull();
    expect(result.current.projectCreationOpen).toBe(false);
    expect(result.current.projectSwitcherOpen).toBe(false);
    expect(result.current.workspacePath).toBeNull();

    act(() => result.current.setProjectSwitcherOpen(true));
    expect(result.current.projectSwitcherOpen).toBe(true);
  });
});
