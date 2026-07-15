import { describe, expect, it } from "vitest";
import { normalizeAgentHookReport } from "./useAgentHookRequests";

describe("agent hook report normalization", () => {
  it("bounds status details, targets, and known card states", () => {
    expect(normalizeAgentHookReport({
      status: " Working ",
      detail: "Done",
      kind: "file",
      state: "running",
      targets: [" src/App.tsx ", 4, ""],
    })).toEqual({
      status: "Working",
      detail: "Done",
      runCardKind: "file",
      runCardStatus: "running",
      targets: ["src/App.tsx"],
    });
  });
});
