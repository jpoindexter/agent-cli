import { describe, expect, it } from "vitest";
import { LAUNCH_PROFILES } from "./launchProfiles";
import { canUseShellProfile, findShellProfile } from "./shellProfileNotice";

describe("canUseShellProfile", () => {
  it("offers the shell fallback only when idle on a non-shell profile", () => {
    expect(canUseShellProfile(false, "codex")).toBe(true);
    expect(canUseShellProfile(true, "codex")).toBe(false);
    expect(canUseShellProfile(false, "shell")).toBe(false);
  });
});

describe("findShellProfile", () => {
  it("resolves the canonical shell launch profile", () => {
    expect(findShellProfile(LAUNCH_PROFILES)?.id).toBe("shell");
    expect(findShellProfile([])).toBeUndefined();
  });
});
