# Chrome Contract

Status: active guardrail, v2 2026-07-11 (control grammar added after the boxed-button drift; see `docs/chrome-delta-audit.md` and DECISIONS.md 2026-07-11).

Keelhouse chrome follows the accepted `demo/keelhouse-chrome-demo.html` direction: graphite surfaces, steel-cyan accent, direct project/session drawer, agent-first center, and editor/browser/git/raw terminal as optional trays. The demo is binding at the control-grammar level, not only tokens.

## Control Grammar (v2, normative)

Exactly three default control types, from the demo:

- **Flat text action:** no background, no border, weight 600, `--color-text` ink, hover → `--steel-cyan-400`. Used for Review/Approve-class actions, lifecycle controls, and labelled toolbar commands. Danger variants stay flat in danger ink.
- **Transparent icon button:** 16px glyph, no box, color-only hover (muted → ink). Hit area extended to ≥40px via padding.
- **Filled Send:** the single default filled control — 24px, `--steel-cyan-500` background, white glyph, 4px radius. Modal-confirm primaries are the only other filled buttons.

Actives: tabs use `inset 0 2px 0` (or `-2px`) steel-cyan underline + subtle tint; rows use `#252732` + `inset 3px 0 0` steel-cyan left stripe. Cards: 6px radius, `#191a22`, shadow elevation (`0 12px 34px rgba(0,0,0,.18)`). Composer: elevated 12px-radius card with `0 22px 60px rgba(0,0,0,.34)`. Type scale: Inter/SF Mono 13px base / 12px meta+mono / 11px uppercase labels.

## First-Open Layout (v2)

First open shows the demo layout: threads drawer, centered run+composer column (`min(860px, 100% - 56px)`), right dock open on Files with its tab strip, bottom tray strip, statusbar. Returning users keep persisted layouts. Trays remain movable/closable — the demo look applies wherever a tray docks.

## Required Tokens

- Primary accent: `#67c3d1`
- Strong accent: `#9bd9e3`
- Muted accent surface: `#162c33`
- App CSS exposes these through `--steel-cyan-*`, `--blue-*`, and semantic `--color-accent-*` tokens.

## Rejected Drift

- Orange/warm accent dominance.
- Purple-heavy gradients or one-note palettes.
- Fake browser/window chrome inside the app shell.
- Decorative activity rails that do not map to real app modes.
- Chat/avatar identity blocks such as `You ·` or `Keelhouse ·`.
- Pill-heavy active rows and obvious rounded-rectangle action chrome.
- Boxed default buttons (`--control-bg` fill + border) anywhere in titlebar, toolbars, composer, or drawer — this shipped once and passed the token-level gate; CHROME-CONTRACT-V2 makes it a failing check.
- Border-heavy depth in place of shadow elevation on cards, composer, menus, and overlays.

## Agent Run Surface

- Run is the default surface and shows the visible active terminal viewport; raw terminal remains an escape hatch for direct TUI interaction.
- Activity is separate provenance for observable prompt, approval, file, command, error, browser, git, and app events.
- Keelhouse does not infer structured chat, tool events, or thinking from terminal text. Those require an explicit adapter or hook.
- The composer stays pinned below output and activity.

## Real App Port Signals

- The side drawer uses mode-aware product nouns. The default Projects mode is `Project threads`, not a generic `Drawer`.
- The center work surface is labelled as `Agent run and raw terminal`: Run is primary, raw terminal is explicit.
- The first-open tool tray is hidden. Opening Tools defaults to Editor and can dock left, right, or bottom.

## Control Chrome Signals

- Toolbar controls are flat by default: no enclosing segmented-control box around the agent surface or tray layout switchers.
- Active toolbar state uses a small steel-cyan underline and subtle tint, not a filled rounded pill.
- Pane, browser, collapse, and lifecycle icon buttons use hover/focus feedback without default rectangular chrome.
- Terminal toolbar metadata is deliberately reduced to avoid collisions with agent/tray controls; selected profile is already visible in the app titlebar and pane chips.
- Browser preview chrome responds to tray width; narrow trays hide the redundant Open button before controls overlap.

## Documented Exceptions (grammar-scale, per CHROME-EYEBALL-SIGNOFF)

- **Tray tab strip is Editor/Browser, not Files/Editor/Browser/Git.** The demo's right dock shows four tabs, but Keelhouse's Files tree and Git panel already live in the side drawer (ACTIVITY-DRAWERS, verified 2026-07-09). Duplicating those surfaces in the tray would double their state (height observers, tree instances, selection) for no workflow gain. The tray strip carries the demo's tab treatment for the surfaces the tray actually hosts; Files/Git keep the same visual grammar inside the drawer. Revisit only if daily-driver use shows the drawer round-trip is a real friction.

## Tool Tray Signals

- One compact Tools menu exposes `Editor`, `Browser`, and `Split editor and browser` plus dock position.
- `Split` shows editor and browser trays with the secondary splitter.
- `Editor` and `Browser` modes hide the unused tray and remove the secondary editor/browser splitter.
- Tray mode is a local workbench preference so daily-driver layout does not reset between launches.

## Verification

Run from `app/`:

```bash
npm run qa:chrome-contract
```

The gate checks the accepted demo, real app-shell sources, 1440/1024/900 first-open screenshots, steel-cyan tokens, rejected warm accents/avatar labels, the terminal-backed Run contract, hidden first-open tray, and compact Tools menu.

For visible chrome changes, run both:

```bash
npm run qa:shell
npm run qa:editor
```

`qa:shell` captures the actual React app. `qa:editor` remains a deterministic fixture for editor, menu, diff, modal, and failure states; fixture evidence alone is not enough to claim the app shell works. Native proof for this reset is `docs/qa/app-shell/native-run.png`.
