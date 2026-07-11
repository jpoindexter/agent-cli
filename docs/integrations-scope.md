# Integrations Scope

Integrations should support the core loop: inspect/edit code, run agents, review changes, and hand work to source control. They are not a plugin marketplace.

## Must / Core

| Integration | Scope |
| --- | --- |
| Local Git | Detect repo root, branch, remotes, dirty/untracked/deleted files, diffs, stage/unstage/discard with confirmation, copy diff, open changed file. |
| Git credentials | Detect whether `git` operations can authenticate through existing system/CLI credentials; explain failures without storing passwords directly. |

## Should / First-Class Source Hosts

| Integration | Scope |
| --- | --- |
| GitHub | Use existing `gh` auth when available; support repo detection, open repo/PR/issue in browser preview or external browser, show PR/CI status, and later create PRs from reviewed work. |
| GitLab | Use existing `glab` auth or token/API URL; support gitlab.com and self-hosted instances, repo/MR/issue links, pipeline status, and later create merge requests. |

## Could / Adapter Lane

| Integration | Scope |
| --- | --- |
| Bitbucket / Azure DevOps | Remote detection, open links, auth health, PR status if a project uses them often. |
| Linear / Jira | Link branch names, commits, PRs/MRs, or session labels to issue URLs; do not become a project management client. |
| Slack / Discord | Optional notification targets for agent completion or attention-needed events; no chat client. |

## Boundaries

- Prefer installed CLIs (`git`, `gh`, `glab`) before direct API implementations when they cover the job.
- Store tokens only through OS-safe credential storage; never in plain config.
- Every mutating action needs visible user intent and an undo/recovery path where possible.
- Agents can request integration actions only through permissioned app-owned commands with attribution.
- No arbitrary third-party plugins or unreviewed extension execution.

## Policy (INTEGRATIONS-POLICY, 2026-07-11)

Classification lanes are **core** (Local Git), **first-class** (GitHub, GitLab), **adapter-lane** (Bitbucket/Azure DevOps, Linear/Jira, Slack/Discord), **parked**, and **out-of-scope**. No integration ships in any lane unless it names all four of:

1. **Concrete workflow** — the daily-driver task it serves (not "might be useful").
2. **Health check** — a visible, testable auth/connectivity probe with an actionable failure message.
3. **Credential boundary** — existing CLI auth or OS keychain only; never plaintext config, never app-managed passwords.
4. **App-owned command surface** — its actions route through the same command registry as menus/palette/context menus and the app-action gate for risky operations.

**Parked** (promotable via PARKED.md, never silently): notification targets beyond macOS notifications (Slack/Discord webhooks), issue-tracker linking (Linear/Jira), Bitbucket/Azure DevOps.

**Out of scope** (requires a DECISIONS.md entry to revisit): plugin marketplace or third-party extension loading, chat clients, project-management surfaces, cloud fleet orchestration, telemetry-based integrations.

Promotion path: adapter-lane → first-class requires a recorded month of real use plus the four requirements above; anything → core requires a DECISIONS.md entry.
