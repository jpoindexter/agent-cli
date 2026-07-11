import {
  AGENT_ACTIVITY_LOG_FILTERS,
  agentActivityFilterLabel,
  agentActivityMetaLabel,
  agentActivityTimeLabel,
} from "./agentActivity";
import type { AgentActivityEvent, AgentActivityLogFilter } from "./agentActivity";
import { agentActivityAccessibleLabel, agentActivityIconName, AppIcon } from "./icons";
import { AgentRunOutput } from "./AgentRunOutput";

type AgentRunSurfaceProps = {
  activityFilter: AgentActivityLogFilter;
  events: AgentActivityEvent[];
  hasPane: boolean;
  hasSession: boolean;
  hidden?: boolean;
  metaLabel?: string;
  transcript: string;
  onActivityFilterChange: (filter: AgentActivityLogFilter) => void;
  onShowTerminal: () => void;
};

export function AgentRunSurface({
  activityFilter,
  events,
  hasPane,
  hasSession,
  hidden = false,
  metaLabel,
  transcript,
  onActivityFilterChange,
  onShowTerminal,
}: AgentRunSurfaceProps) {
  return (
    <div className="agent-chat-surface" aria-hidden={hidden}>
      <AgentRunOutput hasPane={hasPane} metaLabel={metaLabel} transcript={transcript} />
      <section className={`agent-activity-log ${events.length === 0 ? "agent-activity-log--empty" : ""}`} aria-label="Agent activity timeline">
        <div className="agent-activity-log__toolbar" role="toolbar" aria-label="Filter agent activity timeline">
          <span className="agent-activity-log__title">Activity</span>
          <span className="agent-activity-log__count">{events.length}</span>
          <label className="agent-activity-log__filter-select">
            <span>Filter</span>
            <select value={activityFilter} onChange={(event) => onActivityFilterChange(event.currentTarget.value as AgentActivityLogFilter)}>
              {AGENT_ACTIVITY_LOG_FILTERS.map((filter) => (
                <option value={filter} key={filter}>{agentActivityFilterLabel(filter)}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="agent-activity-log__list">
          {events.length > 0 ? events.map((event) => (
            <article className={`agent-thread-event agent-thread-event--${event.status}`} key={event.id}>
              <div className="agent-thread-event__icon">
                <AppIcon name={agentActivityIconName(event.status)} label={agentActivityAccessibleLabel(event.status, event.label)} />
              </div>
              <div className="agent-thread-event__body">
                <div className="agent-thread-event__header">
                  <strong>{event.label}</strong>
                  <span>{agentActivityTimeLabel(event.timestamp)}</span>
                  <span>{agentActivityFilterLabel(event.kind)}</span>
                </div>
                {event.detail ? <div className="agent-thread-event__detail">{event.detail}</div> : null}
                {agentActivityMetaLabel(event) ? <div className="agent-thread-event__meta">{agentActivityMetaLabel(event)}</div> : null}
              </div>
            </article>
          )) : (
            <div className="agent-activity-log__empty">{hasSession ? "No matching activity yet" : "No pane selected"}</div>
          )}
        </div>
      </section>
      <div className="agent-chat-terminal-hint">
        <button className="agent-chat-terminal-hint__button" type="button" onClick={onShowTerminal}>
          <AppIcon name="terminal" />
          <span>Raw terminal</span>
        </button>
      </div>
    </div>
  );
}
