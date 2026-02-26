#!/bin/bash
#
# Master Setup Script for Agentic AI Workshop
# This script runs all required setup scripts in sequence.
#
# Usage: ./scripts/setup.sh
#

set -e

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Agentic AI Workshop - Master Setup Script           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Track overall success
overall_success=true

# Step 0: Check python3 (required for MCP config checks and iTerm2 setup)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 0/3: Check python3${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if command -v python3 &>/dev/null; then
    py_version=$(python3 --version 2>&1)
    echo -e "${GREEN}✓ python3 is installed ($py_version)${NC}"
else
    echo -e "${RED}✗ python3 is not installed${NC}"
    echo "  python3 is required for MCP config checks and iTerm2 split-pane setup."
    if command -v brew &>/dev/null; then
        echo "  Install via Homebrew:  brew install python@3.12"
    else
        echo "  macOS:  brew install python@3.12"
        echo "  Linux:  sudo apt-get install python3"
    fi
    overall_success=false
fi

echo ""

# Step 1: Install tmux (required for Agent Teams)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1/3: Install tmux (required for Agent Teams split-pane view)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if command -v tmux &>/dev/null; then
    echo -e "${GREEN}✓ tmux is already installed ($(tmux -V))${NC}"
else
    echo "tmux is not installed. Agent Teams requires tmux for the multi-pane teammate view."
    if command -v brew &>/dev/null; then
        echo "Installing tmux via Homebrew..."
        if brew install tmux; then
            echo -e "${GREEN}✓ tmux installed successfully ($(tmux -V))${NC}"
        else
            echo -e "${RED}✗ Failed to install tmux via Homebrew${NC}"
            echo "  Please install manually: brew install tmux"
            overall_success=false
        fi
    else
        echo -e "${RED}✗ Homebrew not found. Please install tmux manually.${NC}"
        echo "  macOS:  brew install tmux"
        echo "  Linux:  sudo apt-get install tmux  (or yum install tmux)"
        overall_success=false
    fi
fi

echo ""

# Step 2: iTerm2 Split-Pane Setup
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2/3: iTerm2 Split-Pane Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "$SCRIPT_DIR/setup-iterm2-split.sh" ]; then
    if bash "$SCRIPT_DIR/setup-iterm2-split.sh"; then
        echo ""
        echo -e "${GREEN}✓ iTerm2 split-pane setup completed${NC}"
    else
        echo ""
        echo -e "${YELLOW}! iTerm2 split-pane setup had issues (non-fatal)${NC}"
        # Don't fail overall - iTerm2 is optional for non-macOS users
    fi
else
    echo -e "${YELLOW}! setup-iterm2-split.sh not found - skipping${NC}"
fi

echo ""

# Step 3: MCP Servers Setup
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3/3: MCP Servers Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "$SCRIPT_DIR/setup-mcp-servers.sh" ]; then
    if bash "$SCRIPT_DIR/setup-mcp-servers.sh"; then
        echo ""
        echo -e "${GREEN}✓ MCP servers setup completed${NC}"
    else
        echo ""
        echo -e "${RED}✗ MCP servers setup failed${NC}"
        overall_success=false
    fi
else
    echo -e "${RED}✗ setup-mcp-servers.sh not found${NC}"
    overall_success=false
fi

echo ""

# Final Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Setup Complete${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$overall_success" = true ]; then
    echo -e "${GREEN}All setup steps completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Restart Claude Code (scripts/start-workshop.sh) for changes to take effect"
    echo "  2. If using iTerm2 split-pane mode, ensure Python API is enabled"
    echo "  3. Run 'jwn-claude' from the workshop directory to begin"
    echo ""
else
    echo -e "${YELLOW}Setup completed with some issues.${NC}"
    echo "Please review the output above and fix any errors before proceeding."
    echo ""
    exit 1
fi
