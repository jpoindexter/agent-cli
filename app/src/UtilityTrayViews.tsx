import type { AgentActivityEvent } from "./agentActivity";
import { AppIcon, paneStateIconName } from "./icons";
import type { LaunchProfile } from "./launchProfiles";
import type { TerminalPaneState } from "./terminalPane";
import { terminalPaneLabelForDisplay, terminalPaneStateLabel } from "./terminalPane";

export type UtilityTrayPane = {
  id: number;
  profile: LaunchProfile;
  label: string | null;
  state: TerminalPaneState;
  exitCode: number | null;
};

export const UtilityTrayProcesses = ({ panes, onFocus }: { panes: UtilityTrayPane[]; onFocus: (paneId: number) => void }) => (
  <div className="utility-tray__processes" aria-label="Processes">
    {panes.length === 0 ? <div className="utility-tray__empty">No processes in this chat.</div> : panes.map((pane, index) => (
      <button type="button" key={pane.id} onClick={() => onFocus(pane.id)}>
        <AppIcon name={paneStateIconName(pane.state)} />
        <span>{terminalPaneLabelForDisplay(pane.label, pane.profile.label, index)}</span>
        <small>{pane.profile.label}</small>
        <span>{terminalPaneStateLabel(pane.state, pane.exitCode)}</span>
      </button>
    ))}
  </div>
);

export const UtilityTrayLogs = ({ events }: { events: AgentActivityEvent[] }) => (
  <div className="utility-tray__logs" aria-label="Agent logs">
    {events.length === 0 ? <div className="utility-tray__empty">No activity logged for this chat.</div> : events.map((event) => (
      <div className="utility-tray__log-row" key={event.id}>
        <span>{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <strong>{event.label}</strong>
        <span>{event.detail ?? event.target ?? event.kind}</span>
        <small>{event.status}</small>
      </div>
    ))}
  </div>
);
