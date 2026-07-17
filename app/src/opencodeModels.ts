import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const MODEL_ADDRESS = /^[^\s/]+\/[^\s]+$/;

export const normalizeOpenCodeModels = (value: unknown): string[] => {
  if (typeof value !== "object" || value == null) return [];
  const models = (value as Record<string, unknown>).models;
  if (!Array.isArray(models)) return [];
  return [...new Set(models
    .filter((model): model is string => typeof model === "string")
    .map((model) => model.trim())
    .filter((model) => model.length <= 256 && MODEL_ADDRESS.test(model)))]
    .sort((left, right) => left.localeCompare(right))
    .slice(0, 2000);
};

export const useOpenCodeModels = (open: boolean) => {
  const [models, setModels] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async (force = true) => {
    setLoading(true); setLoaded(true); setError("");
    try {
      const result = await invoke<unknown>("opencode_models", { refresh: force });
      setModels(normalizeOpenCodeModels(result));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { if (open && !loaded && !loading) void refresh(false); }, [loaded, loading, open, refresh]);
  return { error, loading, models, refresh };
};
