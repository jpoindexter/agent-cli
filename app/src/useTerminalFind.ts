import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

import { nextTerminalFindIndex, type TerminalFindHit } from "./terminalFind";

export type TerminalFindController = {
  busy: boolean;
  close: () => void;
  error: string | null;
  hits: TerminalFindHit[];
  index: number | null;
  lastQuery: string;
  open: boolean;
  query: string;
  run: () => Promise<void>;
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  step: (direction: 1 | -1) => void;
  toggle: () => void;
};

const scrollToHit = (hits: TerminalFindHit[], index: number | null) => {
  if (index == null || !hits[index]) return;
  void invoke("scroll_terminal_to_row", { row: hits[index].row });
};

export const useTerminalFind = (enabled: boolean): TerminalFindController => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<TerminalFindHit[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  const run = async () => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery || !enabled || busy) return;
    setBusy(true);
    setError(null);
    try {
      const nextHits = await invoke<TerminalFindHit[]>("search_terminal_scrollback", { query: normalizedQuery });
      const first = nextHits.length > 0 ? 0 : null;
      setHits(nextHits);
      setLastQuery(normalizedQuery);
      setIndex(first);
      scrollToHit(nextHits, first);
    } catch (nextError) {
      setHits([]);
      setIndex(null);
      setError(String(nextError));
    } finally {
      setBusy(false);
    }
  };

  const step = (direction: 1 | -1) => {
    const nextIndex = nextTerminalFindIndex(index, hits.length, direction);
    setIndex(nextIndex);
    scrollToHit(hits, nextIndex);
  };

  const close = () => {
    setOpen(false);
    setError(null);
    // Ghostty clamps at the live bottom; a large delta snaps back to the tail.
    void invoke("scroll_pty", { delta: 10_000_000 });
  };

  return { busy, close, error, hits, index, lastQuery, open, query, run, setOpen, setQuery, step, toggle: () => setOpen((current) => !current) };
};
