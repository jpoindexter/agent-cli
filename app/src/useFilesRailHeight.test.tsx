// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import { describe, expect, it, vi } from "vitest";

import { useFilesRailHeight, type RailResizeObserver } from "./useFilesRailHeight";

describe("useFilesRailHeight", () => {
  it("measures the active files rail and disconnects observation", () => {
    const disconnect = vi.fn();
    const observe: RailResizeObserver = vi.fn(() => disconnect);
    const element = { getBoundingClientRect: () => ({ height: 333.8 }) } as HTMLDivElement;
    const railRef = { current: element } as RefObject<HTMLDivElement>;

    const { result, unmount } = renderHook(() => useFilesRailHeight(true, railRef, observe));

    expect(result.current).toBe(333);
    expect(observe).toHaveBeenCalledWith(element, expect.any(Function));
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
