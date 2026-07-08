import { describe, expect, it } from "vitest";
import { shouldPromptForDirtyDraft } from "./draftProtection";

describe("dirty draft navigation protection", () => {
  it("does not interrupt clean navigation", () => {
    expect(shouldPromptForDirtyDraft(false, "/work/src/App.tsx", { kind: "file", path: "/work/src/Other.tsx" })).toBe(false);
    expect(shouldPromptForDirtyDraft(false, "/work/src/App.tsx", { kind: "workspace", path: "/other" })).toBe(false);
  });

  it("does not interrupt refocusing the same dirty file", () => {
    expect(shouldPromptForDirtyDraft(true, "/work/src/App.tsx", { kind: "file", path: "/work/src/App.tsx" })).toBe(false);
  });

  it("requires a decision before replacing a dirty file or workspace", () => {
    expect(shouldPromptForDirtyDraft(true, "/work/src/App.tsx", { kind: "file", path: "/work/src/Other.tsx" })).toBe(true);
    expect(shouldPromptForDirtyDraft(true, "/work/src/App.tsx", { kind: "workspace", path: "/other" })).toBe(true);
  });
});
