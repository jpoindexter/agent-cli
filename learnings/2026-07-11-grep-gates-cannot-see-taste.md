# Grep gates cannot see taste

**Context:** Keelhouse's `qa:chrome-contract` (44 assertions) was green while the shipped chrome had drifted hard from the accepted demo — ~50 boxed rounded-rect buttons against a three-control flat grammar. Jason caught it by eye; the gate never could.

**Insight:** A string/token gate proves *presence* (tokens exist, rejected strings absent, files exist) but not *composition* (which classes controls actually use, visual weight, rhythm). Drift lives in the gap: every individual check passes while the whole reads wrong.

**Approach that works:**
1. Encode the design contract as **class-level prohibitions**, not just token requirements — e.g. "these named button classes must NOT use `background: var(--control-bg)`", not just "`#67c3d1` must exist."
2. Require **reference-vs-actual screenshot pairs** as checked-in artifacts (demo captures beside app captures at the same widths) so a human diff is one glance, part of the gate's required evidence.
3. Treat "gate green + user says it looks wrong" as a gate bug, not a user-taste dispute — extend the gate in the same pass that fixes the drift (CHROME-CONTRACT-V2 pattern).

**Transfer:** applies to any lint/contract script standing in for design review — a11y greps, token linters, copy-style checks.
