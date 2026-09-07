#!/bin/bash
set -Eeuo pipefail

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

# 2. Validate Node.js 24
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

# 3. Run npm ci at root, in backend, and in frontend
echo -e "\n${YELLOW}[1/7] Installing root dependencies via npm ci...${NC}"
npm ci

echo -e "\n${YELLOW}[2/7] Installing backend dependencies via npm ci...${NC}"
(cd "$PROJECT_DIR/app/backend" && npm ci)

echo -e "\n${YELLOW}[3/7] Installing frontend dependencies via npm ci...${NC}"
(cd "$PROJECT_DIR/app/frontend" && npm ci)

# Run test suites and linting
echo -e "\n${YELLOW}[4/7] Running backend automated tests...${NC}"
(cd "$PROJECT_DIR/app/backend" && npm test)

echo -e "\n${YELLOW}[5/7] Running frontend tests and lint...${NC}"
(cd "$PROJECT_DIR/app/frontend" && npm test && npm run lint)

# 13. Preserve the previous frontend dist directory until the new build succeeds
echo -e "\n${YELLOW}[6/7] Building frontend production bundle...${NC}"
if [ -d "$PROJECT_DIR/app/frontend/dist" ]; then
    rm -rf "$PROJECT_DIR/app/frontend/dist.bak"
    cp -r "$PROJECT_DIR/app/frontend/dist" "$PROJECT_DIR/app/frontend/dist.bak"
fi

# Build frontend; if it fails, restore backup and abort
if ! (cd "$PROJECT_DIR/app/frontend" && npm run build); then
    echo -e "${RED}✘ Frontend production build failed.${NC}"
    if [ -d "$PROJECT_DIR/app/frontend/dist.bak" ]; then
        echo -e "${YELLOW}Restoring previous frontend dist...${NC}"
        rm -rf "$PROJECT_DIR/app/frontend/dist"
        mv "$PROJECT_DIR/app/frontend/dist.bak" "$PROJECT_DIR/app/frontend/dist"
    fi
    exit 1
fi

# 5. Restart ubinarys.service
echo -e "\n${YELLOW}[7/7] Restarting ubinarys.service and verifying health...${NC}"
SERVICE_NAME="ubinarys.service"

if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${YELLOW}Restarting $SERVICE_NAME...${NC}"
    sudo systemctl restart "$SERVICE_NAME"
    
    # 6 & 7. Poll http://127.0.0.1:8888/health/ready up to 60 seconds
    echo -e "${YELLOW}Polling http://127.0.0.1:8888/health/ready (timeout: 60s)...${NC}"
    READY=0
    for i in $(seq 1 60); do
        if curl -s -f http://127.0.0.1:8888/health/ready >/dev/null 2>&1; then
            READY=1
            break
        fi
        sleep 1
    done

    # 8 & 9. Return non-zero if readiness never succeeds; print last 100 log lines
    if [ "$READY" -ne 1 ]; then
        echo -e "${RED}✘ Error: Health readiness check failed after 60 seconds.${NC}"
        # 14. Restore previous dist directory
        if [ -d "$PROJECT_DIR/app/frontend/dist.bak" ]; then
            echo -e "${YELLOW}Restoring previous frontend dist...${NC}"
            rm -rf "$PROJECT_DIR/app/frontend/dist"
            mv "$PROJECT_DIR/app/frontend/dist.bak" "$PROJECT_DIR/app/frontend/dist"
        fi
        if command -v journalctl >/dev/null 2>&1; then
            echo -e "\n${RED}Last 100 log lines from $SERVICE_NAME:${NC}"
            sudo journalctl -u "$SERVICE_NAME" -n 100 --no-pager || true
        fi
        exit 1
    fi
    echo -e "${GREEN}✔ $SERVICE_NAME is healthy and ready!${NC}"
else
    echo -e "${BLUE}! Systemd service not active or systemctl unavailable in this environment.${NC}"
    echo -e "${BLUE}! All tests, linting, and production builds completed successfully.${NC}"
fi

# Clean up dist backup after successful deployment
rm -rf "$PROJECT_DIR/app/frontend/dist.bak"

echo -e "\n${GREEN}=================================================${NC}"
echo -e "${GREEN}      Deployment Completed Successfully!         ${NC}"
echo -e "${GREEN}=================================================${NC}"
