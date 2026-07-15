import { useEffect, useState } from "react";

import type { ChatSearchResult } from "./chatDiscovery";
import { searchDurableChatMessages } from "./chatStore";

type UseChatSearchOptions = {
  delayMs?: number;
  open: boolean;
  query: string;
  search?: (query: string) => Promise<ChatSearchResult[]>;
};

const searchChats = (query: string) => searchDurableChatMessages(query, false, 80);

export function useChatSearch(options: UseChatSearchOptions) {
  const [results, setResults] = useState<ChatSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!options.open) return;
    const query = options.query.trim();
    if (query.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(async () => {
      try {
        const nextResults = await (options.search ?? searchChats)(query);
        if (!cancelled) setResults(nextResults);
      } catch (nextError) {
        if (!cancelled) {
          setResults([]);
          setError(String(nextError));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, options.delayMs ?? 140);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [options.delayMs, options.open, options.query, options.search, revision]);
  return {
    error, loading, refresh: () => setRevision((value) => value + 1), results, setError,
  };
}
