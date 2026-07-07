#!/usr/bin/env bash
# Symlinks agent.kdl into zellij's layout dir so `zellij --layout agent`
# works by name from anywhere. Re-run after editing agent.kdl if you
# ever copy instead of symlink elsewhere — this uses a symlink, so
# normally you don't need to.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAYOUT_DIR="${ZELLIJ_CONFIG_DIR:-$HOME/.config/zellij}/layouts"

mkdir -p "$LAYOUT_DIR"
ln -sf "$SCRIPT_DIR/agent.kdl" "$LAYOUT_DIR/agent.kdl"

echo "Linked $SCRIPT_DIR/agent.kdl -> $LAYOUT_DIR/agent.kdl"
echo ""
echo "Start the cockpit:"
echo "  zellij --layout agent --session agent"
echo ""
echo "Re-attach later (agents keep running while detached):"
echo "  zellij attach agent"
