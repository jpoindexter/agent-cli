import {
  buildRepoUrl,
  sourceRepoStatusLabel,
  type RepoLocation,
} from "./sourceControlLinks";

export const statusBarRepoPropsFrom = (
  repoLocation: RepoLocation | null,
  openExternal: (url: string) => Promise<unknown>,
) => ({
  onOpenRepo: () => {
    if (repoLocation) void openExternal(buildRepoUrl(repoLocation)).catch(() => {});
  },
  repoLabel: repoLocation ? sourceRepoStatusLabel(repoLocation) : null,
});
