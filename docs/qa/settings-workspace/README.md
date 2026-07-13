# Settings Workspace QA

Executed against the packaged macOS app on 2026-07-13.

- `native-general.png`: full-window Settings destination with grouped navigation, search focus, flat selection, and a real Global setting.
- `native-search.png`: cross-category search showing project-scoped Git and remote rows.
- `narrow-tool-tabs.png`: narrow right dock after Files/Editor/Browser/Git labels collapse to icon-only controls.

Live interaction also navigated to Agents, exposed Global and Chat ownership labels, and returned through `Back to app` without losing the active chat. Automated coverage verifies category navigation, search clearing, a real layout callback, Back/Escape return, and the 420px tool-tab container contract.
