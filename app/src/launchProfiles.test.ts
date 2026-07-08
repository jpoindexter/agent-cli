import { describe, expect, it } from "vitest";
import {
  LAUNCH_PROFILES,
  launchProfileById,
  launchProfileCommandLine,
  launchProfileSummary,
  normalizeLaunchProfile,
} from "./launchProfiles";

describe("launch profiles", () => {
  it("defines Claude, Codex, and shell profiles", () => {
    expect(LAUNCH_PROFILES.map((profile) => profile.id)).toEqual(["claude", "codex", "shell"]);
    expect(launchProfileById("claude").command).toBe("claude");
    expect(launchProfileById("codex").command).toBe("codex");
    expect(launchProfileById("shell")).toMatchObject({ command: "/bin/zsh", args: ["-l"], useLoginShell: false });
  });

  it("normalizes known stored profile ids back to the built-in profile", () => {
    expect(normalizeLaunchProfile({ id: "codex", command: "stale-codex", args: ["bad"] })).toEqual(
      launchProfileById("codex"),
    );
  });

  it("falls back to Claude for missing or empty profile data", () => {
    expect(normalizeLaunchProfile(null)).toEqual(launchProfileById("claude"));
    expect(normalizeLaunchProfile({ id: "broken", command: "" })).toEqual(launchProfileById("claude"));
  });

  it("keeps custom stored profiles valid for future settings", () => {
    expect(
      normalizeLaunchProfile({
        id: "custom",
        label: "Custom Agent",
        command: "custom-agent",
        args: ["--fast"],
        useLoginShell: false,
      }),
    ).toEqual({
      id: "custom",
      label: "Custom Agent",
      command: "custom-agent",
      args: ["--fast"],
      useLoginShell: false,
    });
  });

  it("formats visible command details", () => {
    expect(launchProfileCommandLine(launchProfileById("shell"))).toBe("/bin/zsh -l");
    expect(launchProfileSummary(launchProfileById("codex"))).toBe("Codex: codex (login shell)");
  });
});
