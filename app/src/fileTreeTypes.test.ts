import { describe, expect, it } from "vitest";
import { fileTreeNodeFromPath, pathBasename } from "./fileTreeTypes";

describe("pathBasename", () => {
  it("returns the last path segment across separators", () => {
    expect(pathBasename("/repo/src/main.ts")).toBe("main.ts");
    expect(pathBasename("C:\\repo\\main.ts")).toBe("main.ts");
    expect(pathBasename("/repo/src/")).toBe("src");
    expect(pathBasename("")).toBe("");
  });
});

describe("fileTreeNodeFromPath", () => {
  it("builds a synthetic node keyed by its absolute path", () => {
    expect(fileTreeNodeFromPath("/repo/docs/notes.md", "file")).toEqual({
      id: "/repo/docs/notes.md", kind: "file", name: "notes.md", path: "/repo/docs/notes.md",
    });
  });
});
