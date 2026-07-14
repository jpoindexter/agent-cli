import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import type { AgentApprovalMode } from "./agentSessionHandle";
import type { ChatProvider } from "./chatConversation";
import {
  MAX_ORCHESTRATION_CHILDREN,
  MIN_ORCHESTRATION_CHILDREN,
  buildOrchestrationPreview,
  newOrchestrationChild,
  type OrchestrationChildDraft,
} from "./chatOrchestration";
import { AppIcon } from "./icons";

type OrchestrationDialogProps = {
  open: boolean;
  projectPath: string;
  parentTitle: string;
  provider: ChatProvider;
  approvalMode: AgentApprovalMode;
  activeRunCount: number;
  launching: boolean;
  error: string | null;
  onClose: () => void;
  onLaunch: (children: OrchestrationChildDraft[]) => void;
};

type ChildEditorProps = {
  child: OrchestrationChildDraft;
  index: number;
  removable: boolean;
  update: (id: string, patch: Partial<OrchestrationChildDraft>) => void;
  remove: (id: string) => void;
};

const OrchestrationChildEditor = ({ child, index, removable, update, remove }: ChildEditorProps) => (
  <fieldset className="orchestration-child">
    <legend>Child {index + 1}</legend>
    <label className="orchestration-field orchestration-field--title"><span>Name</span><input value={child.title} maxLength={80} onChange={(event) => update(child.id, { title: event.currentTarget.value })} /></label>
    <label className="orchestration-field orchestration-field--task"><span>Task</span><textarea value={child.task} rows={3} onChange={(event) => update(child.id, { task: event.currentTarget.value })} /></label>
    <label className="orchestration-field orchestration-field--targets"><span>Files</span><input value={child.targetFiles} placeholder="src/auth.ts, tests/auth.test.ts" onChange={(event) => update(child.id, { targetFiles: event.currentTarget.value })} /></label>
    <label className="orchestration-field"><span>Provider</span><select value={child.provider} onChange={(event) => update(child.id, { provider: event.currentTarget.value as ChatProvider })}><option value="codex">Codex</option><option value="claude">Claude</option></select></label>
    <label className="orchestration-field"><span>Model</span><input value={child.model} placeholder="Provider default" maxLength={128} onChange={(event) => update(child.id, { model: event.currentTarget.value })} /></label>
    <label className="orchestration-field"><span>Permission</span><select value={child.approvalMode} onChange={(event) => update(child.id, { approvalMode: event.currentTarget.value as AgentApprovalMode })}><option value="ask">Ask</option><option value="approveSafe">Approve safe</option><option value="fullAccess">Full access</option></select></label>
    <label className="orchestration-field"><span>Budget</span><select value={child.budgetSeconds} onChange={(event) => update(child.id, { budgetSeconds: Number(event.currentTarget.value) })}><option value={300}>5 minutes</option><option value={900}>15 minutes</option><option value={1800}>30 minutes</option><option value={3600}>60 minutes</option></select></label>
    <label className="orchestration-field"><span>Workspace</span><select value={child.worktreeMode} onChange={(event) => update(child.id, { worktreeMode: event.currentTarget.value as OrchestrationChildDraft["worktreeMode"] })}><option value="shared">Shared project</option><option value="isolated">New worktree</option></select></label>
    <button className="orchestration-child__remove" type="button" aria-label={`Remove child ${index + 1}`} disabled={!removable} onClick={() => remove(child.id)}><AppIcon name="close" /></button>
  </fieldset>
);

const OrchestrationEditor = ({ children, props, update, setChildren }: {
  children: OrchestrationChildDraft[];
  props: OrchestrationDialogProps;
  update: ChildEditorProps["update"];
  setChildren: Dispatch<SetStateAction<OrchestrationChildDraft[]>>;
}) => (
  <div className="orchestration-editor">
    {children.map((child, index) => <OrchestrationChildEditor child={child} index={index} key={child.id} removable={children.length > MIN_ORCHESTRATION_CHILDREN} update={update} remove={(id) => setChildren((current) => current.filter((item) => item.id !== id))} />)}
    <button className="orchestration-add" type="button" disabled={children.length >= MAX_ORCHESTRATION_CHILDREN} onClick={() => setChildren((current) => [...current, newOrchestrationChild(current.length, props.provider, props.approvalMode)])}><AppIcon name="plus" /><span>Add child</span></button>
  </div>
);

const OrchestrationReview = ({ preview, activeRunCount }: {
  preview: ReturnType<typeof buildOrchestrationPreview>;
  activeRunCount: number;
}) => (
  <div className="orchestration-review">
    <div className="orchestration-review__summary"><strong>{preview.children.length} child chats</strong><span>{activeRunCount + preview.children.length} of 8 concurrent slots</span><span>{Math.ceil(preview.totalBudgetSeconds / 60)} total budget minutes</span></div>
    {preview.children.map((child, index) => <div className="orchestration-review__row" key={child.id}><AppIcon name={child.worktreeMode === "isolated" ? "git" : "agent"} /><span><strong>{child.title || `Agent ${index + 1}`}</strong><small>{child.task}</small></span><span>{child.provider} · {child.approvalMode} · {Math.ceil(child.budgetSeconds / 60)}m</span></div>)}
    {preview.warnings.map((warning) => <p className="orchestration-message orchestration-message--warning" key={warning}>{warning}</p>)}
    {preview.errors.map((error) => <p className="orchestration-message orchestration-message--error" key={error}>{error}</p>)}
  </div>
);

const useOrchestrationDrafts = (props: OrchestrationDialogProps) => {
  const [children, setChildren] = useState<OrchestrationChildDraft[]>([]);
  const [reviewing, setReviewing] = useState(false);
  useEffect(() => {
    if (!props.open) return;
    setChildren([newOrchestrationChild(0, props.provider, props.approvalMode), newOrchestrationChild(1, props.provider, props.approvalMode)]);
    setReviewing(false);
  }, [props.approvalMode, props.open, props.provider]);
  useEffect(() => {
    if (!props.open || props.launching) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      props.onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props.launching, props.onClose, props.open]);
  const update = (id: string, patch: Partial<OrchestrationChildDraft>) => {
    setChildren((current) => current.map((child) => child.id === id ? { ...child, ...patch } : child));
    setReviewing(false);
  };
  return { children, reviewing, setChildren, setReviewing, update };
};

export function OrchestrationDialog(props: OrchestrationDialogProps) {
  const state = useOrchestrationDrafts(props);
  const preview = useMemo(() => buildOrchestrationPreview(state.children, props.activeRunCount), [state.children, props.activeRunCount]);
  if (!props.open) return null;
  return (
    <div className="orchestration-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !props.launching && props.onClose()}>
      <section className="orchestration-dialog" role="dialog" aria-modal="true" aria-labelledby="orchestration-title">
        <header className="orchestration-dialog__header"><div><h2 id="orchestration-title">Parallel child chats</h2><p>{props.parentTitle} · {props.projectPath}</p></div><button type="button" aria-label="Close parallel dispatch" title="Close" disabled={props.launching} onClick={props.onClose}><AppIcon name="close" /></button></header>
        {state.reviewing ? <OrchestrationReview preview={preview} activeRunCount={props.activeRunCount} /> : <OrchestrationEditor children={state.children} props={props} update={state.update} setChildren={state.setChildren} />}
        {props.error ? <p className="orchestration-message orchestration-message--error">{props.error}</p> : null}
        <footer className="orchestration-dialog__footer">
          <button type="button" disabled={props.launching} onClick={state.reviewing ? () => state.setReviewing(false) : props.onClose}>{state.reviewing ? "Back" : "Cancel"}</button>
          {state.reviewing ? <button className="orchestration-dialog__primary" type="button" disabled={props.launching || preview.errors.length > 0} onClick={() => props.onLaunch(preview.children)}>{props.launching ? "Launching…" : `Launch ${state.children.length}`}</button> : <button className="orchestration-dialog__primary" type="button" disabled={preview.errors.length > 0} onClick={() => state.setReviewing(true)}>Review dispatch</button>}
        </footer>
      </section>
    </div>
  );
}
