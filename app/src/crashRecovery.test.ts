import { describe, expect, it } from "vitest";

import { crashRecoveryMessage, deriveCrashRecovery } from "./crashRecovery";

describe("crash recovery detection", () => {
  it("claims recovery only when a stale lock coincides with restorable projects", () => {
    expect(deriveCrashRecovery(true, 2).recovered).toBe(true);
    expect(deriveCrashRecovery(true, 0).recovered).toBe(false);
    expect(deriveCrashRecovery(false, 3).recovered).toBe(false);
    expect(deriveCrashRecovery(false, 0).recovered).toBe(false);
  });

  it("messages the recovered project count, or nothing on a clean start", () => {
    expect(crashRecoveryMessage(deriveCrashRecovery(true, 1))).toBe(
      "Recovered from an unexpected shutdown — reopened 1 project.",
    );
    expect(crashRecoveryMessage(deriveCrashRecovery(true, 4))).toContain("4 projects");
    expect(crashRecoveryMessage(deriveCrashRecovery(false, 2))).toBeNull();
  });
});
