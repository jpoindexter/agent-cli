import { describe, expect, it } from "vitest";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import {
  buildCreatedPaneActivity,
  buildCreatedWorktreePaneActivity,
  buildRestartedPaneActivity,
} from "./paneActivityRecords";

const pane: ManagedTerminalPane = {
  createdAt: 10,
  cwd: "/repo",
  exitCode: null,
  id: 7,
  label: "Server",
  profile: { id: "shell", label: "Shell", command: "/bin/zsh", args: ["-l"], useLoginShell: false },
  slot: 1,
  state: "running",
};

const context = { approvalMode: "ask" as const, projectId: "/repo", projectSessionId: "session-1" };

describe("pane activity records", () => {
  it("builds a restarted-process activity record", () => {
    const record = buildRestartedPaneActivity({ ...context, label: "Restarted", previousPane: pane, restarted: pane });
    expect(record?.handle.label).toBe("Restarted");
    expect(record?.event).toMatchObject({ label: "Restarted process", target: "/repo", status: "running" });
  });

  it("builds a created-pane activity record", () => {
    const record = buildCreatedPaneActivity({ ...context, pane });
    expect(record.handle.label).toBe("Server");
    expect(record.event).toMatchObject({ label: "Created pane", detail: "Shell", status: "running" });
  });

  it("builds a created-worktree activity record", () => {
    const record = buildCreatedWorktreePaneActivity({ ...context, branch: "feature/x", pane });
    expect(record.event).toMatchObject({ label: "Created worktree pane", detail: "feature/x", status: "running" });
  });
});
