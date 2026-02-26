#!/bin/bash
#
# Start the Agentic AI Workshop with Agent Teams in tmux mode
#
# Usage: ./scripts/start-workshop.sh
#

set -e

# Get the repo root (parent of scripts/)
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check tmux is installed
if ! command -v tmux &>/dev/null; then
    echo "Error: tmux is not installed."
    echo "  Run ./scripts/setup.sh first, or install manually: brew install tmux"
    exit 1
fi

# Check jwn-claude is available
if ! command -v jwn-claude &>/dev/null; then
    echo "Error: jwn-claude not found in PATH."
    exit 1
fi

cd "$REPO_DIR"
exec jwn-claude --teammate-mode tmux
