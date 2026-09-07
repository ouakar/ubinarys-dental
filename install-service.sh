#!/bin/bash

# ==============================================================================
# Ubinarys Dental - Systemd Service Installer (Ubuntu/Linux)
# ==============================================================================
# Installs a production-hardened systemd service running under user 'ubinarys'.
# Service unit: /etc/systemd/system/ubinarys.service
# Environment:  /etc/ubinarys/ubinarys.env
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

# Refuse paths under /home while ProtectHome=true is enabled
if [[ "$PROJECT_DIR" =~ ^/home(/|$) ]]; then
    echo -e "${RED}Error: Project directory ($PROJECT_DIR) is located under /home.${NC}"
    echo -e "${RED}Systemd service hardening has ProtectHome=true, which restricts access to /home.${NC}"
    echo -e "${YELLOW}Please install production code under /opt/ubinarys-dental or another non-home location.${NC}"
    exit 1
fi

# Ensure dedicated system user 'ubinarys' exists
if ! id -u ubinarys >/dev/null 2>&1; then
    echo -e "${YELLOW}Creating dedicated system user 'ubinarys'...${NC}"
    useradd --system --no-create-home --shell /bin/false ubinarys
else
    echo -e "${GREEN}✔ Dedicated user 'ubinarys' exists.${NC}"
fi

# 1. Create /etc/ubinarys securely
mkdir -p /etc/ubinarys
chmod 750 /etc/ubinarys
chown root:ubinarys /etc/ubinarys

ENV_FILE="/etc/ubinarys/ubinarys.env"
ENV_TEMPLATE="$PROJECT_DIR/app/backend/.env.example"

# 2 & 3. Never overwrite an existing environment file. If missing, install placeholder template and stop.
NEW_ENV_INSTALLED=0
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Environment file $ENV_FILE missing. Installing template from $ENV_TEMPLATE...${NC}"
    if [ -f "$ENV_TEMPLATE" ]; then
        cp "$ENV_TEMPLATE" "$ENV_FILE"
    else
        cat <<'EOF' > "$ENV_FILE"
DATABASE="mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/ubinarys?retryWrites=true&w=majority"
JWT_SECRET="CHANGE_ME_MINIMUM_32_RANDOM_CHARACTERS"
NODE_ENV="production"
PORT="8888"
FRONTEND_URL="https://dental-staging.example.com"
ALLOWED_ORIGINS="https://dental-staging.example.com"
PUBLIC_SERVER_FILE="https://dental-staging.example.com/"
INITIAL_ADMIN_EMAIL="admin@example.com"
INITIAL_ADMIN_PASSWORD="CHANGE_ME_STRONG_PASSWORD"
INITIAL_ADMIN_NAME="UBINARYS"
INITIAL_ADMIN_SURNAME="Admin"
EOF
    fi
    NEW_ENV_INSTALLED=1
fi

# 4. Set owner root, group ubinarys, mode 640
chown root:ubinarys "$ENV_FILE"
chmod 640 "$ENV_FILE"

# Ensure output directories exist and set appropriate permissions
mkdir -p "$PROJECT_DIR/app/backend/public/download" "$PROJECT_DIR/app/backend/public/uploads"
chown -R ubinarys:ubinarys "$PROJECT_DIR/app/backend/public/download" "$PROJECT_DIR/app/backend/public/uploads"
chmod +x "$PROJECT_DIR/autostart.sh"

SERVICE_FILE="/etc/systemd/system/ubinarys.service"

cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Ubinarys Dental SaaS Application
After=network.target
# Note: For future local MongoDB deployments, add an override containing:
# Requires=mongod.service
# After=mongod.service

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
EnvironmentFile=/etc/ubinarys/ubinarys.env

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

# 13. Validate unit with systemd-analyze verify if available
if command -v systemd-analyze >/dev/null 2>&1; then
    echo -e "${YELLOW}Validating systemd unit with systemd-analyze verify...${NC}"
    if ! systemd-analyze verify "$SERVICE_FILE"; then
        echo -e "${RED}✘ systemd unit validation failed.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✔ systemd unit verified successfully.${NC}"
fi

systemctl daemon-reload
echo -e "${GREEN}✔ Reloaded systemd manager configuration${NC}"

systemctl enable ubinarys.service
echo -e "${GREEN}✔ Enabled ubinarys.service to run on boot${NC}"

# If a fresh template was installed, stop and instruct the admin to configure it
if [ "$NEW_ENV_INSTALLED" -eq 1 ]; then
    echo -e "\n${YELLOW}================================================================${NC}"
    echo -e "${YELLOW}! Action Required: Please configure $ENV_FILE before starting.${NC}"
    echo -e "${YELLOW}! Fill in DATABASE and JWT_SECRET, then run:${NC}"
    echo -e "  sudo systemctl start ubinarys.service"
    echo -e "${YELLOW}================================================================${NC}"
    exit 0
fi

# 5 & 14. Validate required variables before starting
echo -e "${YELLOW}Validating configuration in $ENV_FILE...${NC}"
set +u
DATABASE_VAL=$(grep -E '^DATABASE=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)
JWT_SECRET_VAL=$(grep -E '^JWT_SECRET=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)
set -u

if [ -z "$DATABASE_VAL" ] || [[ "$DATABASE_VAL" == *"USER:PASSWORD"* ]]; then
    echo -e "${RED}✘ Error: DATABASE in $ENV_FILE is not configured with valid connection details.${NC}"
    echo -e "${RED}Service will not be started until configuration is complete.${NC}"
    exit 1
fi

if [ -z "$JWT_SECRET_VAL" ] || [[ "$JWT_SECRET_VAL" == *"CHANGE_ME"* ]]; then
    echo -e "${RED}✘ Error: JWT_SECRET in $ENV_FILE is not configured.${NC}"
    echo -e "${RED}Service will not be started until configuration is complete.${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting ubinarys.service...${NC}"
systemctl restart ubinarys.service

if systemctl is-active --quiet ubinarys.service; then
    echo -e "${GREEN}✔ Ubinarys Dental Service is active and running!${NC}"
else
    echo -e "${RED}✘ Service started, but is not active. Check logs using: journalctl -u ubinarys.service -n 50 --no-pager${NC}"
    exit 1
fi

echo -e "\n${BLUE}=================================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "Useful Commands:"
echo -e "  - View service status:   ${BLUE}systemctl status ubinarys.service${NC}"
echo -e "  - View real-time logs:   ${BLUE}journalctl -u ubinarys.service -f${NC}"
echo -e "  - View recent logs:      ${BLUE}journalctl -u ubinarys.service -n 100 --no-pager${NC}"
echo -e "  - Restart service:       ${BLUE}systemctl restart ubinarys.service${NC}"
echo -e "${BLUE}=================================================${NC}"
