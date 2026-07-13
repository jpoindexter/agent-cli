# Settings Workspace QA

Executed against the packaged macOS app on 2026-07-13.

- `native-general.png`: full-window Settings destination with grouped navigation, search focus, flat selection, and a real Global setting.
- `native-search.png`: cross-category search showing project-scoped Git and remote rows.
- `narrow-tool-tabs.png`: narrow right dock after Files/Editor/Browser/Git labels collapse to icon-only controls.
- `native-scoped-inheritance.png`: Project scope selected after resetting its explicit profile override; the value visibly inherits from Global.
- `native-compact-navigation.png`: packaged app at 904x643 with compact Category navigation active inside the native minimum-width range.
- `native-provider-connections.jpeg`: packaged Agents settings with local CLI versions, auth health, structured/raw capability labels, and the custom raw-terminal profile form.
- `native-command-palette-sources-2026-07-13.jpg`: persisted Commands, Files, Open tabs, and Worktrees source toggles in packaged Settings.
- `native-command-palette-files-2026-07-13.jpg`: live `README` search returning the real project file after the Files source was re-enabled.
- `native-worktree-hook-environment-policy-2026-07-13.jpg`: truthful project-owned policy rows for worktrees, lifecycle hooks, and inherited environment behavior.

Live interaction also navigated to Agents, created a Project-level Codex override over the Global Shell value, reset it to inheritance, and returned through `Back to app` without losing the active chat. Provider QA refreshed Codex/Gemini/Claude status, repaired the old Shell chat default to Codex, added a temporary `QA shell` custom profile, confirmed it in the raw-terminal selector, and removed the fixture from the app store. Command-palette QA disabled Files and observed no `README` match, then re-enabled it and observed the real workspace file. The first native scope change exposed a released-event crash; the handler now captures the value synchronously and the rebuilt package completed the workflow. Automated coverage verifies inheritance repair, provider response normalization, custom-profile normalization, source filtering, category navigation, search clearing, a real layout callback, Back/Escape return, and the responsive chrome contracts.
