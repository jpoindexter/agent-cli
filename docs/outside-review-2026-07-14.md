# Independent Chrome Review — 2026-07-14

## Scope

An ephemeral read-only Codex process with no conversation history reviewed the approved 1440px demo reference, the latest committed native reset capture, the narrow QA evidence, the PRD/chrome contract, and relevant shell source. It did not run or modify the app. This is a useful independent-context check, but it does not satisfy `OUTSIDE-REVIEW`'s intended human/developer pass.

## Findings And Triage

| Finding | Triage | Acceptance check |
| --- | --- | --- |
| Reset evidence is empty/stale rather than a populated chat-first proof. | Fold into `CHROME-EYEBALL-SIGNOFF` and `CHROME-CONTRACT-V2`; recapture after unlock. | Latest package shows a real user turn, provider output/activity, empty composer, Files dock, and collapsed utility tray. |
| Recovery toast competes with lower chrome. | Fixed now: notice sits above the status bar and auto-dismisses after 12 seconds; native visual remains pending. | Trigger recovery at 900/1232/1440px; no status, composer, or tray control is covered. |
| Purple titlebar control appears in old native evidence. | Stale-evidence issue. Current source uses transparent titlebar actions and the contract rejects extra filled chrome. | New package capture contains no filled titlebar capsule. |
| Send looked 24px and square from an earlier cascade rule. | Rejected after source validation: the final cascade is 28×28px with `border-radius: 50%`. | Computed style and package capture agree at desktop and minimum width. |
| Medium-width tool tabs can collide. | Fixed in `ce84977`: compact below 720px, icon-only below 480px, with JS measurement plus CSS container fallback. Native resize capture remains under `CHROME-CONTRACT-V2`. | No overlap while dragging through both thresholds; active tool remains identifiable. |
| `Prettier` appears in old status evidence. | Stale-evidence issue. Current status source renders only real workspace/provider/surface state. | New package capture contains no placeholder integration label. |

## Confirmed Direction

The reviewer confirmed the intended product hierarchy exists in source: project/chat rail, structured conversation and pinned composer as the primary center, Files/Editor/Browser/Git as secondary tools, and Terminal/Processes/Logs as the optional bottom tray. It also confirmed that structured messages and run events are adapter-owned rather than inferred from terminal text.

## Unverified

The review did not execute keyboard/focus behavior, provider events, native WebKit resize, the recovery-toast timer, or the latest packaged visual state. Those checks remain with the existing native/sign-off cards; no duplicate cards were added.
