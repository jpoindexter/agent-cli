import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import type { LocalBranch } from "./branchCommands";
import { composerAddMenuPosition } from "./ComposerAddMenu";
import { AppIcon } from "./icons";
import "./ComposerBranchTarget.css";

type Props = {
  currentBranch: string | null;
  load: () => Promise<LocalBranch[]>;
  onCheckout: (name: string) => Promise<unknown>;
  onCreate: (name: string) => Promise<unknown>;
};

const useBranchData = (open: boolean, load: Props["load"]) => {
  const [branches, setBranches] = useState<LocalBranch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setLoading(true); setError(null);
    void load().then(setBranches).catch((next) => setError(String(next))).finally(() => setLoading(false));
  }, [open, load]);
  return { branches, error, loading, setError };
};

export function ComposerBranchTarget(props: Props) {
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(""); const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null); const dialogRef = useRef<HTMLDivElement>(null); const inputRef = useRef<HTMLInputElement>(null);
  const data = useBranchData(open, props.load);
  const filtered = useMemo(() => data.branches.filter((branch) => branch.name.toLowerCase().includes(query.trim().toLowerCase())), [data.branches, query]);
  const canCreate = Boolean(query.trim() && !data.branches.some((branch) => branch.name === query.trim()));
  useEffect(() => {
    if (!open) return;
    setQuery(""); setActive(0); inputRef.current?.focus();
    const outside = (event: PointerEvent) => { if (!dialogRef.current?.contains(event.target as Node) && event.target !== triggerRef.current) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("pointerdown", outside); triggerRef.current?.focus(); };
  }, [open]);
  const run = async (action: "checkout" | "create", name: string) => {
    data.setError(null);
    try { await (action === "create" ? props.onCreate(name) : props.onCheckout(name)); setOpen(false); }
    catch (error) { data.setError(String(error)); }
  };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setActive((index) => filtered.length ? (index + (event.key === "ArrowDown" ? 1 : -1) + filtered.length) % filtered.length : 0); }
    if (event.key === "Enter") { event.preventDefault(); if (filtered[active]) void run("checkout", filtered[active].name); else if (canCreate) void run("create", query.trim()); }
  };
  const position = open && triggerRef.current ? composerAddMenuPosition(triggerRef.current.getBoundingClientRect(), { height: window.innerHeight, width: window.innerWidth }) : undefined;
  return <>
    <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={`Choose branch, ${props.currentBranch ?? "No branch"}`} onClick={() => setOpen((value) => !value)}>{props.currentBranch ?? "No branch"}</button>
    {open ? <div ref={dialogRef} className="composer-branch-target" role="dialog" aria-label="Choose branch" style={position}>
      <label><AppIcon name="search" /><input ref={inputRef} type="search" aria-label="Search branches" placeholder="Search branches" value={query} onKeyDown={keyDown} onChange={(event) => { setQuery(event.currentTarget.value); setActive(0); }} /></label>
      <div role="listbox" aria-label="Local branches">{filtered.map((branch, index) => <button type="button" role="option" aria-selected={branch.current} aria-label={`${branch.current ? "Current branch" : "Switch to branch"} ${branch.name}`} className={index === active ? "is-active" : ""} key={branch.name} onClick={() => void run("checkout", branch.name)}><AppIcon name={branch.current ? "check" : "git"} /><span>{branch.name}</span></button>)}</div>
      {data.loading ? <p>Loading branches…</p> : null}{data.error ? <p role="alert">{data.error}</p> : null}
      {canCreate ? <button className="composer-branch-target__create" type="button" aria-label={`Create and checkout branch ${query.trim()}`} onClick={() => void run("create", query.trim())}><AppIcon name="plus" /><span>Create and checkout <strong>{query.trim()}</strong></span></button> : null}
    </div> : null}
  </>;
}
