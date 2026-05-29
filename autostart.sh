#!/bin/bash

# ==============================================================================
# Ubinarys Dental - Autostart Daemon Script
# ==============================================================================
# This script starts both the backend and frontend dev servers.
# It is designed to be run manually or automatically at system boot via systemd.
#
# If run by systemd:
#   - It remains in the foreground (running concurrently).
#   - systemd handles logging, process control, and automatic restarts.
# ==============================================================================

# Resolve the absolute path of the directory containing this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$SCRIPT_DIR"

echo "========================================="
echo "Starting Ubinarys Dental Autostart Script"
echo "Directory: $SCRIPT_DIR"
echo "Timestamp: $(date)"
echo "========================================="

# Verify that node and npm are available
if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: node is not installed or not in PATH." >&2
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: npm is not installed or not in PATH." >&2
    exit 1
fi

# Install dependencies if they are missing
if [ ! -d "node_modules" ] || [ ! -d "app/backend/node_modules" ] || [ ! -d "app/frontend/node_modules" ]; then
    echo "Dependencies are missing. Installing all packages..."
    npm run install:all
fi

# Run the backend and frontend concurrently
echo "Launching frontend and backend services..."
npm start
