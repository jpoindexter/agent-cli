import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { BottomUtilityTabs } from "./BottomUtilityTabs";

describe("BottomUtilityTabs", () => {
  it("keeps all utility surfaces reachable while collapsed", () => {
    const html = renderToStaticMarkup(<BottomUtilityTabs mode="terminal" open={false} onContextMenu={vi.fn()} onOpen={vi.fn()} onToggleVisibility={vi.fn()} />);
    expect(html).toContain("Terminal");
    expect(html).toContain("Processes");
    expect(html).toContain("Logs");
    expect(html).toContain("Expand utility tray");
  });
});
