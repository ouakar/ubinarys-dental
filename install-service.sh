#!/bin/bash

# ==============================================================================
# Ubinarys Dental - Systemd Service Installer (Ubuntu)
# ==============================================================================
# This script creates, enables, and starts a systemd service to run the
# Ubinarys Dental application automatically at boot time (before user login).
# ==============================================================================

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure the script is run on Linux/Ubuntu
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}Error: This installation script is designed for Linux/Ubuntu only.${NC}"
    exit 1
fi

# Check for root privilege to write systemd files
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Please run this installation script with sudo:${NC}"
    echo -e "${BLUE}sudo ./install-service.sh${NC}"
    exit 1
fi

# Determine the project directory and the user who called sudo
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
SUDO_USER_NAME="${SUDO_USER:-$USER}"

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}    Installing Ubinarys Dental Systemd Service   ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo -e "Project Directory: ${GREEN}$PROJECT_DIR${NC}"
echo -e "Running as User:   ${GREEN}$SUDO_USER_NAME${NC}"

# Ensure autostart.sh is executable
chmod +x "$PROJECT_DIR/autostart.sh"
echo -e "${GREEN}✔ Set executable permissions on autostart.sh${NC}"

# Define service file path
SERVICE_FILE="/etc/systemd/system/ubinarys.service"

# Generate the systemd service file
cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Ubinarys Dental SaaS Application
After=network.target mongodb.service

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/autostart.sh
Restart=always
RestartSec=10
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=NODE_ENV=development

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✔ Created systemd service file at: $SERVICE_FILE${NC}"

# Reload systemd to load the new service
systemctl daemon-reload
echo -e "${GREEN}✔ Reloaded systemd manager configuration${NC}"

# Enable the service to start on boot
systemctl enable ubinarys.service
echo -e "${GREEN}✔ Enabled ubinarys.service to run automatically at boot${NC}"

# Start the service now
echo -e "${YELLOW}Starting the service now...${NC}"
systemctl start ubinarys.service

# Check status
if systemctl is-active --quiet ubinarys.service; then
    echo -e "${GREEN}✔ Ubinarys Dental Service is active and running!${NC}"
else
    echo -e "${RED}✘ Service started, but is not active. Check logs using: journalctl -u ubinarys.service${NC}"
fi

echo -e "\n${BLUE}=================================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "The application will now start automatically whenever the Ubuntu system boots."
echo -e "No user login is required."
echo -e "\nUseful Commands:"
echo -e "  - View service status:   ${BLUE}systemctl status ubinarys.service${NC}"
echo -e "  - View real-time logs:   ${BLUE}journalctl -u ubinarys.service -f${NC}"
echo -e "  - Stop the service:      ${BLUE}systemctl stop ubinarys.service${NC}"
echo -e "  - Restart the service:   ${BLUE}systemctl restart ubinarys.service${NC}"
echo -e "${BLUE}=================================================${NC}"
