# macOS Packaging

Build the local ad-hoc-signed app from `app/`:

```bash
npm run package:mac
open src-tauri/target/release/bundle/macos/Keelhouse.app
```

The script requires Homebrew Zig `0.15.2`. Zig 0.15.2's bundled libc++ fails against this machine's CLT 27 SDK because `INFINITY` is not declared during the optimized Ghostty build. `scripts/build-macos-app.sh` copies Zig's library into the ignored Cargo `target/` directory, patches that one expression to `numeric_limits<_RealT>::infinity()`, and sets `ZIG_LIB_DIR` only for this build. It seals the complete app bundle with an ad-hoc signature by default or an explicit Developer ID identity, then runs strict deep verification so `Info.plist` and icon resources are covered. It never changes Homebrew, Xcode, `xcode-select`, or the installed Zig files.

Output: `app/src-tauri/target/release/bundle/macos/Keelhouse.app`. The local bundle is arm64 and ad-hoc signed by default.

For a Developer ID release build, pass the certificate identity explicitly:

```bash
APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)" npm run package:mac
```

That path enables the hardened runtime and a trusted timestamp. Apple notarization remains a separate release gate; a signed but unnotarized prerelease must be labeled accordingly.

Verified 2026-07-17: the Developer ID build launched as the native app, restored the real workspace, and exposed the project switcher, New Project, Open Project, chat composer, editor, and trays. The bundle passes `codesign --verify --deep --strict`, is arm64 version `0.1.0`, and carries the hardened-runtime flag and a trusted timestamp. Gatekeeper still reports `Unnotarized Developer ID`, which is why the download remains a prerelease.
