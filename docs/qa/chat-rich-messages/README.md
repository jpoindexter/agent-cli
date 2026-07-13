# Chat Rich Messages QA

Status: executed in the packaged macOS app on 2026-07-13.

## Native Inspection

The current package reopened a preserved real Codex Markdown turn. The structured timeline rendered its heading, list, safe link, fenced TypeScript block, language label, highlighted code, elapsed time, message actions, and code Copy action. Activating Copy changed the accessible label to `Code copied`. See `native-markdown.jpeg`.

The preserved Chat A transcript also exposed the real process-group cancellation previously executed for DIRECT-AGENT-HARNESS: the provider message reported that the command was running, the timeline recorded `Codex run stopped`, Chat A returned to Ready while Chat B continued, and the forbidden cancelled token never appeared. The executed sequence and process-group fix are recorded in `../daily-driver/codex-multi-chat.md`.

## Automated Coverage

- `ChatMarkdown.test.tsx` verifies valid GFM tables, fenced-code highlighting, Copy, raw-HTML removal, unsafe-protocol removal, and remote-image blocking.
- `ChatThreadSurface.dom.test.tsx` verifies progressive Markdown replacement, manual-scroll anchoring, Jump to latest, retry ownership, compact completed/expanded failed tool rows, elapsed labels, and polite run-state announcements.
- `ChatThreadSurface.test.tsx` verifies provider event reduction and stable message structure.
- Full gates passed: 218 frontend tests, 62 Rust tests, production build, and `git diff --check`.

This evidence establishes native rendering and the real Stop outcome. It does not establish provider approval behavior or attachment transmission; those remain separate roadmap cards.
