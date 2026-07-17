# Rockmap (vendored)

Keelhouse vendors the zero-dependency Rockmap generator used for its roadmap board.

## Kept surface

- `build-roadmap.mjs` — validates a roadmap JSON file and writes a self-contained HTML board.
- `roadmap.schema.json` — editor schema used by the root `roadmap.json`.
- `LICENSE` — MIT license for the vendored generator.

Demo data, package metadata, and marketing screenshots are intentionally omitted from this product repository.

## Use

From the Keelhouse repository root:

```bash
node rockmap/build-roadmap.mjs roadmap.json roadmap.html
```

The source of truth is `roadmap.json`; `roadmap.html` is the generated board committed for convenient viewing.
