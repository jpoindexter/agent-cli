import { describe, expect, it } from "vitest";
import { parseUnifiedDiff } from "./diffView";

describe("diff view helpers", () => {
  it("parses unified diff lines, counts, and hunk jump targets", () => {
    const parsed = parseUnifiedDiff(
      [
        "diff --git a/src/app.ts b/src/app.ts",
        "index 111..222 100644",
        "--- a/src/app.ts",
        "+++ b/src/app.ts",
        "@@ -10,3 +10,4 @@",
        " const a = 1;",
        "-const b = 2;",
        "+const b = 3;",
        "+const c = 4;",
        " const d = 5;",
      ].join("\n"),
    );

    expect(parsed.additions).toBe(2);
    expect(parsed.deletions).toBe(1);
    expect(parsed.lines[4]).toMatchObject({ kind: "hunk", oldLine: 10, newLine: 10, hunkNewStart: 10 });
    expect(parsed.lines[6]).toMatchObject({ kind: "delete", oldLine: 11, newLine: null });
    expect(parsed.lines[7]).toMatchObject({ kind: "add", oldLine: null, newLine: 11 });
  });
});
