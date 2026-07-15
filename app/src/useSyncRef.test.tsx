// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { useSyncRef } from "./useSyncRef";

describe("useSyncRef", () => {
  it("mirrors each committed value into the caller-owned ref", () => {
    const ref = createRef<number>();
    const { rerender } = renderHook(
      ({ value }) => useSyncRef(ref, value),
      { initialProps: { value: 1 } },
    );

    expect(ref.current).toBe(1);
    rerender({ value: 2 });

    expect(ref.current).toBe(2);
  });
});
