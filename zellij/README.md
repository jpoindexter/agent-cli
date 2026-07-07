# zellij cockpit — R1 trial

## Setup (already done, for reference)

```bash
brew install zellij yazi helix   # done 2026-07-07
./install.sh                      # done 2026-07-07 — symlinks agent.kdl into ~/.config/zellij/layouts/
```

## Start

```bash
zellij --layout agent --session agent
```

## Re-attach

Detaching (`Ctrl o` then `d`, or closing the terminal window) does **not** kill your agents — they keep running. Come back with:

```bash
zellij attach agent
```

## Keybindings — verified against the installed zellij 0.44.3's own default config (`zellij setup --dump-config`), not memory

| Action | Key |
|---|---|
| Switch project tab | `Ctrl t` then `1`–`9` |
| New tab / close tab | `Ctrl t` then `n` / `x` |
| New pane (no mode needed) | `Alt n` |
| Close focused pane | `Ctrl p` then `x` |
| Move focus between panes | `Alt` + `h j k l` or arrows |
| Fullscreen the focused pane | `Ctrl p` then `f` |
| Detach (agents keep running) | `Ctrl o` then `d` |
| **Quit zellij entirely — kills every agent** | `Ctrl q` |

**Correction from earlier in this project's chat history:** I originally told Jason `Ctrl+q` closes a pane — that's wrong, verified against the real config. `Ctrl+q` quits the whole session and kills every running agent. Closing one pane is `Ctrl p` then `x`.

## Adding a project

Copy a `tab { ... }` block in `agent.kdl`, change `name` and `cwd`. No reinstall needed — `install.sh` symlinked the file, so edits apply on next launch.
