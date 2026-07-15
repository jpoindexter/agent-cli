import { describe, expect, it } from "vitest";
import { shouldRenameChatSession } from "./composerSubmission";

describe("shouldRenameChatSession", () => {
  it("renames only default chat titles", () => {
    expect(shouldRenameChatSession("Current work")).toBe(true);
    expect(shouldRenameChatSession("New chat 3")).toBe(true);
    expect(shouldRenameChatSession("New session")).toBe(true);
    expect(shouldRenameChatSession("Fix terminal resize")).toBe(false);
  });
});
