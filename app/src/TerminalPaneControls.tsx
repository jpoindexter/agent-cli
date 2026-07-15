import type { MouseEvent } from "react";

import { AppIcon, paneStateIconName } from "./icons";
import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { terminalPaneLabelForDisplay, terminalPaneStateLabel } from "./terminalPane";

export type TerminalPaneControlsProps = {
  activePane: ManagedTerminalPane | null;
  activePaneId: number | null;
  canClose: boolean;
  hasWorkspace: boolean;
  launchProfile: LaunchProfile;
  launchProfileChanging: boolean;
  launchProfiles: LaunchProfile[];
  panes: ManagedTerminalPane[];
  onClose: () => void;
  onContextMenu: (event: MouseEvent<HTMLButtonElement>, pane: ManagedTerminalPane) => void;
  onCreate: (profile: LaunchProfile) => void;
  onFind: () => void;
  onFocus: (paneId: number) => void;
  onKill: () => void;
  onProfileChange: (profileId: string) => void;
  onRename: (pane: ManagedTerminalPane) => void;
  onRestart: () => void;
};

const TerminalPaneStrip = (props: Pick<TerminalPaneControlsProps, "activePaneId" | "panes" | "onContextMenu" | "onFocus" | "onRename">) => (
  <div className="terminal-pane-strip" aria-label="Terminal panes">
    {props.panes.map((pane, index) => {
      const label = terminalPaneLabelForDisplay(pane.label, pane.profile.label, index);
      return (
        <button key={pane.id} className={`terminal-pane-button ${pane.id === props.activePaneId ? "terminal-pane-button--active" : ""}`} type="button" title={`${label} - ${terminalPaneStateLabel(pane.state, pane.exitCode)}. Double-click to rename.`} aria-label={`Focus ${label}. Double-click to rename.`} aria-pressed={pane.id === props.activePaneId} onClick={() => props.onFocus(pane.id)} onDoubleClick={() => props.onRename(pane)} onContextMenu={(event) => props.onContextMenu(event, pane)}>
          <AppIcon name={paneStateIconName(pane.state)} /><span>{label}</span>
        </button>
      );
    })}
  </div>
);

export const TerminalPaneControls = (props: TerminalPaneControlsProps) => (
  <div className="utility-tray__terminal-controls">
    <TerminalPaneStrip {...props} />
    <span className="utility-tray__spacer" />
    <label className="terminal-profile-picker" title="New terminal profile">
      <select aria-label="New pane profile" value={props.launchProfile.id} disabled={props.launchProfileChanging} onChange={(event) => props.onProfileChange(event.currentTarget.value)}>
        {props.launchProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
      </select>
    </label>
    <button className="terminal-new-pane" type="button" title={`New ${props.launchProfile.label} pane`} aria-label={`New ${props.launchProfile.label} pane`} disabled={!props.hasWorkspace || props.launchProfileChanging} onClick={() => props.onCreate(props.launchProfile)}><AppIcon name="plus" /></button>
    <button className="terminal-new-pane" type="button" title="Find in terminal scrollback" aria-label="Find in terminal scrollback" disabled={!props.activePane} onClick={props.onFind}><AppIcon name="search" /></button>
    <button className="terminal-new-pane" type="button" title="Restart selected process" aria-label="Restart selected process" disabled={!props.activePane || props.launchProfileChanging} onClick={props.onRestart}><AppIcon name="reload" /></button>
    <button className="terminal-new-pane terminal-new-pane--danger" type="button" title="Kill selected process" aria-label="Kill selected process" disabled={!props.activePane || props.activePane.state === "exited"} onClick={props.onKill}><AppIcon name="stop" /></button>
    <button className="terminal-new-pane terminal-new-pane--danger" type="button" title="Close selected pane" aria-label="Close selected pane" disabled={!props.canClose} onClick={props.onClose}><AppIcon name="close" /></button>
  </div>
);
