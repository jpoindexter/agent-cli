import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TerminalFindBar } from "./TerminalFindBar";
import type { TerminalFindController } from "./useTerminalFind";

const controller = (overrides: Partial<TerminalFindController> = {}): TerminalFindController => ({
  busy: false,
  close: vi.fn(),
  error: null,
  hits: [],
  index: null,
  lastQuery: "",
  open: true,
  query: "",
  run: vi.fn(),
  setOpen: vi.fn(),
  setQuery: vi.fn(),
  step: vi.fn(),
  toggle: vi.fn(),
  ...overrides,
});

describe("TerminalFindBar", () => {
  it("renders terminal match state and the active preview", () => {
    const html = renderToStaticMarkup(<TerminalFindBar controller={controller({
      hits: [{ row: 4, col: 2, text: "npm run build" }],
      index: 0,
      query: "build",
    })} />);

    expect(html).toContain("1 of 1");
    expect(html).toContain("npm run build");
    expect(html).toContain("Terminal search query");
  });

  it("does not render while closed", () => {
    expect(renderToStaticMarkup(<TerminalFindBar controller={controller({ open: false })} />)).toBe("");
  });
});
