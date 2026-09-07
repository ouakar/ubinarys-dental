#!/bin/bash
set -eo pipefail

# ==============================================================================
# Ubinarys Dental - Production Autostart Script
# ==============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$SCRIPT_DIR/app/backend"

echo "========================================="
echo "Starting Ubinarys Dental Backend Daemon"
echo "Directory: $(pwd)"
echo "Timestamp: $(date)"
echo "========================================="

if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: node is not installed or not in PATH." >&2
    exit 1
fi

NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 24 ] || [ "$NODE_MAJOR" -ge 25 ]; then
    echo "ERROR: Node.js version $(node -v) detected. Node.js 24 LTS is required." >&2
    exit 1
fi

if [ -f "/etc/ubinarys/ubinarys.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . /etc/ubinarys/ubinarys.env
    set +a
elif [ -f ".env" ]; then
    set -a
    # shellcheck disable=SC1091
    . .env
    set +a
fi

if [ -z "${DATABASE:-}" ] || [ -z "${JWT_SECRET:-}" ]; then
    echo "ERROR: DATABASE and JWT_SECRET environment variables must be defined." >&2
    exit 1
fi

export NODE_ENV=${NODE_ENV:-production}
exec node src/server.js
