import type { KeyboardEventHandler, RefObject } from "react";

import { AppIcon, type AppIconName } from "./icons";
import type { CommandPaletteCommand } from "./commandPalette";
import "./SearchCommandDialog.css";

export type SearchDialogCommand = CommandPaletteCommand & {
  icon: AppIconName;
  run: () => void;
};

type IndexedCommand = { command: SearchDialogCommand; index: number };

type SearchCommandGroupProps = {
  label: string;
  commands: IndexedCommand[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onRun: (command: SearchDialogCommand) => void;
};

const SearchCommandGroup = ({ label, commands, activeIndex, onActiveIndexChange, onRun }: SearchCommandGroupProps) => {
  if (commands.length === 0) return null;
  return (
    <div className="search-command-dialog__group" role="presentation">
      <div className="search-command-dialog__group-label">{label}</div>
      {commands.map(({ command, index }) => (
        <button
          className={`command-palette__row ${index === activeIndex ? "command-palette__row--active" : ""}`}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          disabled={command.disabled}
          key={command.id}
          onPointerMove={() => onActiveIndexChange(index)}
          onClick={() => onRun(command)}
        >
          <span className="command-palette__icon"><AppIcon name={command.icon} /></span>
          <span className="command-palette__copy"><strong>{command.label}</strong><span>{command.detail}</span></span>
          {command.shortcut ? <span className="command-palette__shortcut">{command.shortcut}</span> : null}
        </button>
      ))}
    </div>
  );
};

type SearchCommandDialogProps = {
  commands: SearchDialogCommand[];
  activeIndex: number;
  query: string;
  shortcut: string;
  loading: boolean;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  onActiveIndexChange: (index: number) => void;
  onRun: (command: SearchDialogCommand) => void;
};

export function SearchCommandDialog(props: SearchCommandDialogProps) {
  const indexed = props.commands.map((command, index) => ({ command, index }));
  const tasks = indexed.filter(({ command }) => command.source === "chats");
  const actions = indexed.filter(({ command }) => command.source !== "chats");
  const empty = props.loading ? "Searching chats…" : props.error ? "Chat search is unavailable" : "No tasks or commands match";
  return (
    <div className="command-palette-backdrop search-command-dialog-backdrop" role="presentation" onPointerDown={props.onClose}>
      <section className="command-palette search-command-dialog" aria-label="Search tasks or run a command" role="dialog" aria-modal="true" onPointerDown={(event) => event.stopPropagation()}>
        <div className="command-palette__field">
          <AppIcon name="search" />
          <input ref={props.inputRef} value={props.query} aria-label="Search tasks or run a command" placeholder="Search tasks or run a command" onChange={(event) => props.onQueryChange(event.currentTarget.value)} onKeyDown={props.onKeyDown} />
          <span>{props.shortcut}</span>
        </div>
        <div className="command-palette__list" role="listbox" aria-label="Tasks and commands">
          {props.commands.length > 0 ? (
            <>
              <SearchCommandGroup label="Tasks" commands={tasks} activeIndex={props.activeIndex} onActiveIndexChange={props.onActiveIndexChange} onRun={props.onRun} />
              <SearchCommandGroup label="Actions" commands={actions} activeIndex={props.activeIndex} onActiveIndexChange={props.onActiveIndexChange} onRun={props.onRun} />
            </>
          ) : <div className="command-palette__empty">{empty}</div>}
        </div>
      </section>
    </div>
  );
}
