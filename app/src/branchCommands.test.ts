import { invoke } from "@tauri-apps/api/core";
import { describe, expect, it, vi } from "vitest";
import { checkoutGitBranch, createGitBranch, listLocalBranches } from "./branchCommands";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(async (_command: string, input: { name?: string }) => input.name ?? [{ name: "main", current: true }]) }));

describe("branch commands", () => {
  it("uses typed native commands without shell input", async () => {
    await expect(listLocalBranches("/repo")).resolves.toEqual([{ name: "main", current: true }]);
    await expect(createGitBranch("/repo", "feature/api")).resolves.toBe("feature/api");
    await expect(checkoutGitBranch("/repo", "main")).resolves.toBe("main");
    expect(vi.mocked(invoke).mock.calls).toEqual([
      ["list_local_branches", { root: "/repo" }],
      ["create_git_branch", { root: "/repo", name: "feature/api" }],
      ["checkout_git_branch", { root: "/repo", name: "main" }],
    ]);
  });
});
