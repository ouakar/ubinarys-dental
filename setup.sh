#!/usr/bin/env bash
set -Eeuo pipefail

# Ubinarys Dental - Ubuntu Development Installer
# Requirements: Ubuntu OS, sudo privileges, Node.js 24 LTS, MongoDB

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}    Ubinarys Dental - Ubuntu Setup Installer    ${NC}"
echo -e "${BLUE}=================================================${NC}"

# 1. Require Ubuntu
if [ ! -f /etc/os-release ]; then
  echo -e "${RED}❌ Error: This setup script requires an Ubuntu operating system (/etc/os-release not found).${NC}" >&2
  exit 1
fi

OS_ID=$(grep -E '^ID=' /etc/os-release | cut -d'=' -f2 | tr -d '"' | tr '[:upper:]' '[:lower:]')
OS_LIKE=$(grep -E '^ID_LIKE=' /etc/os-release | cut -d'=' -f2 | tr -d '"' | tr '[:upper:]' '[:lower:]' || true)

if [[ "$OS_ID" != "ubuntu" && "$OS_LIKE" != *"ubuntu"* ]]; then
  echo -e "${RED}❌ Error: This installer is intended for Ubuntu. Detected OS: ${OS_ID}${NC}" >&2
  exit 1
fi

# 2. Require root or use sudo clearly
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
    echo -e "${YELLOW}ℹ️  Using sudo for system package management.${NC}"
  else
    echo -e "${RED}❌ Error: Root privileges or sudo is required to install system packages.${NC}" >&2
    exit 1
  fi
fi

# 3. Install build-essential, git, curl, Node.js 24
echo -e "\n${YELLOW}[1/7] Installing base build dependencies (git, curl, build-essential)...${NC}"
$SUDO apt-get update -y
$SUDO apt-get install -y git curl build-essential

# Node.js 24 installation/verification
echo -e "\n${YELLOW}[2/7] Checking Node.js 24 LTS installation...${NC}"
INSTALL_NODE=false
if ! command -v node >/dev/null 2>&1; then
  INSTALL_NODE=true
else
  NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
  if [ "$NODE_MAJOR" -ne 24 ]; then
    echo -e "${YELLOW}Detected Node $(node -v). Node.js 24 LTS is required.${NC}"
    INSTALL_NODE=true
  fi
fi

if [ "$INSTALL_NODE" = true ]; then
  echo -e "${YELLOW}Installing Node.js 24 from NodeSource...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_24.x | $SUDO -E bash -
  $SUDO apt-get install -y nodejs
fi

# 4. Detect MongoDB and handle offline mode
echo -e "\n${YELLOW}[3/7] Checking MongoDB service...${NC}"
OFFLINE_MODE="${OFFLINE_MODE:-false}"

if ! command -v mongod >/dev/null 2>&1; then
  if [ "$OFFLINE_MODE" = "true" ]; then
    echo -e "${RED}❌ Error: OFFLINE_MODE=true but 'mongod' binary was not found on this system.${NC}" >&2
    exit 1
  fi

  echo -e "${YELLOW}MongoDB not detected. Installing MongoDB Community Server...${NC}"
  $SUDO apt-get install -y gnupg
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    $SUDO gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
  
  UBUNTU_CODENAME=$(grep -E '^VERSION_CODENAME=' /etc/os-release | cut -d'=' -f2 | tr -d '"')
  # Fallback to jammy if noble repository is not yet published
  REPO_CODENAME="$UBUNTU_CODENAME"
  if [ "$UBUNTU_CODENAME" = "noble" ]; then
    REPO_CODENAME="jammy"
  fi

  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${REPO_CODENAME}/mongodb-org/7.0 multiverse" | \
    $SUDO tee /etc/apt/sources.list.d/mongodb-org-7.0.list

  $SUDO apt-get update -y
  $SUDO apt-get install -y mongodb-org
fi

# Verify version outputs
echo -e "\n${GREEN}✔ Installed software versions:${NC}"
echo -n "  Node:    " && node --version
echo -n "  npm:     " && npm --version
echo -n "  mongod:  " && mongod --version | head -n 1

# Start and enable mongod if systemd is available
if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
  echo -e "\n${YELLOW}Enabling and starting MongoDB service via systemd...${NC}"
  $SUDO systemctl enable --now mongod || $SUDO systemctl restart mongod || true
elif command -v service >/dev/null 2>&1; then
  $SUDO service mongod start || $SUDO service mongodb start || true
fi

# 5. Environment configuration (copy only if missing, never overwrite)
echo -e "\n${YELLOW}[4/7] Verifying environment configurations...${NC}"

if [ ! -f "app/backend/.env" ]; then
  cp app/backend/.env.example app/backend/.env
  echo -e "${GREEN}✔ Created app/backend/.env from .env.example.${NC}"
else
  echo -e "${BLUE}✔ app/backend/.env exists (kept unchanged).${NC}"
fi

if [ ! -f "app/frontend/.env" ]; then
  cp app/frontend/.env.example app/frontend/.env
  echo -e "${GREEN}✔ Created app/frontend/.env from .env.example.${NC}"
else
  echo -e "${BLUE}✔ app/frontend/.env exists (kept unchanged).${NC}"
fi

# 6. Run npm ci in root, backend, and frontend
echo -e "\n${YELLOW}[5/7] Installing dependencies with npm ci...${NC}"
echo "→ Root dependencies:"
npm ci

echo "→ Backend dependencies:"
(cd app/backend && npm ci)

echo "→ Frontend dependencies:"
(cd app/frontend && npm ci)

# 7. Quality checks: syntax checks, tests, lint, build
echo -e "\n${YELLOW}[6/7] Running validation suite...${NC}"

echo "→ Validating backend JavaScript syntax (node --check):"
find app/backend/src -type f -name "*.js" -print0 | while IFS= read -r -d '' file; do
  node --check "$file"
done
echo -e "${GREEN}✔ Backend syntax checks passed.${NC}"

echo "→ Running backend tests:"
npm run test:backend

echo "→ Running frontend tests:"
npm run test:frontend

echo "→ Running frontend lint:"
(cd app/frontend && npm run lint)

echo "→ Building frontend distribution:"
(cd app/frontend && npm run build)

# 8. Setup development data only upon explicit confirmation
echo -e "\n${YELLOW}[7/7] Database Seeding & Development Setup${NC}"
echo -e "This can initialize the default development administrator (admin@demo.com),"
echo -e "standard settings, taxes, payment modes, and dental treatments without deleting existing records."

CONFIRM_SETUP="n"
if [ "${NON_INTERACTIVE:-false}" = "true" ]; then
  CONFIRM_SETUP="y"
else
  read -r -p "Do you want to run 'npm run setup:dev' now? [y/N]: " CONFIRM_SETUP || CONFIRM_SETUP="n"
fi

if [[ "$CONFIRM_SETUP" =~ ^[Yy]$ ]]; then
  echo -e "\nRunning development setup (npm run setup:dev)..."
  npm run setup:dev
  echo -e "${GREEN}✔ Development setup complete.${NC}"
else
  echo -e "\n${BLUE}ℹ️  Skipped development setup. You can run it manually at any time with:${NC}"
  echo -e "   npm run setup:dev"
fi

# Print startup guidance
LOCAL_IP="localhost"
if command -v hostname >/dev/null 2>&1; then
  LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
fi

echo -e "\n${GREEN}=================================================${NC}"
echo -e "${GREEN}       Ubinarys Dental Setup Successful!        ${NC}"
echo -e "${GREEN}=================================================${NC}"
echo -e "To start the application concurrently:"
echo -e "   ${BLUE}npm start${NC}"
echo -e ""
echo -e "To start individual services:"
echo -e "   Backend:  ${BLUE}cd app/backend && npm run dev${NC}"
echo -e "   Frontend: ${BLUE}cd app/frontend && npm run dev${NC}"
echo -e ""
echo -e "Access URLs:"
echo -e "   Local:    ${BLUE}http://localhost:3000${NC}"
echo -e "   LAN:      ${BLUE}http://${LOCAL_IP}:3000${NC}"
echo -e "================================================="
