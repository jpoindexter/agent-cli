import { describe, expect, it, vi } from "vitest";
import { draftNavigationPropsFrom } from "./draftNavigationHost";
import type { FileTreeNode } from "./fileTreeTypes";

const file: FileTreeNode = { id: "1", kind: "file", name: "notes.md", path: "/repo/notes.md" };

const createInput = () => ({
  cancel: vi.fn(),
  discard: vi.fn(async () => {}),
  error: null as string | null,
  hasPendingNavigation: true,
  save: vi.fn(async () => {}),
  saving: false,
  selectedFile: file as FileTreeNode | null,
});

describe("draftNavigationPropsFrom", () => {
  it("builds dialog props for the pending file", () => {
    const input = createInput();
    const props = draftNavigationPropsFrom(input);

    expect(props?.fileName).toBe("notes.md");

    props?.onDiscard();
    expect(input.discard).toHaveBeenCalled();
  });

  it("stays hidden without a pending navigation or selected file", () => {
    const input = createInput();
    expect(draftNavigationPropsFrom({ ...input, hasPendingNavigation: false })).toBeNull();
    expect(draftNavigationPropsFrom({ ...input, selectedFile: null })).toBeNull();
  });
});
