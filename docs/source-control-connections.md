# Source-Control Connections

Keelhouse keeps source-host integration narrow: local Git status stays app-owned, while `gh` and `glab` own authentication and credential storage.

## Detection

The Rust backend checks `git`, `gh`, and `glab` without reading token material. Settings reports whether each command is installed and, where supported, whether it is authenticated and which account is active.

The active workspace's `origin` remote is parsed from HTTPS or SSH syntax. Keelhouse supports:

- GitHub.com remotes
- GitLab.com remotes
- arbitrary self-hosted GitLab hosts

GitHub uses `/pulls` and `/actions`. GitLab.com and self-hosted non-GitHub remotes use `/-/merge_requests` and `/-/pipelines`. Repository and issue links use the host's normal project paths.

## UI

Settings > Git exposes Repo, Pull requests or Merge requests, Issues, and Actions or Pipelines. The normal workbench status bar also shows the active host and `owner/repo`; its accessible label includes current `gh` or `glab` health, and clicking it opens the repository externally.

Remote and auth checks run when the active workspace changes, not only when Settings opens.

## Credential Boundary

Keelhouse does not accept, persist, display, or relay GitHub/GitLab tokens. Users authenticate with `gh auth login` or `glab auth login`; those tools own their platform-appropriate credential storage. This avoids a second source-host secret store inside the app. If direct forge APIs are added later, their credentials must use the same native Keychain boundary as AI connections.

## Current Verification

Tests cover GitHub, GitLab.com, and self-hosted SSH/HTTPS parsing and every generated link shape. Rust tests execute origin-remote lookup against a real temporary Git repository. On this machine, live detection reports Git and authenticated `gh` as available and `glab` as absent. A packaged visual check of the new status-bar indicator remains pending while macOS is locked.
