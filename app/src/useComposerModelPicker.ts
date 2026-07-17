import { useEffect, useMemo, useRef, useState } from "react";

import type { ChatProvider } from "./chatConversation";
import { composerModelGroups, filterComposerModelGroups } from "./composerModels";
import { useOpenCodeModels } from "./opencodeModels";

const pickerKeyHandler = (
  customMode: boolean, choices: ReturnType<typeof composerModelGroups>[number]["choices"], activeIndex: number,
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>, close: () => void,
  choose: (provider: ChatProvider, model: string) => void,
) => (event: React.KeyboardEvent) => {
  if (event.key === "Escape") { event.preventDefault(); close(); return; }
  if (customMode || choices.length === 0) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    setActiveIndex((index) => (index + direction + choices.length) % choices.length);
  } else if (event.key === "Enter" && choices[activeIndex]) {
    event.preventDefault(); choose(choices[activeIndex].provider, choices[activeIndex].id);
  }
};

export function useComposerModelPicker({
  provider, model, configuredModels, onSelect,
}: {
  provider: ChatProvider; model: string; configuredModels: Partial<Record<ChatProvider, string>>;
  onSelect: (provider: ChatProvider, model: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false); const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false); const [customModel, setCustomModel] = useState("");
  const [activeIndex, setActiveIndex] = useState(0); const [activeGroupId, setActiveGroupId] = useState("");
  const rootRef = useRef<HTMLDivElement>(null); const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null); const catalog = useOpenCodeModels(open);
  const groups = useMemo(() => composerModelGroups(configuredModels, provider, model, catalog.models), [catalog.models, configuredModels, model, provider]);
  const filteredGroups = useMemo(() => filterComposerModelGroups(groups, query), [groups, query]);
  const preferred = filteredGroups.find((group) => group.choices.some((item) => item.current));
  const activeGroup = filteredGroups.find((group) => group.id === activeGroupId) ?? preferred ?? filteredGroups[0];
  const choices = activeGroup?.choices ?? [];
  const close = (restoreFocus = true) => {
    setOpen(false); setQuery(""); setCustomMode(false); setActiveIndex(0); setActiveGroupId("");
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const choose = async (nextProvider: ChatProvider, nextModel: string) => { await onSelect(nextProvider, nextModel); close(); };
  useEffect(() => { if (open) requestAnimationFrame(() => searchRef.current?.focus()); }, [open]);
  useEffect(() => setActiveIndex((index) => Math.min(index, Math.max(0, choices.length - 1))), [choices.length]);
  const handleKeyDown = pickerKeyHandler(customMode, choices, activeIndex, setActiveIndex, close, (nextProvider, nextModel) => void choose(nextProvider, nextModel));
  return {
    activeGroup, activeGroupId: activeGroup?.id ?? "", activeIndex, catalog, choices, choose, close,
    customMode, customModel, filteredGroups, handleKeyDown, open, query, rootRef, searchRef,
    setActiveGroupId: (id: string) => { setActiveGroupId(id); setActiveIndex(0); },
    setActiveIndex, setCustomMode, setCustomModel, setOpen, setQuery, triggerRef,
  };
}
