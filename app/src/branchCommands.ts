import { invoke } from "@tauri-apps/api/core";

export type LocalBranch = { current: boolean; name: string };

export const listLocalBranches = (root: string) => invoke<LocalBranch[]>("list_local_branches", { root });
export const createGitBranch = (root: string, name: string) => invoke<string>("create_git_branch", { root, name });
export const checkoutGitBranch = (root: string, name: string) => invoke<string>("checkout_git_branch", { root, name });
