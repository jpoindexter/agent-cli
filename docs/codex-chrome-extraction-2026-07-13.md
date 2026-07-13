# Codex Chrome Extraction — 2026-07-13

Source: the locally installed `/Applications/ChatGPT.app` (`com.openai.codex`, version `26.707.41301`). The audit inspected the packaged Electron webview CSS and component chunks plus Jason's current screenshots. No Codex source or branded assets are copied into Keelhouse.

## Observed System

| Dimension | Codex evidence | Keelhouse translation |
|---|---|---|
| Shell | `46px` primary toolbar and a `240–275px` fluid sidebar | Keep native titlebar + direct Chats drawer; remove competing visual weight from secondary chrome |
| Reading axis | `--thread-content-max-width: 48rem` for the main thread; narrower `480–500px` variants for side panels | Use one centered `48rem` axis for conversation and composer; tools remain independently resizable |
| Rhythm | 4px base spacing; conversation item gap `16px`; grouped gap `4px` | Quantize transcript spacing to 4/8/16/24/32px and group consecutive provider output |
| Composer | Sticky footer, bottom gradient, same content width, one prominent surface | Pin one 8px-radius composer to the transcript axis; keep Send as the only filled action |
| Messages | User content is a bounded surface; assistant content is mostly unboxed; tool steps collapse inline | Compact right-aligned user messages, unboxed assistant prose, inline tool/error states |
| Scrolling | Footer height updates scroll padding; follow-to-bottom stops when the user scrolls away | Preserve pinned composer and add explicit jump-to-latest behavior in a later interaction slice |
| Color | Semantic surface/text/border tokens adapt to the host theme | Retain Keelhouse graphite + steel-cyan tokens; borrow hierarchy, not Codex colors |

## Adopt / Adapt / Reject

**Adopt:** one reading axis, shared transcript/composer width, sticky gradient footer, restrained hairlines, compact sidebar rows, grouped run output, and inline tool states.

**Adapt:** keep Keelhouse's resizable Files/Editor/Browser/Git trays, raw-terminal alternate, status bar, and steel-cyan focus/status accent.

**Reject:** Codex branding, proprietary icons/assets, VS Code compatibility variables, duplicated global navigation, and any extension/plugin chrome that does not serve Keelhouse's agent-first workflow.

## First Applied Slice

- Completed lifecycle placeholders no longer render as empty `Codex` rows.
- Consecutive assistant messages share one provider label.
- Transcript and composer now use the same centered `48rem` maximum width.
- User messages are compact instead of stretching across the workbench.
- Composer elevation and radius are reduced so it reads as part of the thread, not a floating modal.

Confidence: dimensions and class relationships are **observed** from the installed bundle; Keelhouse semantic mappings are **inferred** and require packaged visual approval.
