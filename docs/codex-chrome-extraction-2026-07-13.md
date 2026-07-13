# Codex Chrome Extraction — 2026-07-13

Source: the locally installed `/Applications/ChatGPT.app` (`com.openai.codex`, version `26.707.41301`). The audit inspected the packaged Electron webview CSS and component chunks plus Jason's current screenshots. No Codex source or branded assets are copied into Keelhouse.

## Observed System

| Dimension | Codex evidence | Keelhouse translation |
|---|---|---|
| Shell | `46px` primary toolbar and a `240–275px` fluid sidebar | Keep native titlebar + direct Chats drawer; remove competing visual weight from secondary chrome |
| Reading axis | `--thread-content-max-width: 48rem` for one main-thread variant; other surfaces use distinct caps | Preserve the shared-axis relationship, then tune Keelhouse to `56rem` from populated native evidence; tools remain independently resizable |
| Rhythm | 4px base spacing; conversation item gap `16px`; grouped gap `4px` | Quantize transcript spacing to 4/8/16/24/32px and group consecutive provider output |
| Composer | Sticky footer, bottom gradient, same content width, one prominent surface | Pin one 8px-radius composer to the transcript axis; keep Send as the only filled action |
| Messages | User content is a bounded surface; assistant content is mostly unboxed; tool steps collapse inline | Broad `46rem` right-offset prompt blocks anchor each turn; assistant prose and tool/error states remain inline beneath them |
| Scrolling | Footer height updates scroll padding; follow-to-bottom stops when the user scrolls away | Preserve pinned composer and add explicit jump-to-latest behavior in a later interaction slice |
| Color | Semantic surface/text/border tokens adapt to the host theme | Retain Keelhouse graphite + steel-cyan tokens; borrow hierarchy, not Codex colors |

## Adopt / Adapt / Reject

**Adopt:** one reading axis, shared transcript/composer width, sticky gradient footer, restrained hairlines, compact sidebar rows, prompt-led turn grouping, and inline tool states.

**Adapt:** keep Keelhouse's resizable Files/Editor/Browser/Git trays, raw-terminal alternate, status bar, and steel-cyan focus/status accent.

**Reject:** Codex branding, proprietary icons/assets, VS Code compatibility variables, duplicated global navigation, and any extension/plugin chrome that does not serve Keelhouse's agent-first workflow.

## Applied Slices

- Completed lifecycle placeholders no longer render as empty `Codex` rows.
- Consecutive assistant messages share one provider label.
- Transcript and composer first used the observed `48rem` cap; populated native review showed that direct token transfer was too narrow, so both now share a `56rem` Keelhouse axis.
- User prompts use a stable `46rem` right-offset surface instead of tiny fit-content bubbles or full-width slabs.
- Composer elevation and radius are reduced so it reads as part of the thread, not a floating modal.
- Duplicate titlebar actions were removed, the primary and thread toolbars now share a calmer 44px rhythm, and the status strip is visually subordinate at 20px.

Confidence: dimensions and class relationships are **observed** from the installed bundle; Keelhouse semantic mappings are **inferred** and require packaged visual approval.
