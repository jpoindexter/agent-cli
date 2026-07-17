import type { ChatProvider } from "./chatConversation";
import { createPortal } from "react-dom";
import { chatProviderLabel } from "./chatConversation";
import { ComposerModelPopover } from "./ComposerModelPopover";
import { AppIcon } from "./icons";
import { useComposerModelPicker } from "./useComposerModelPicker";

type ComposerModelPickerProps = {
  provider: ChatProvider;
  model: string;
  configuredModels: Partial<Record<ChatProvider, string>>;
  disabled?: boolean;
  onManageModels: () => void;
  onSelect: (provider: ChatProvider, model: string) => void | Promise<void>;
};

export function ComposerModelPicker(props: ComposerModelPickerProps) {
  const state = useComposerModelPicker(props);
  const activeModel = props.model.trim() || props.configuredModels[props.provider]?.trim() || `${chatProviderLabel(props.provider)} default`;
  return (
    <div className="composer-model-picker" ref={state.rootRef} onKeyDown={state.handleKeyDown}>
      <button
        ref={state.triggerRef}
        className="agent-composer__control composer-model-picker__trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={state.open}
        disabled={props.disabled}
        onClick={() => state.setOpen((value) => !value)}
      >
        <AppIcon name="agent" /><span>{activeModel}</span><AppIcon name="chevronDown" />
      </button>
      {state.open ? createPortal(
        <ComposerModelPopover
          activeGroup={state.activeGroup} activeGroupId={state.activeGroupId} activeIndex={state.activeIndex}
          catalogError={state.catalog.error} catalogLoading={state.catalog.loading} customMode={state.customMode}
          customModel={state.customModel} groups={state.filteredGroups} query={state.query} searchRef={state.searchRef}
          onActiveGroupChange={state.setActiveGroupId}
          onActiveIndexChange={state.setActiveIndex} onChoose={(provider, model) => void state.choose(provider, model)}
          onCustomModeChange={(value) => { state.setCustomMode(value); if (value) state.setCustomModel(props.model); }}
          onCustomModelChange={state.setCustomModel} onQueryChange={(query) => { state.setQuery(query); state.setActiveIndex(0); }}
          onRefresh={() => void state.catalog.refresh()}
          onDismiss={() => state.close()}
          onManageModels={() => { state.close(false); props.onManageModels(); }}
        />,
        document.body,
      ) : null}
    </div>
  );
}
