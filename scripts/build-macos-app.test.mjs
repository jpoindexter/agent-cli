import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const script = readFileSync(new URL("./build-macos-app.sh", import.meta.url), "utf8");

test("macOS packaging supports an explicit Developer ID identity", () => {
  assert.match(script, /APPLE_SIGNING_IDENTITY/);
  assert.match(script, /--options runtime/);
  assert.match(script, /--timestamp/);
});

test("macOS packaging keeps ad-hoc signing as the local default", () => {
  assert.match(script, /signing_identity="\$\{APPLE_SIGNING_IDENTITY:--\}"/);
});
