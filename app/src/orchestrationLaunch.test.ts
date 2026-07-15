import { describe, expect, it } from "vitest";
import { orchestrationLaunchNotice } from "./orchestrationLaunch";

describe("orchestration launch notice", () => {
  it("reports complete and partial launches", () => {
    expect(orchestrationLaunchNotice(2, [])).toBe("Launched 2 parallel child chats");
    expect(orchestrationLaunchNotice(1, ["Agent 2 failed"])).toBe(
      "Launched 1 child chats; 1 need attention",
    );
  });
});
