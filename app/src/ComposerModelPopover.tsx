import type { RefObject } from "react";

import type { ChatProvider } from "./chatConversation";
import { AppIcon } from "./icons";
import { ComposerModelMenu, CustomModelForm } from "./ComposerModelMenu";
import type { ComposerModelGroup } from "./composerModels";

type ModelPopoverProps = {
  activeGroup?: ComposerModelGroup; activeGroupId: string; activeIndex: number; catalogError: string; catalogLoading: boolean;
  customMode: boolean; customModel: string; groups: ComposerModelGroup[]; query: string; searchRef: RefObject<HTMLInputElement | null>;
  onActiveGroupChange: (id: string) => void; onActiveIndexChange: (index: number) => void;
  onChoose: (provider: ChatProvider, model: string) => void; onCustomModeChange: (value: boolean) => void;
  onCustomModelChange: (value: string) => void; onManageModels: () => void; onQueryChange: (query: string) => void; onRefresh: () => void;
  onDismiss: () => void;
};

export function ComposerModelPopover(props: ModelPopoverProps) {
  const customProvider = props.activeGroup?.provider ?? "opencode";
  return <div className="composer-model-picker__overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) props.onDismiss(); }}><div className="composer-model-picker__popover" role="dialog" aria-modal="true" aria-label="Choose model">
    <div className="composer-model-picker__title"><span><strong>Choose a model</strong><small>Current chat</small></span></div>
    <label className="composer-model-picker__search"><AppIcon name="search" /><input ref={props.searchRef} aria-label="Search models" placeholder="Search providers and models" value={props.query} onChange={(event) => props.onQueryChange(event.currentTarget.value)} />{props.query ? <button type="button" aria-label="Clear model search" onClick={() => props.onQueryChange("")}><AppIcon name="close" /></button> : null}</label>
    {props.customMode ? <CustomModelForm provider={customProvider} value={props.customModel} onBack={() => props.onCustomModeChange(false)} onChange={props.onCustomModelChange} onSubmit={() => { if (props.customModel.trim()) props.onChoose(customProvider, props.customModel.trim()); }} /> : <ComposerModelMenu activeGroup={props.activeGroup} activeGroupId={props.activeGroupId} activeIndex={props.activeIndex} catalogError={props.catalogError} catalogLoading={props.catalogLoading} groups={props.groups} onActiveGroupChange={props.onActiveGroupChange} onActiveIndexChange={props.onActiveIndexChange} onChoose={props.onChoose} onRefresh={props.onRefresh} />}
    {!props.customMode ? <div className="composer-model-picker__footer"><button type="button" onClick={() => props.onCustomModeChange(true)}><AppIcon name="plus" />Use another model ID</button><button type="button" onClick={props.onManageModels}><AppIcon name="settings" />Provider settings</button></div> : null}
  </div></div>;
}
