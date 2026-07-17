import { describe, expect, it } from "vitest";

import { composerModelGroups, filterComposerModelGroups } from "./composerModels";

describe("composer model catalog", () => {
  it("groups provider defaults with configured and current models without duplicates", () => {
    const groups = composerModelGroups({ codex: "gpt-5.6-sol", claude: "sonnet" }, "codex", "gpt-5.6-sol", []);
    const choices = groups.flatMap((group) => group.choices);
    expect(choices.filter((choice) => choice.provider === "codex" && choice.id === "gpt-5.6-sol")).toHaveLength(1);
    expect(choices.find((choice) => choice.id === "gpt-5.6-sol")).toMatchObject({ current: true, configured: true });
  });

  it("searches provider names, model IDs, and metadata", () => {
    const groups = composerModelGroups({}, "codex", "", []);
    expect(filterComposerModelGroups(groups, "claude").every((group) => group.provider === "claude")).toBe(true);
    expect(filterComposerModelGroups(groups, "5.6").flatMap((group) => group.choices).map((choice) => choice.id)).toContain("gpt-5.6-sol");
  });

  it("turns OpenCode addresses into provider groups with a catalog fallback", () => {
    const groups = composerModelGroups(
      { opencode: "google/gemini-3.5-flash" },
      "opencode",
      "openai/gpt-5.4-mini",
      ["google/gemini-3.5-flash", "openai/gpt-5.4", "openai/gpt-5.4-mini"],
    );
    expect(groups.map((group) => group.label)).toEqual(expect.arrayContaining(["Google", "OpenAI"]));
    expect(groups.find((group) => group.label === "Google")?.choices[0]).toMatchObject({
      provider: "opencode", id: "google/gemini-3.5-flash", configured: true,
    });
    expect(groups.find((group) => group.label === "OpenAI")?.choices.find((choice) => choice.current)).toMatchObject({ id: "openai/gpt-5.4-mini" });
    expect(groups.find((group) => group.label === "OpenCode")?.choices).toContainEqual(expect.objectContaining({ id: "" }));
  });
});
