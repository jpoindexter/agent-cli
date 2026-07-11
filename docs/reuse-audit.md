# Reuse Audit (REUSE-AUDIT, 2026-07-12)

What the repo's own spikes and reference material contributed to the shipped app, and what remains parked. Scope: this repo's `spike*/`, `rockmap/`, `zellij/`, `ghostty/`, `resources/`, `demo/`. No other `_active` project is pulled in.

## Pulled in (reused, shipped)

| Source | Reused as | Where |
| --- | --- | --- |
| `spike-ghostty-vt/` | The entire terminal foundation: real pty → `libghostty-vt` → cell-grid snapshot. Its verified API shape (`Terminal::vt_write`, `Point::Screen/Viewport`, `graphemes` on `GridRef`) is exactly what `app/src-tauri/src/lib.rs` uses. | `app/src-tauri` terminal thread, `snapshot`, `search_terminal_rows` |
| `spike/` (editor-fidelity) | Decision input only — resolved "does a TUI editor satisfy the VS Code expectation?" (no) and steered the app to a real GUI CodeMirror editor. Documented in DECISIONS.md 2026-07-07. | ARCHITECTURE.md editor choice |
| `rockmap/` | Live tooling: `build-roadmap.mjs` renders `roadmap.json` → `roadmap.html` and is run on every card close. Not a spike — an in-use build step. | `roadmap.html`, every roadmap commit |
| `demo/keelhouse-chrome-demo.html` | The binding chrome contract. Drove the entire chrome re-convergence (control grammar, run/composer cards, sidebar rhythm, overlays, first-open layout). | `docs/chrome-contract.md`, `docs/chrome-delta-audit.md`, `App.css` |
| `demo/cockpit-demo.html` | Mood reference for the graphite substrate; the THEME `mono-ghost` palette derives from it. | `[data-theme="mono-ghost"]` block in `App.css` |
| `ghostty/config` | Terminal theme/config reference used while tuning ANSI/truecolor rendering. | palette resolution in `snapshot` |

## Parked (available, not yet pulled in)

| Source | Why parked | Promotion trigger |
| --- | --- | --- |
| `zellij/agent.kdl`, `install.sh` | The zellij trial path was superseded by the Tauri build (DECISIONS.md 2026-07-07). Kept as the record of the trial that justified building custom. | None — historical; do not resurrect without a DECISIONS.md entry. |
| `resources/superconductor-reference/` (Info.plist, super.icns, NOTES.md) | Reference-only competitor material. `super.icns` is another product's icon — must NOT ship. NOTES.md is UX-pattern reference. | App-icon and packaging work (PACKAGING card) may mine NOTES.md for patterns, never the icon. |
| `rockmap/examples`, `roadmap.schema.json` | Schema/examples for the vendored generator; only `build-roadmap.mjs` + `roadmap.json` are load-bearing. | Only if the roadmap board gains features. |

## Findings

- **No dead reuse debt.** Every spike either shipped (ghostty-vt, rockmap, demos) or served its decision purpose and is correctly parked (spike editor test, zellij trial).
- **One licensing watch-item:** `resources/superconductor-reference/super.icns` is a third-party app icon. The PACKAGING card must source Keelhouse's own icon; this file is reference only and must not be bundled.
- **Nothing to newly extract.** The audit's own recommendation (a completeness pass over parked material) finds no reusable code left unmined — the parked items are references and historical config, not unshipped functionality.
