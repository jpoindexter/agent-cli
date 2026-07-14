import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./App.css", import.meta.url), "utf8");

describe("responsive shell CSS contract", () => {
  it("keeps chat primary and the bottom tray available in every dock position", () => {
    const convergence = css.slice(css.indexOf("Chrome convergence:"));
    expect(convergence).toMatch(/\.workbench\.workbench--drawer-right\s*\{[^}]*grid-template-rows:\s*38px minmax\(0,\s*1fr\) 6px var\(--utility-tray-height, 42px\);[^}]*"utilitysplit utilitysplit utilitysplit"[^}]*"utility utility utility";/s);
    expect(convergence).toMatch(/\.workbench\.workbench--drawer-left\s*\{[^}]*grid-template-rows:\s*38px minmax\(0,\s*1fr\) 6px var\(--utility-tray-height, 42px\);[^}]*"utilitysplit utilitysplit utilitysplit"[^}]*"utility utility utility";/s);
    expect(convergence).toMatch(/\.workbench\.workbench--drawer-bottom\s*\{[^}]*grid-template-rows:[^}]*var\(--utility-tray-height, 42px\);[^}]*"utilitysplit"[^}]*"utility";/s);
    expect(convergence).toMatch(/\.workbench\.workbench--drawer-hidden\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\) 6px var\(--utility-tray-height, 42px\);[^}]*"utilitysplit"[^}]*"utility";/s);
    expect(convergence).toMatch(/\.agent-surface--terminal \.agent-chat-surface\s*\{[^}]*display:\s*flex;/s);
    expect(convergence).toMatch(/\.agent-chat-surface\s*\{[^}]*height:\s*100%;/s);
    expect(convergence).toMatch(/\.chat-thread\s*\{[^}]*flex:\s*1 1 auto;[^}]*min-height:\s*0;/s);
  });

  it("removes the Threads column instead of leaving a clipped icon rail", () => {
    const convergence = css.slice(css.indexOf("Chrome convergence:"));
    expect(convergence).toMatch(/\.app-shell\.app-shell--side-drawer-collapsed\s*\{[^}]*grid-template-columns:\s*0 0 minmax\(0, 1fr\);/s);
    expect(convergence).toMatch(/\.app-shell--side-drawer-collapsed \.file-rail\s*\{[^}]*display:\s*none;/s);
    expect(convergence).toMatch(/\.app-shell--side-drawer-collapsed \.status-bar\s*\{[^}]*grid-template-columns:\s*0 minmax\(0, 1fr\) auto;/s);
  });

  it("uses hairline pane boundaries with wider invisible resize targets", () => {
    const convergence = css.slice(css.indexOf("Chrome convergence:"));
    expect(convergence).toContain("grid-template-columns: minmax(420px, 1fr) 1px var(--dock-width, 430px);");
    expect(convergence).toContain("grid-template-columns: var(--dock-width, 430px) 1px minmax(420px, 1fr);");
    expect(convergence).toMatch(/\.side-drawer-resizer\s*\{[^}]*width:\s*9px;[^}]*margin-left:\s*-4px;[^}]*border-left:\s*1px solid #2b2d36;/s);
    expect(convergence).toMatch(/\.workbench--drawer-right \.workbench-resizer--tray\.workbench-resizer--right\s*\{[^}]*width:\s*9px;[^}]*margin-left:\s*-4px;[^}]*border-left:\s*1px solid #2b2d36;/s);
  });
});
