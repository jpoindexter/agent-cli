import { chatProviderLabel, type ChatProvider } from "./chatConversation";
import type { ComposerModelChoice, ComposerModelGroup } from "./composerModels";
import { AppIcon } from "./icons";

type MenuProps = {
  activeGroup?: ComposerModelGroup; activeGroupId: string; activeIndex: number;
  catalogError: string; catalogLoading: boolean; groups: ComposerModelGroup[];
  onActiveGroupChange: (id: string) => void; onActiveIndexChange: (index: number) => void;
  onChoose: (provider: ChatProvider, model: string) => void; onRefresh: () => void;
};

function ProviderNav(props: Pick<MenuProps, "activeGroupId" | "groups" | "onActiveGroupChange">) {
  return <nav className="composer-model-picker__providers" aria-label="Model providers">
    {props.groups.map((group) => <button
      key={group.id} type="button" className={group.id === props.activeGroupId ? "is-active" : ""}
      aria-label={`${group.label}, ${group.choices.length} ${group.choices.length === 1 ? "model" : "models"}`}
      onClick={() => props.onActiveGroupChange(group.id)}
    ><span><strong>{group.label}</strong><small>{group.provider === "opencode" ? "via OpenCode" : "Native"}</small></span><b>{group.choices.length}</b></button>)}
  </nav>;
}

function ModelChoiceRow(props: { choice: ComposerModelChoice; active: boolean; index: number; onActive: (index: number) => void; onChoose: MenuProps["onChoose"] }) {
  const { choice } = props;
  return <button
    className={`composer-model-picker__model${props.active ? " is-active" : ""}`}
    type="button" role="option" aria-selected={choice.current}
    onMouseEnter={() => props.onActive(props.index)} onClick={() => props.onChoose(choice.provider, choice.id)}
  >
    <span className="composer-model-picker__model-copy"><strong>{choice.label}</strong><small>{choice.detail}</small></span>
    <span className="composer-model-picker__badges">{choice.current ? <span className="is-current"><AppIcon name="check" />Current</span> : null}{choice.configured ? <span className="is-default">Default</span> : null}</span>
  </button>;
}

function ModelDetail(props: MenuProps) {
  const group = props.activeGroup;
  if (!group) return <section className="composer-model-picker__detail"><div className="composer-model-picker__empty">No matching providers or models</div></section>;
  return <section className="composer-model-picker__detail" aria-live="polite">
    <header><div><strong>{group.label}</strong><small>{group.source === "live" ? "Live OpenCode catalog" : group.source === "native" ? "Keelhouse provider" : "Configured fallback"}</small></div>{group.provider === "opencode" ? <button type="button" aria-label="Refresh OpenCode models" disabled={props.catalogLoading} onClick={props.onRefresh}><AppIcon name={props.catalogLoading ? "loading" : "reload"} /></button> : null}</header>
    {props.catalogError && group.provider === "opencode" ? <p className="composer-model-picker__error" role="status">Could not refresh OpenCode. Showing configured models.</p> : null}
    <div className="composer-model-picker__models" role="listbox" aria-label={`${group.label} models`}>
      {group.choices.map((choice, index) => <ModelChoiceRow key={`${choice.provider}:${choice.id || "default"}`} choice={choice} active={index === props.activeIndex} index={index} onActive={props.onActiveIndexChange} onChoose={props.onChoose} />)}
    </div>
  </section>;
}

export function ComposerModelMenu(props: MenuProps) {
  return <div className="composer-model-picker__browser"><ProviderNav {...props} /><ModelDetail {...props} /></div>;
}

export function CustomModelForm({ provider, value, onBack, onChange, onSubmit }: {
  provider: ChatProvider; value: string; onBack: () => void; onChange: (value: string) => void; onSubmit: () => void;
}) {
  return <form className="composer-model-picker__custom" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
    <label htmlFor="composer-custom-model">Custom {chatProviderLabel(provider)} model ID</label>
    <input id="composer-custom-model" autoFocus maxLength={256} value={value} onChange={(event) => onChange(event.currentTarget.value)} placeholder={provider === "opencode" ? "provider/model" : "Model ID"} />
    <div><button type="button" onClick={onBack}>Back</button><button type="submit" disabled={!value.trim()}>Use model</button></div>
  </form>;
}
