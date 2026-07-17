import { chatProviderLabel, type ChatProvider } from "./chatConversation";

export type ComposerModelChoice = {
  provider: ChatProvider; id: string; label: string; detail: string;
  configured: boolean; current: boolean;
};

export type ComposerModelGroup = {
  id: string; label: string; provider: ChatProvider;
  source: "native" | "live" | "fallback"; choices: ComposerModelChoice[];
};

const SUGGESTED_MODELS: Record<"codex" | "claude", string[]> = {
  codex: ["gpt-5.6-sol"], claude: ["sonnet", "opus", "haiku"],
};

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI", google: "Google", anthropic: "Anthropic", opencode: "OpenCode",
  openrouter: "OpenRouter", ollama: "Ollama", azure: "Azure", amazon: "Amazon Bedrock",
};

const providerLabel = (id: string) => PROVIDER_LABELS[id.toLowerCase()]
  ?? id.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const choice = (
  provider: ChatProvider, id: string, label: string, configuredModel: string,
  selectedProvider: ChatProvider, selectedModel: string, detail: string,
): ComposerModelChoice => ({
  provider, id, label, detail,
  configured: Boolean(id) && id === configuredModel,
  current: provider === selectedProvider && id === selectedModel,
});

const nativeGroup = (
  provider: "codex" | "claude", configured: string,
  selectedProvider: ChatProvider, selectedModel: string,
): ComposerModelGroup => {
  const ids = [...new Set([configured, selectedProvider === provider ? selectedModel : "", ...SUGGESTED_MODELS[provider]].filter(Boolean))];
  const choices = [choice(provider, "", `${chatProviderLabel(provider)} default`, configured, selectedProvider, selectedModel, "Provider default")];
  choices.push(...ids.map((id) => choice(provider, id, id, configured, selectedProvider, selectedModel, id === configured ? "Configured default" : "Available model")));
  return { id: provider, label: chatProviderLabel(provider), provider, source: "native", choices };
};

const openCodeGroups = (
  configured: string, selectedProvider: ChatProvider, selectedModel: string, models: string[],
): ComposerModelGroup[] => {
  const addresses = [...new Set([configured, selectedProvider === "opencode" ? selectedModel : "", ...models].filter(Boolean))];
  const grouped = new Map<string, string[]>();
  for (const address of addresses) {
    const catalogProvider = address.split("/", 1)[0];
    grouped.set(catalogProvider, [...(grouped.get(catalogProvider) ?? []), address]);
  }
  const groups = [...grouped].map(([catalogProvider, ids]) => ({
    id: `opencode:${catalogProvider}`, label: providerLabel(catalogProvider), provider: "opencode" as const,
    source: models.length ? "live" as const : "fallback" as const,
    choices: ids.map((id) => choice("opencode", id, id.slice(catalogProvider.length + 1), configured, selectedProvider, selectedModel, id)),
  }));
  const defaultChoice = choice("opencode", "", "OpenCode default", configured, selectedProvider, selectedModel, "OpenCode default");
  const openCodeGroup = groups.find((group) => group.id === "opencode:opencode");
  if (openCodeGroup) openCodeGroup.choices.unshift(defaultChoice);
  else groups.push({
    id: "opencode", label: "OpenCode", provider: "opencode", source: "fallback",
    choices: [defaultChoice],
  });
  return groups.sort((left, right) => left.label.localeCompare(right.label));
};

export const composerModelGroups = (
  configuredModels: Partial<Record<ChatProvider, string>>, selectedProvider: ChatProvider,
  selectedModel: string, openCodeModels: string[],
): ComposerModelGroup[] => [
  nativeGroup("codex", configuredModels.codex?.trim() ?? "", selectedProvider, selectedModel.trim()),
  nativeGroup("claude", configuredModels.claude?.trim() ?? "", selectedProvider, selectedModel.trim()),
  ...openCodeGroups(configuredModels.opencode?.trim() ?? "", selectedProvider, selectedModel.trim(), openCodeModels),
];

export const filterComposerModelGroups = (groups: ComposerModelGroup[], query: string) => {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return groups;
  return groups.flatMap((group) => {
    if (`${group.label} ${group.provider}`.toLocaleLowerCase().includes(needle)) return [group];
    const choices = group.choices.filter((item) => `${item.label} ${item.id} ${item.detail}`.toLocaleLowerCase().includes(needle));
    return choices.length ? [{ ...group, choices }] : [];
  });
};
