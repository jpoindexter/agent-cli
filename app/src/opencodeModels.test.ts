import { describe, expect, it } from "vitest";

import { normalizeOpenCodeModels } from "./opencodeModels";

describe("OpenCode model discovery", () => {
  it("accepts unique provider/model addresses and rejects malformed IPC data", () => {
    expect(normalizeOpenCodeModels({ models: ["openai/gpt-5.4", " openai/gpt-5.4 ", "google/gemini-3.5-flash", "bad model"] })).toEqual([
      "google/gemini-3.5-flash", "openai/gpt-5.4",
    ]);
    expect(normalizeOpenCodeModels({ models: "openai/gpt-5.4" })).toEqual([]);
  });
});
