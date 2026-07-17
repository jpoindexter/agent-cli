#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
  .split("\0").filter(Boolean);
const errors = [];

const forbidden = [
  /(^|\/)\.DS_Store$/,
  /(^|\/)(node_modules|dist|target|coverage)\//,
  /\.(?:app|dmg|log|tmp|zip)$/i,
  /^app\/(?:public\/(?:tauri|vite)|src\/assets\/react)\.svg$/,
  /^resources\/superconductor-reference\/(?:Info\.plist|super\.icns)$/,
  /^(?:docs\/(?:brainstorm|superpowers)|flow-report\.html)/,
];

for (const path of tracked) {
  if (forbidden.some((pattern) => pattern.test(path))) errors.push(`forbidden tracked file: ${path}`);
  if (/(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith(".env.example")) {
    errors.push(`forbidden tracked environment file: ${path}`);
  }
  const bytes = statSync(resolve(root, path)).size;
  if (bytes > 2 * 1024 * 1024) errors.push(`tracked file exceeds 2 MiB: ${path}`);
}

const html = readFileSync(resolve(root, "app/index.html"), "utf8");
const favicon = html.match(/href="\/([^"#?]+)"/)?.[1];
if (!favicon || !existsSync(resolve(root, "app/public", favicon))) {
  errors.push(`missing public favicon target: ${favicon ?? "not declared"}`);
}

const tauri = JSON.parse(readFileSync(resolve(root, "app/src-tauri/tauri.conf.json"), "utf8"));
for (const icon of tauri.bundle?.icon ?? []) {
  if (!existsSync(resolve(root, "app/src-tauri", icon))) errors.push(`missing Tauri icon: ${icon}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`repository hygiene ok (${tracked.length} tracked files)`);
