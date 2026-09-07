#!/bin/bash
set -euo pipefail

# ==============================================================================
# Ubinarys Dental - Production Deployment Script
# ==============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$PROJECT_DIR"

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}      Ubinarys Dental - Production Deploy        ${NC}"
echo -e "${BLUE}=================================================${NC}"

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}Error: node is not installed.${NC}"
    exit 1
fi

NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 24 ] || [ "$NODE_MAJOR" -ge 25 ]; then
    echo -e "${RED}Error: Node.js version $(node -v) is invalid. Node.js 24 LTS required.${NC}"
    exit 1
fi

echo -e "${GREEN}✔ Node.js version check passed ($(node -v)).${NC}"

echo -e "\n${YELLOW}[1/4] Installing backend dependencies via npm ci...${NC}"
cd "$PROJECT_DIR/app/backend"
npm ci --omit=dev

echo -e "\n${YELLOW}[2/4] Installing frontend dependencies via npm ci...${NC}"
cd "$PROJECT_DIR/app/frontend"
npm ci

echo -e "\n${YELLOW}[3/4] Building frontend production bundle...${NC}"
npm run build

cd "$PROJECT_DIR"

echo -e "\n${YELLOW}[4/4] Restarting systemd service...${NC}"
if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet ubinarys.service; then
    sudo systemctl restart ubinarys.service
    echo -e "${GREEN}✔ ubinarys.service restarted successfully.${NC}"
else
    echo -e "${BLUE}! Systemd service not active or systemctl unavailable. Build complete.${NC}"
fi

echo -e "\n${GREEN}=================================================${NC}"
echo -e "${GREEN}      Deployment Complete!                      ${NC}"
echo -e "${GREEN}=================================================${NC}"
