import { describe, expect, it } from "vitest";
import {
  buildAgentHookSnapshot,
  hookReportToActivity,
} from "./agentHookIntegration";
import type { AgentHookReport } from "./useAgentHookRequests";
import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";

const profile: LaunchProfile = {
  id: "zsh", label: "zsh", command: "zsh", args: [], useLoginShell: true,
};
const pane: ManagedTerminalPane = {
  createdAt: 1, cwd: "/repo", exitCode: null, id: 4, label: "build",
  profile, slot: 0, state: "running",
};

const report = (extra: Partial<AgentHookReport> = {}): AgentHookReport => ({
  detail: "", runCardKind: "tool", runCardStatus: "complete",
  status: "Formatted files", targets: ["src/a.ts"], ...extra,
});

describe("buildAgentHookSnapshot", () => {
  it("summarizes projects, panes, and editor state for the hook endpoint", () => {
    const snapshot = buildAgentHookSnapshot({
      activeChatId: "chat-1",
      activeProjectPath: "/repo",
      editorTabs: [{ path: "/repo/src/a.ts" }],
      openProjects: [{ path: "/repo", status: "running" }],
      panes: [pane],
      selectedFilePath: "/repo/src/a.ts",
    });

    expect(snapshot).toEqual({
      activeChatId: "chat-1",
      activeProjectPath: "/repo",
      openFiles: ["/repo/src/a.ts"],
      panes: [{ cwd: "/repo", id: 4, label: "build", state: "running" }],
      projects: [{ path: "/repo", status: "running" }],
      selectedFile: "/repo/src/a.ts",
    });
  });
});

describe("hookReportToActivity", () => {
  it("maps file and approval reports to their activity kinds", () => {
    expect(hookReportToActivity(report({ runCardKind: "file" })).kind).toBe("file");
    expect(hookReportToActivity(report({ runCardKind: "approval" })).kind).toBe("approval");
    expect(hookReportToActivity(report({ runCardKind: "command" })).kind).toBe("tool");
  });

  it("labels the activity with the report status and hook provenance", () => {
    const activity = hookReportToActivity(report({ detail: "prettier --write" }));

    expect(activity).toEqual({
      detail: "prettier --write",
      kind: "tool",
      label: "Formatted files",
      provenance: "agent-hook",
      runCardKind: "tool",
      status: "complete",
      targets: ["src/a.ts"],
    });
  });

  it("falls back to the default hook detail when the report has none", () => {
    expect(hookReportToActivity(report()).detail).toBe(
      "Reported through the Keelhouse agent hook.",
    );
  });
});
