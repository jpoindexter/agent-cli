// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ComposerAddMenu, composerAddMenuPosition } from "./ComposerAddMenu";
import type { ContextMenuItem } from "./ContextMenu";

afterEach(cleanup);

const actions = () => ({
  attachFiles: vi.fn(), attachCurrent: vi.fn(), attachPreview: vi.fn(),
  connections: vi.fn(), goal: vi.fn(), parallel: vi.fn(),
});

const items = (input: ReturnType<typeof actions>, currentDisabled = false): ContextMenuItem[] => [
  { id: "composer.add.files", label: "Files and folders", icon: "filePlus", onSelect: input.attachFiles },
  { id: "composer.add.current", label: "Current editor file", icon: "file", disabled: currentDisabled, onSelect: input.attachCurrent },
  { id: "composer.add.preview", label: "Browser preview", icon: "browser", onSelect: input.attachPreview },
  { id: "composer.add.parallel", label: "Parallel child chats", icon: "agent", onSelect: input.parallel },
];

const anchor = () => {
  const button = document.createElement("button");
  button.textContent = "Add";
  button.getBoundingClientRect = () => ({
    bottom: 740, height: 32, left: 16, right: 48, top: 708, width: 32, x: 16, y: 708,
    toJSON: () => ({}),
  });
  document.body.append(button);
  button.focus();
  return button;
};

const createProps = (disabled = false) => {
  const handlers = actions();
  return {
    handlers,
    props: {
      anchor: anchor(),
      items: items(handlers, disabled),
      open: true,
      onClose: vi.fn(),
      onConnections: handlers.connections,
      onGoal: handlers.goal,
    },
  };
};

describe("ComposerAddMenu", () => {
  it("renders Add, Task, and Connections groups in order and routes real actions", () => {
    const { handlers, props } = createProps();
    const { container } = render(<ComposerAddMenu {...props} />);
    const text = container.textContent ?? "";
    expect(text.indexOf("Add")).toBeLessThan(text.indexOf("Task"));
    expect(text.indexOf("Task")).toBeLessThan(text.indexOf("Connections"));

    fireEvent.click(screen.getByRole("menuitem", { name: "Files and folders" }));
    expect(handlers.attachFiles).toHaveBeenCalledOnce();
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("explains disabled actions instead of rendering decorative rows", () => {
    const { props } = createProps(true);
    render(<ComposerAddMenu {...props} />);

    const current = screen.getByRole("menuitem", { name: /Current editor file/ });
    expect(current.hasAttribute("disabled")).toBe(true);
    expect(current.getAttribute("title")).toContain("Open an editor file first");
  });

  it("supports arrow navigation and Enter activation", () => {
    const { handlers, props } = createProps();
    render(<ComposerAddMenu {...props} />);
    const menu = screen.getByRole("menu", { name: "Add context or action" });

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    fireEvent.keyDown(menu, { key: "Enter" });

    expect(handlers.attachCurrent).toHaveBeenCalledOnce();
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("closes on outside pointer input", () => {
    const { props } = createProps();
    render(<ComposerAddMenu {...props} />);

    fireEvent.pointerDown(document.body);

    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("closes on Escape and restores focus to the trigger", () => {
    const { props } = createProps();
    const { rerender } = render(<ComposerAddMenu {...props} />);
    fireEvent.keyDown(screen.getByRole("menu", { name: "Add context or action" }), { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledOnce();

    rerender(<ComposerAddMenu {...props} open={false} />);
    expect(document.activeElement).toBe(props.anchor);
  });

  it("clamps the popover inside narrow and short viewports", () => {
    expect(composerAddMenuPosition(
      { bottom: 580, left: 880, top: 548 }, { height: 600, width: 900 },
    )).toEqual({ left: 548, maxHeight: 520, top: 20, width: 340 });
    expect(composerAddMenuPosition(
      { bottom: 80, left: 4, top: 48 }, { height: 420, width: 320 },
    )).toEqual({ left: 12, maxHeight: 320, top: 88, width: 296 });
  });
});
