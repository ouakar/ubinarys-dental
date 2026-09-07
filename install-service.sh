#!/bin/bash

# ==============================================================================
# Ubinarys Dental - Systemd Service Installer (Ubuntu/Linux)
# ==============================================================================
# Installs a production-hardened systemd service running under user 'ubinarys'.
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}Error: This installation script is designed for Linux/Ubuntu only.${NC}"
    exit 1
fi

if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Please run this installation script with sudo:${NC}"
    echo -e "${BLUE}sudo ./install-service.sh${NC}"
    exit 1
fi

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}    Installing Ubinarys Dental Systemd Service   ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo -e "Project Directory: ${GREEN}$PROJECT_DIR${NC}"

# Ensure dedicated system user 'ubinarys' exists
if ! id -u ubinarys >/dev/null 2>&1; then
    echo -e "${YELLOW}Creating dedicated system user 'ubinarys'...${NC}"
    useradd --system --no-create-home --shell /bin/false ubinarys
else
    echo -e "${GREEN}✔ Dedicated user 'ubinarys' exists.${NC}"
fi

# Ensure output directories exist and set appropriate permissions
mkdir -p "$PROJECT_DIR/app/backend/public/download" "$PROJECT_DIR/app/backend/public/uploads"
chown -R ubinarys:ubinarys "$PROJECT_DIR/app/backend/public/download" "$PROJECT_DIR/app/backend/public/uploads"
chmod +x "$PROJECT_DIR/autostart.sh"

SERVICE_FILE="/etc/systemd/system/ubinarys.service"

cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Ubinarys Dental SaaS Application
After=network.target mongodb.service

[Service]
Type=simple
User=ubinarys
Group=ubinarys
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/autostart.sh
Restart=on-failure
RestartSec=10
TimeoutStopSec=15
KillSignal=SIGTERM
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=NODE_ENV=production

# Hardening Options
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=$PROJECT_DIR/app/backend/public/download $PROJECT_DIR/app/backend/public/uploads

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✔ Created systemd service file at: $SERVICE_FILE${NC}"

systemctl daemon-reload
echo -e "${GREEN}✔ Reloaded systemd manager configuration${NC}"

systemctl enable ubinarys.service
echo -e "${GREEN}✔ Enabled ubinarys.service to run on boot${NC}"

echo -e "${YELLOW}Starting ubinarys.service...${NC}"
systemctl restart ubinarys.service

if systemctl is-active --quiet ubinarys.service; then
    echo -e "${GREEN}✔ Ubinarys Dental Service is active and running!${NC}"
else
    echo -e "${RED}✘ Service started, but is not active. Check logs using: journalctl -u ubinarys.service -n 50 --no-pager${NC}"
fi

echo -e "\n${BLUE}=================================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "Useful Commands:"
echo -e "  - View service status:   ${BLUE}systemctl status ubinarys.service${NC}"
echo -e "  - View real-time logs:   ${BLUE}journalctl -u ubinarys.service -f${NC}"
echo -e "  - View recent logs:      ${BLUE}journalctl -u ubinarys.service -n 100 --no-pager${NC}"
echo -e "  - Restart service:       ${BLUE}systemctl restart ubinarys.service${NC}"
echo -e "${BLUE}=================================================${NC}"
