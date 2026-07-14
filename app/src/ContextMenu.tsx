import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { AppIcon, type AppIconName } from "./icons";

export type ContextMenuItem = {
  id: string;
  label: string;
  shortcut?: string;
  icon?: AppIconName;
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => unknown | Promise<unknown>;
};

export type ContextMenuState = {
  x: number;
  y: number;
  items: ContextMenuItem[];
};

type ContextMenuProps = {
  state: ContextMenuState;
  onDismiss: () => void;
  onActionError: (item: ContextMenuItem, error: unknown) => void;
};

export const contextMenuPosition = (
  state: Pick<ContextMenuState, "x" | "y" | "items">,
  viewport: { width: number; height: number },
) => {
  const width = 252;
  const height = state.items.length * 28 + 12;
  const gutter = 8;
  return {
    left: Math.max(gutter, Math.min(state.x, viewport.width - width - gutter)),
    top: Math.max(gutter, Math.min(state.y, viewport.height - height - gutter)),
  };
};

const useContextMenuDismissal = (ref: RefObject<HTMLDivElement | null>, onDismiss: () => void, state: ContextMenuState) => {
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    const dismiss = () => onDismiss();
    const dismissOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", dismissOnEscape);
    return () => {
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", dismissOnEscape);
    };
  }, [onDismiss, state]);
};

const enabledMenuButtons = (ref: RefObject<HTMLDivElement | null>) =>
  Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);

const handleMenuKeyDown = (
  event: KeyboardEvent<HTMLDivElement>,
  ref: RefObject<HTMLDivElement | null>,
  onDismiss: () => void,
) => {
  const buttons = enabledMenuButtons(ref);
  if (buttons.length === 0) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    buttons[current === -1 ? (direction === 1 ? 0 : buttons.length - 1) : (current + direction + buttons.length) % buttons.length]?.focus();
  } else {
    if (event.key === "Escape") {
      event.preventDefault();
      onDismiss();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      buttons[event.key === "Home" ? 0 : buttons.length - 1]?.focus();
    }
  }
};

const ContextMenuItemButton = ({ item, onDismiss, onActionError }: Pick<ContextMenuProps, "onDismiss" | "onActionError"> & { item: ContextMenuItem }) => {
  const run = async () => {
    if (item.disabled) return;
    onDismiss();
    try {
      await item.onSelect();
    } catch (error) {
      onActionError(item, error);
    }
  };
  return (
    <button className={item.danger ? "context-menu__item context-menu__item--danger" : "context-menu__item"} type="button" role="menuitem" disabled={item.disabled} data-menu-action-id={item.id} onClick={() => void run()}>
      <span className="context-menu__label">{item.icon ? <AppIcon name={item.icon} /> : null}<span>{item.label}</span></span>
      {item.shortcut ? <span className="context-menu__shortcut">{item.shortcut}</span> : null}
    </button>
  );
};

export function ContextMenu({ state, onDismiss, onActionError }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useContextMenuDismissal(ref, onDismiss, state);
  const position = contextMenuPosition(state, {
    width: typeof window === "undefined" ? 1440 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight,
  });

  return (
    <div
      ref={ref}
      className="context-menu"
      style={position}
      aria-label="Context menu"
      role="menu"
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => handleMenuKeyDown(event, ref, onDismiss)}
    >
      {state.items.map((item) => <ContextMenuItemButton item={item} key={item.id} onDismiss={onDismiss} onActionError={onActionError} />)}
    </div>
  );
}
