# ROADMAP — agent cli

Source of truth: `roadmap.json` → `roadmap.html` (rockmap board). This file is the plain-text index — rebuild the board after editing `roadmap.json`:

```bash
node rockmap/build-roadmap.mjs roadmap.json roadmap.html
```

## v0 — Shippable to one user (Jason)

Sequential, not parallel — each step gates the next.

1. ~~**Editor-fidelity spike**~~ — **PASSED 2026-07-07.** See DECISIONS.md.
2. **R1: Zellij cockpit trial — IN PROGRESS**, started 2026-07-07. `zellij/agent.kdl`, tabs=projects (indx, brutal, hashmark, prova), yazi rail, agent panes. One week of daily use. Every friction logged in ERRORS.md same-day, not from memory.
3. **R2: Superconductor daily-driver trial** (1 week, blocker, runs *after* R1 concludes — not concurrent) — keep/kill verdict on losing the terminal CLI view for its chat UI.
4. **P1: Ship v0 cockpit config** — winner becomes `zellij KDL layout(s) + install script + README`. (R1's config already exists at `zellij/` — P1 is confirming it after a real week, not building it from scratch.)

## v1 — after real use

- P2: Worktree helper (one keystroke = new git worktree + agent launched in it)

## v2 — only if earned

- R3: Tauri 2 native harness — gated. See DECISIONS.md for the exact firing threshold.
- P3: Zed stripped-down fallback config (documented, not built)
- S2: Mine Superconductor bundle for UX patterns — **only if R3 actually fires**, not scheduled by default.
