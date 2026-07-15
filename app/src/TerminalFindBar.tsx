import type { KeyboardEvent } from "react";

import { AppIcon } from "./icons";
import { terminalFindCountLabel, terminalFindHitLabel } from "./terminalFind";
import type { TerminalFindController } from "./useTerminalFind";

const handleSearchKeyDown = (
  event: KeyboardEvent<HTMLInputElement>,
  controller: TerminalFindController,
) => {
  if (event.key === "Enter" && event.shiftKey) {
    event.preventDefault();
    controller.step(-1);
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    if (controller.query.trim() === controller.lastQuery && controller.hits.length > 0) controller.step(1);
    else void controller.run();
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    controller.close();
  }
};

export const TerminalFindBar = ({ controller }: { controller: TerminalFindController }) => {
  if (!controller.open) return null;
  const activeHit = controller.index == null ? null : controller.hits[controller.index] ?? null;
  return (
    <div className="terminal-find" role="search" aria-label="Find in terminal scrollback">
      <AppIcon name="search" />
      <input
        value={controller.query}
        placeholder="Find in scrollback"
        aria-label="Terminal search query"
        disabled={controller.busy}
        onChange={(event) => controller.setQuery(event.currentTarget.value)}
        onKeyDown={(event) => handleSearchKeyDown(event, controller)}
      />
      <span className="terminal-find__count">
        {controller.error ?? terminalFindCountLabel(controller.index, controller.hits.length)}
      </span>
      <button className="terminal-new-pane" type="button" aria-label="Previous match" title="Previous match" disabled={controller.hits.length === 0} onClick={() => controller.step(-1)}>
        <AppIcon name="chevronUp" />
      </button>
      <button className="terminal-new-pane" type="button" aria-label="Next match" title="Next match" disabled={controller.hits.length === 0} onClick={() => controller.step(1)}>
        <AppIcon name="chevronDown" />
      </button>
      {activeHit ? <span className="terminal-find__preview" title={activeHit.text}>{terminalFindHitLabel(activeHit)}</span> : null}
      <button className="terminal-new-pane" type="button" aria-label="Close terminal find" title="Close" onClick={controller.close}>
        <AppIcon name="close" />
      </button>
    </div>
  );
};
