import { describe, expect, it, vi } from "vitest";
import { searchDialogPropsFrom } from "./searchCommandDialogHost";
import type { SearchDialogCommand } from "./SearchCommandDialog";

const command: SearchDialogCommand = {
  detail: "detail", icon: "send", id: "cmd", label: "Command", run: () => {},
};

const createPalette = () => ({
  activeIndex: 2,
  close: vi.fn(),
  inputRef: { current: null },
  onKeyDown: vi.fn(),
  query: "fix",
  run: vi.fn(),
  setActiveIndex: vi.fn(),
  setQuery: vi.fn(),
});

describe("searchDialogPropsFrom", () => {
  it("binds the palette controller and forwards the visible commands to keydown", () => {
    const palette = createPalette();
    const props = searchDialogPropsFrom(palette, {
      commands: [command], error: null, loading: false, shortcut: "⌘K",
    });

    expect(props).toMatchObject({
      activeIndex: 2, commands: [command], query: "fix", shortcut: "⌘K",
    });
    expect(props.onClose).toBe(palette.close);
    expect(props.onRun).toBe(palette.run);

    const event = { key: "ArrowDown" } as never;
    props.onKeyDown(event);
    expect(palette.onKeyDown).toHaveBeenCalledWith(event, [command]);
  });
});
