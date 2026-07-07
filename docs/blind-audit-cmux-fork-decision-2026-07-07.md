# Blind-Spot Audit: "cmux is the best foundation to fork"

**Target:** the claim "cmux is still the right pick... no new information moves cmux off the top spot," reached via two web searches (vs. source-level cloning for cmux itself), and the momentum toward "fork cmux" as the answer to the open fork-vs-build-fresh question.

**Frameworks applied:** all 16 (premortem, outside-view, unknown-unknowns, inversion, consider-the-opposite, red-team, chestertons-fence, survivorship-bias, falsification, steelman, bias-blind-spot, johari-window, dunning-kruger, calibration, curse-of-knowledge, ladder-of-inference) — 10 parallel agent dispatches, plus one firsthand re-verification by the auditing model itself (see Finding 1).

---

## Findings (severity-ranked)

### 1. CORRECTED BY FIRSTHAND VERIFICATION — cmux's chrome *is* config-themeable. My earlier claim was wrong.

I claimed earlier in this conversation: *"cmux's native chrome (sidebar, tab bar) isn't config-themeable and would require editing the compiled Swift/AppKit source directly to actually change."* Two parallel audits (chestertons-fence, unknown-unknowns) flagged this as unverified. I re-cloned cmux and read the actual settings source myself — not relayed, directly confirmed:

`Packages/macOS/CmuxSettings/Sources/CmuxSettings/Keys/SidebarAppearanceCatalogSection.swift` — real, shipped keys: `tintColorHex`, `lightModeTintColorHex`, `darkModeTintColorHex`, `tintOpacity`, `blurOpacity`, `cornerRadius`, `material` (macOS vibrancy), `blendMode`, `preset`.

`WorkspaceColorsCatalogSection.swift` — `selectionColorHex`, `notificationBadgeColorHex`, `palette`, `customColors`.

All settable via `~/.config/cmux/cmux.json` or Settings UI. **No Swift editing required for tint, corner radius, blur/material, or tab colors.**

**Severity: highest** — expected damage was "weeks lost forking/reskinning a codebase that didn't need it"; plausibility is now confirmed, not estimated.
**Mitigation:** before any fork decision, actually try these tokens against Jason's "clean and modern" want. Near-zero cost, fully reversible, no Swift required. If this satisfies him, the fork question is moot.

---

### 2. The "cmux is best" verdict was reached with asymmetric verification, and the process couldn't have found otherwise

*(premortem, outside-view, inversion, consider-the-opposite, red-team, survivorship-bias, falsification, curse-of-knowledge, and ladder-of-inference all cite the same core fact — flagging as one finding with three distinct sub-points, not nine independent corroborations.)*

- cmux got a real clone-and-grep. Mux0 and Supacode got two web searches and README snippets. The verdict used stars/release-cadence as the deciding signal — a proxy for *product adoption*, not *forkability*.
- The search queries themselves were confirmation-shaped ("cmux alternatives," "libghostty apps") — nothing like "cmux UI criticism" or "Mux0 vs Supacode screenshots" was ever run. A process that can't produce disconfirming evidence isn't a real test.
- The "more stars = easier fork base" assumption may be **backwards** — more stars/contributors often means more opinionated design already baked in and harder to strip; "smaller/newer" (Mux0, dismissed as a negative) could be the actual positive signal for a reskin project.

**Severity: high** — expected damage: could have picked the wrong fork base; plausibility: confirmed methodology gap, though Finding 1 makes this partly moot (may not need a fork base at all).
**Mitigation:** if a fork is still needed after trying Finding 1's config tokens, give Mux0/Supacode the same clone-and-grep treatment cmux got before choosing.

### 3. The visual-design axis — the actual thing Jason complained about — was never compared between any of the candidates

*(consider-the-opposite, falsification, calibration — same underlying evidence, consolidated.)* No screenshots, no source read of Mux0's or Supacode's chrome, on either side. The comparison that was run (stars, activity) couldn't have addressed the complaint that triggered the question in the first place.

**Severity: high** — this is the specific gap Finding 1 partially closes for cmux itself, but it was never closed for the alternatives at all.
**Mitigation:** moot for cmux now that its config surface is confirmed (Finding 1); still open if cmux's tokens don't satisfy Jason and a different base gets considered.

### 4. After being told "you hallucinated, stop evaluating tools," the very next action was another comparative tool-evaluation writeup

*(steelman + bias-blind-spot — distinct contribution, not repeated elsewhere.)* Answering Jason's direct question was correct; producing a 4-way comparison writeup in response was the same *shape* of activity just named as the problem, likely driven by pressure to resolve the rebuke quickly rather than genuine falsification-seeking (asymmetric effort: minimal verification when the search direction could reconfirm the prior conclusion).

**Severity: medium** — damage is about trust/pattern, not a technical error; plausibility: directly evidenced by the transcript.
**Mitigation:** this report itself is a bigger version of the same risk (a 10-agent audit is a lot of "evaluation," not "building"). Named explicitly in the Residual section below — don't let this audit become finding #5 of itself.

### 5. Real technical risks if a fork does end up happening

*(unknown-unknowns — distinct, concrete, not repeated elsewhere.)*
- **Sparkle auto-update would silently clobber a personal fork.** cmux auto-updates via Sparkle, validated by an EdDSA public key baked into `Info.plist` at build time. A locally-built fork that doesn't strip `SUFeedURL`/`SUPublicEDKey` will keep polling manaflow's real appcast feed and **silently self-update to stock upstream, overwriting local changes** — worse than a git merge conflict, since it happens outside git entirely.
- Repo root is a multi-platform monorepo (`ios/`, `web/`, `webviews/`, `workers/`, `daemon/`, `mux/`, `vault/`), not a small single-target app. `Sidebar` alone has 922 Swift references — a broadly-coupled surface.
- Toolchain is Xcode 16+ / Zig / Rust with active build fragility noted in CI ("zig 0.15.2 MachO linker can't resolve libSystem on macOS 26").
- Notarization for distribution beyond one machine requires a restricted WebAuthn entitlement (`com.apple.developer.web-browser.public-key-credential`) that Apple must specifically grant — not needed for purely local single-machine use.

**Severity: medium-high, conditional** — only matters if Finding 1 fails and a fork is actually pursued.
**Mitigation:** if forking, strip the Sparkle feed keys first, and confirm local-only use doesn't need notarization before assuming the full signing pipeline is required.

### 6. Chesterton's Fence: cmux's native-AppKit choice and its theming architecture were deliberate, and already burned once

*(chestertons-fence — distinct.)* README: the author explicitly rejected Electron/Tauri for performance reasons before building native — that reason still applies. GitHub issue #3511 documents a real bug: custom foreground/palette theming caused white-on-white invisible text from appearance/theme-state coupling; the fix (merged May 2026) was architectural *separation*, not more custom painting.

**Severity: medium** — relevant caution if going beyond the built-in tokens (Finding 1) into deeper customization.
**Mitigation:** stay within the shipped `sidebarAppearance.*`/`workspaceColors.*` surface where possible; going further reopens a class of bug the maintainers already had to fix once.

### 7. "Horrible" was never pinned to concrete, falsifiable criteria

*(chestertons-fence.)* No documented specifics anywhere in this conversation — no contrast complaint, no layout complaint, just an unspecified aesthetic reaction. Even with Finding 1's config surface available, there's no target to tune toward yet.

**Severity: medium** — blocks effective use of Finding 1's fix, not just a fork.
**Mitigation:** before touching any config, Jason should name 2-3 concrete things ("sidebar too wide," "contrast too low," "corners should be sharper") — falsifiable, testable against the real tint/corner-radius/material tokens.

### 8. Corrected confidence

*(calibration.)* Original implied confidence in "fork cmux, it'll fix the look" was near-100% (no hedge stated). Corrected, pre-Finding-1: ~20-30% that a fork specifically was necessary or would resolve the complaint within reasonable time for a non-Swift solo dev. **Post-Finding-1, revise upward sharply for "some fix exists without forking" (~70-80%+, untested) and revise the fork-necessity question down further** — the premise that a fork was needed at all looks weak now.

---

## Residual — what this audit could not see

- Finding 1 confirms the *keys exist*. It does not confirm that using them actually produces something Jason calls "clean and modern" — that's untested, and per Finding 7, the target isn't even defined yet.
- Mux0's and Supacode's actual config/theming systems were never checked with equivalent rigor — if Finding 1's tokens don't satisfy Jason, the "best fork base" comparison is still standing on asymmetric evidence.
- No one checked cmux maintainers' stance on forks (license permits it; community reception is unknown).
- Self-audit caveat: this audit graded its own evidence. Findings 2-4 in particular converge from the same underlying transcript facts across many frameworks — flagged as same-model repetition, not treated as 9x independent corroboration. Finding 1 is the one item in this report verified firsthand by the auditing model against the real source, not relayed from a subagent's claim.
- **This audit is itself ~10 more tool-evaluation-shaped agent calls, arriving right after Finding 4's warning about that exact pattern.** It was explicitly requested via `/blind`, not self-initiated, which is the material difference — but the size of the response is worth naming so it doesn't quietly become the next thing this critique is aimed at.
