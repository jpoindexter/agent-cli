import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import type { ContextMenuItem } from "./ContextMenu";
import { AppIcon, type AppIconName } from "./icons";
import "./ComposerAddMenu.css";

type AnchorRect = Pick<DOMRect, "bottom" | "left" | "top">;
type Viewport = { height: number; width: number };
type MenuPosition = { left: number; maxHeight: number; top: number; width: number };

export type ComposerAddMenuProps = {
  anchor: HTMLElement | null;
  items: ContextMenuItem[];
  open: boolean;
  onClose: () => void;
  onConnections: () => void;
  onGoal: () => void;
};

type MenuRow = {
  disabled?: boolean;
  group: "Add" | "Task" | "Connections";
  icon: AppIconName;
  id: string;
  label: string;
  onSelect: () => unknown;
  reason?: string;
};

export const composerAddMenuPosition = (anchor: AnchorRect, viewport: Viewport): MenuPosition => {
  const width = Math.min(340, Math.max(240, viewport.width - 24));
  const left = Math.min(Math.max(12, anchor.left), viewport.width - width - 12);
  const baseMaxHeight = Math.max(180, viewport.height - 80);
  const spaceAbove = anchor.top - 12;
  const spaceBelow = viewport.height - anchor.bottom - 12;
  const above = spaceAbove >= 240 || spaceAbove >= spaceBelow;
  const maxHeight = above
    ? Math.min(baseMaxHeight, Math.max(180, anchor.top - 28))
    : Math.min(baseMaxHeight, Math.max(180, viewport.height - anchor.bottom - 20));
  const top = above ? Math.max(12, anchor.top - maxHeight - 8) : anchor.bottom + 8;
  return { left, maxHeight, top, width };
};

const reasonFor = (item: ContextMenuItem) => item.id === "composer.add.current"
  ? "Open an editor file first."
  : item.id === "composer.add.parallel"
    ? "Open a project and finish the current run first."
    : undefined;

const menuRows = (
  items: ContextMenuItem[], onGoal: () => void, onConnections: () => void,
): MenuRow[] => {
  const itemRow = (item: ContextMenuItem, group: MenuRow["group"]): MenuRow => ({
    disabled: item.disabled, group, icon: item.icon ?? "plus", id: item.id,
    label: item.label, onSelect: item.onSelect, reason: item.disabled ? reasonFor(item) : undefined,
  });
  const byId = (id: string) => items.find((item) => item.id === id);
  return [
    ...items.filter((item) => item.id !== "composer.add.parallel").map((item) => itemRow(item, "Add")),
    { group: "Task", icon: "target", id: "composer.add.goal", label: "Goal", onSelect: onGoal },
    ...(byId("composer.add.parallel") ? [itemRow(byId("composer.add.parallel")!, "Task")] : []),
    { group: "Connections", icon: "settings", id: "composer.add.connections", label: "Provider and MCP settings", onSelect: onConnections },
  ];
};

const MenuGroup = ({ activeIndex, group, offset, rows, onRun }: {
  activeIndex: number; group: MenuRow["group"]; offset: number; rows: MenuRow[];
  onRun: (row: MenuRow) => void;
}) => (
  <section className="composer-add-menu__group" aria-labelledby={`composer-add-${group.toLowerCase()}`}>
    <h3 id={`composer-add-${group.toLowerCase()}`}>{group}</h3>
    {rows.map((row, index) => <button className={activeIndex === offset + index ? "composer-add-menu__item--active" : ""} type="button" role="menuitem" tabIndex={-1} disabled={row.disabled} title={row.reason} aria-label={row.reason ? `${row.label}. ${row.reason}` : row.label} key={row.id} onClick={() => onRun(row)}><AppIcon name={row.icon} /><span><strong>{row.label}</strong>{row.reason ? <small>{row.reason}</small> : null}</span></button>)}
  </section>
);

export function ComposerAddMenu(props: ComposerAddMenuProps) {
  const rows = useMemo(() => menuRows(props.items, props.onGoal, props.onConnections), [props.items, props.onConnections, props.onGoal]);
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(props.onClose);
  closeRef.current = props.onClose;
  useEffect(() => {
    if (!props.open) return;
    setActiveIndex(0); menuRef.current?.focus();
    const pointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && event.target !== props.anchor) closeRef.current();
    };
    document.addEventListener("pointerdown", pointerDown);
    return () => { document.removeEventListener("pointerdown", pointerDown); props.anchor?.focus(); };
  }, [props.anchor, props.open]);
  if (!props.open || !props.anchor) return null;
  const position = composerAddMenuPosition(props.anchor.getBoundingClientRect(), { height: window.innerHeight, width: window.innerWidth });
  const run = (row: MenuRow) => { if (row.disabled) return; props.onClose(); void row.onSelect(); };
  const move = (delta: number) => setActiveIndex((current) => {
    let next = current;
    do { next = (next + delta + rows.length) % rows.length; } while (rows[next]?.disabled && next !== current);
    return next;
  });
  const keyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") { event.preventDefault(); props.onClose(); }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); move(event.key === "ArrowDown" ? 1 : -1); }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (rows[activeIndex]) run(rows[activeIndex]); }
  };
  let offset = 0;
  return (
    <div ref={menuRef} className="composer-add-menu" role="menu" aria-label="Add context or action" tabIndex={-1} style={position} onKeyDown={keyDown}>
      {(["Add", "Task", "Connections"] as const).map((group) => { const grouped = rows.filter((row) => row.group === group); const start = offset; offset += grouped.length; return <MenuGroup activeIndex={activeIndex} group={group} key={group} offset={start} rows={grouped} onRun={run} />; })}
    </div>
  );
}
