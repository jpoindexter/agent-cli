import { readFileSync } from "node:fs";

const localImport = /^@import\s+["']([^"']+)["'];\s*$/gm;

export const readCssSource = (url: URL): string => {
  const css = readFileSync(url, "utf8");
  return css.replace(localImport, (_statement, relativePath: string) =>
    readCssSource(new URL(relativePath, url))
  );
};
