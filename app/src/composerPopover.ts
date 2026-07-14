import type { FormEvent } from "react";

import { closeOtherOpenComposerMenus } from "./composerMenus";

export const composerPopoverPosition = (menu: HTMLDetailsElement) => {
  if (!menu.open) {
    delete menu.dataset.popoverPositioned;
    return;
  }
  const anchor = menu.querySelector<HTMLElement>("summary");
  const popover = menu.querySelector<HTMLElement>(".agent-composer__popover");
  if (!anchor || !popover) return;

  const anchorRect = anchor.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  const gutter = 12;
  const gap = 8;
  const width = Math.min(popoverRect.width, window.innerWidth - gutter * 2);
  const height = Math.min(popoverRect.height, window.innerHeight - gutter * 2);
  const alignRight = menu.classList.contains("agent-composer__menu--runtime");
  const left = Math.max(gutter, Math.min(
    alignRight ? anchorRect.right - width : anchorRect.left,
    window.innerWidth - width - gutter,
  ));
  const roomAbove = anchorRect.top - gutter;
  const roomBelow = window.innerHeight - anchorRect.bottom - gutter;
  const top = roomAbove >= height + gap || roomAbove >= roomBelow
    ? Math.max(gutter, anchorRect.top - height - gap)
    : Math.min(window.innerHeight - height - gutter, anchorRect.bottom + gap);

  menu.style.setProperty("--composer-popover-left", `${left}px`);
  menu.style.setProperty("--composer-popover-top", `${top}px`);
  menu.dataset.popoverPositioned = "true";
};

export const handleComposerMenuToggle = (event: FormEvent<HTMLDetailsElement>) => {
  const current = event.currentTarget;
  const menus = current.closest(".agent-composer__bar")?.querySelectorAll<HTMLDetailsElement>("details.agent-composer__menu[open]");
  closeOtherOpenComposerMenus(current, menus ?? []);
  if (current.open) requestAnimationFrame(() => composerPopoverPosition(current));
  else delete current.dataset.popoverPositioned;
};
