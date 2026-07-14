# Packaged Chat Context Verification

Executed 2026-07-14 in the signed `Keelhouse.app` with the existing Codex OAuth session.

## File Context

1. Created a new chat in the `agent cli` project.
2. Attached `provider-context-smoke.txt` through the native file picker.
3. Sent: `Read the attached file and reply with only its verification token, no punctuation.`
4. Codex returned `KEELHOUSE-CONTEXT-AX7-20260714` in 11 seconds.

The token was present only in the bounded attachment payload. The visible file chip, remove action, and context review action remained available.

## Image Context

1. Removed the text attachment and attached `docs/qa/app-shell/first-open-900.png` through the native picker.
2. Asked for the exact sentence in the screenshot's first user message card.
3. Codex returned `Keep the chrome compact when the window narrows.` in 7 seconds.

That sentence is visible in the PNG and was not included in the prompt. The cached image chip, remove action, and context review action remained available. This executes the provider-native image input path rather than inferring support from frontend state.
