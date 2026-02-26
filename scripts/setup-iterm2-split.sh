#!/bin/bash
# Setup script for iTerm2 split-pane support with Agent Teams
# This enables Claude Code to show teammates in separate panes

set -e

echo "======================================"
echo "iTerm2 Split-Pane Setup for Agent Teams"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This script is for macOS only.${NC}"
    echo "Agent Teams split-pane mode requires iTerm2 on macOS."
    exit 1
fi

# Check if iTerm2 is installed
if [ ! -d "/Applications/iTerm.app" ]; then
    echo -e "${RED}Error: iTerm2 is not installed.${NC}"
    echo ""
    echo "Please install iTerm2 first:"
    echo "  brew install --cask iterm2"
    echo ""
    echo "Or download from: https://iterm2.com/"
    exit 1
fi

echo -e "${GREEN}✓ iTerm2 is installed${NC}"

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]); then
    echo -e "${RED}Error: Python 3.10+ is required (found $PYTHON_VERSION)${NC}"
    echo ""
    echo "Please upgrade Python:"
    echo "  brew install python@3.12"
    exit 1
fi

echo -e "${GREEN}✓ Python $PYTHON_VERSION is installed${NC}"

# Create venv and install it2
IT2_VENV="$HOME/.it2-venv"

if [ -d "$IT2_VENV" ]; then
    echo -e "${YELLOW}! Virtual environment already exists at $IT2_VENV${NC}"
    echo "  Checking if it2 is installed..."

    if [ -f "$IT2_VENV/bin/it2" ]; then
        echo -e "${GREEN}✓ it2 is already installed${NC}"
    else
        echo "  Installing it2..."
        "$IT2_VENV/bin/pip" install it2
        echo -e "${GREEN}✓ it2 installed${NC}"
    fi
else
    echo "Creating virtual environment at $IT2_VENV..."
    python3 -m venv "$IT2_VENV"

    echo "Installing it2 CLI..."
    "$IT2_VENV/bin/pip" install --quiet it2
    echo -e "${GREEN}✓ it2 installed${NC}"
fi

# Add it2 to PATH via symlink or shell config
IT2_BIN="$IT2_VENV/bin/it2"

# Check if /usr/local/bin exists and is writable, otherwise use ~/.local/bin
if [ -d "/usr/local/bin" ] && [ -w "/usr/local/bin" ]; then
    SYMLINK_DIR="/usr/local/bin"
else
    SYMLINK_DIR="$HOME/.local/bin"
    mkdir -p "$SYMLINK_DIR"
fi

SYMLINK_PATH="$SYMLINK_DIR/it2"

if [ -L "$SYMLINK_PATH" ] || [ -f "$SYMLINK_PATH" ]; then
    echo -e "${YELLOW}! Symlink already exists at $SYMLINK_PATH${NC}"
else
    ln -s "$IT2_BIN" "$SYMLINK_PATH" 2>/dev/null || {
        echo -e "${YELLOW}! Could not create symlink at $SYMLINK_PATH${NC}"
        echo "  Add this to your shell profile manually:"
        echo "  export PATH=\"$IT2_VENV/bin:\$PATH\""
    }

    if [ -L "$SYMLINK_PATH" ]; then
        echo -e "${GREEN}✓ Symlink created at $SYMLINK_PATH${NC}"
    fi
fi

# Verify it2 is accessible
if command -v it2 &> /dev/null; then
    echo -e "${GREEN}✓ it2 is accessible in PATH${NC}"
else
    echo -e "${YELLOW}! it2 is not in PATH yet${NC}"
    echo ""
    echo "Add this line to your ~/.zshrc or ~/.bashrc:"
    echo ""
    echo "  export PATH=\"$IT2_VENV/bin:\$PATH\""
    echo ""
    echo "Then run: source ~/.zshrc"
fi

# Check/remind about iTerm2 Python API
echo ""
echo "======================================"
echo "IMPORTANT: Enable iTerm2 Python API"
echo "======================================"
echo ""
echo -e "${YELLOW}You must enable the Python API in iTerm2. Follow these steps:${NC}"
echo ""
echo "  1. Open iTerm2 (if not already open)"
echo ""
echo "  2. Open Settings:"
echo "     • Press: ⌘ + , (Command + comma)"
echo "     • Or: Menu bar → iTerm2 → Settings..."
echo ""
echo "  3. Navigate to the Magic section:"
echo "     • Click the 'General' tab at the top"
echo "     • Click 'Magic' in the left sidebar"
echo ""
echo "  4. Enable the Python API:"
echo "     • Find the checkbox labeled 'Enable Python API'"
echo "     • Check the box to enable it"
echo ""
echo "  5. Close the Settings window"
echo ""
echo -e "${RED}Without enabling the Python API, split-pane mode will NOT work.${NC}"
echo ""

# Summary
echo "======================================"
echo "Setup Complete"
echo "======================================"
echo ""
echo "To use split-pane mode with Agent Teams, run jwn-claude with:"
echo ""
echo "  jwn-claude --teammate-mode tmux"
echo ""
echo "Or add this alias to your ~/.zshrc:"
echo ""
echo "  alias jwn-claude-workshop='jwn-claude --teammate-mode tmux'"
echo ""
echo "The tmux setting auto-detects iTerm2 when available."
echo ""
