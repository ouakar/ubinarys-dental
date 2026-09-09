#!/usr/bin/env bash
set -Eeuo pipefail

# Ubinarys Dental - Ubuntu Development & Deployment Installer
# Supported: Ubuntu 22.04 LTS (Jammy), Ubuntu 24.04 LTS (Noble)
# Runtime: Node.js 24 LTS, MongoDB Community Edition 8.0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CURRENT_STAGE="Initialization"
trap 'echo -e "${RED}❌ Stage failed: [${CURRENT_STAGE}] on command: ${BASH_COMMAND} (line ${LINENO})${NC}" >&2' ERR

# Task 9: Resolve repository directory from script location
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}    Ubinarys Dental - Ubuntu Setup Installer    ${NC}"
echo -e "${BLUE}=================================================${NC}"

# Root invocation warning
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
    echo -e "${YELLOW}ℹ️  Running as non-root user. System package operations will use sudo.${NC}"
  else
    echo -e "${RED}❌ Error: Root privileges or sudo is required to manage system packages.${NC}" >&2
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  Warning: Setup is running as root.${NC}"
  echo -e "${YELLOW}   In development/production, npm and the dev servers should run under a non-root user.${NC}"
  echo -e "${YELLOW}   Avoid running 'sudo npm' to prevent ownership issues in node_modules.${NC}"
fi

# ==============================================================================
# STAGE 1: Validate Ubuntu release and CPU architecture
# ==============================================================================
CURRENT_STAGE="Validate OS & Architecture"
echo -e "\n${YELLOW}[Stage 1/12] Validating Ubuntu release and architecture...${NC}"

if [ ! -f /etc/os-release ]; then
  echo -e "${RED}❌ Error: This setup script requires an Ubuntu operating system (/etc/os-release not found).${NC}" >&2
  exit 1
fi

OS_ID=$(grep -E '^ID=' /etc/os-release | cut -d'=' -f2 | tr -d '"' | tr '[:upper:]' '[:lower:]')
OS_LIKE=$(grep -E '^ID_LIKE=' /etc/os-release | cut -d'=' -f2 | tr -d '"' | tr '[:upper:]' '[:lower:]' || true)

if [[ "$OS_ID" != "ubuntu" && "$OS_LIKE" != *"ubuntu"* ]]; then
  echo -e "${RED}❌ Error: This installer is intended for Ubuntu Linux. Detected OS: ${OS_ID}${NC}" >&2
  exit 1
fi

UBUNTU_CODENAME=$(grep -E '^VERSION_CODENAME=' /etc/os-release | cut -d'=' -f2 | tr -d '"')
if [[ "$UBUNTU_CODENAME" != "jammy" && "$UBUNTU_CODENAME" != "noble" ]]; then
  echo -e "${RED}❌ Error: Unsupported Ubuntu codename '${UBUNTU_CODENAME}'. Supported: Ubuntu 22.04 LTS (jammy), Ubuntu 24.04 LTS (noble).${NC}" >&2
  exit 1
fi

ARCH=$(dpkg --print-architecture 2>/dev/null || uname -m)
case "$ARCH" in
  amd64|x86_64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *)
    echo -e "${RED}❌ Error: Unsupported CPU architecture '${ARCH}'. MongoDB Community 8.0 packages require amd64 or arm64.${NC}" >&2
    exit 1
    ;;
esac
echo -e "${GREEN}✔ Validated Ubuntu ${UBUNTU_CODENAME} (${ARCH}).${NC}"

# ==============================================================================
# STAGE 2: Validate Installation Mode (Online vs Air-Gapped)
# ==============================================================================
CURRENT_STAGE="Validate Install Mode"
echo -e "\n${YELLOW}[Stage 2/12] Validating installation mode...${NC}"

if [ "${OFFLINE_MODE:-false}" = "true" ]; then
  echo -e "${YELLOW}⚠️  Deprecation Warning: OFFLINE_MODE=true is deprecated. Interpreting as AIRGAPPED=true.${NC}"
  AIRGAPPED="true"
fi

AIRGAPPED="${AIRGAPPED:-false}"
ONLINE_INSTALL="${ONLINE_INSTALL:-true}"

if [ "$AIRGAPPED" = "true" ]; then
  ONLINE_INSTALL="false"
  echo -e "${BLUE}ℹ️  Mode: AIR-GAPPED (no network operations will be performed).${NC}"

  MISSING_PREREQS=()
  command -v git >/dev/null 2>&1 || MISSING_PREREQS+=("git")
  command -v node >/dev/null 2>&1 || MISSING_PREREQS+=("nodejs (v24)")
  command -v npm >/dev/null 2>&1 || MISSING_PREREQS+=("npm (v10+)")
  command -v mongod >/dev/null 2>&1 || MISSING_PREREQS+=("mongodb-org (mongod)")
  command -v mongosh >/dev/null 2>&1 || MISSING_PREREQS+=("mongosh")
  command -v make >/dev/null 2>&1 || MISSING_PREREQS+=("build-essential (make/gcc/g++)")

  if [ -z "${PUPPETEER_EXECUTABLE_PATH:-}" ] && [ ! -d "$HOME/.cache/puppeteer" ]; then
    MISSING_PREREQS+=("Puppeteer Chromium browser or PUPPETEER_EXECUTABLE_PATH")
  fi

  if [ ${#MISSING_PREREQS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Error: The following prerequisites are missing for air-gapped installation:${NC}" >&2
    for item in "${MISSING_PREREQS[@]}"; do
      echo -e "   - ${item}" >&2
    done
    echo -e "${RED}Pre-install or cache these prerequisites before running in air-gapped mode.${NC}" >&2
    exit 1
  fi
else
  echo -e "${GREEN}✔ Mode: ONLINE (network package installation and verification enabled).${NC}"
fi

# ==============================================================================
# STAGE 3: System Base Dependencies
# ==============================================================================
CURRENT_STAGE="Install Base Dependencies"
echo -e "\n${YELLOW}[Stage 3/12] Checking base system packages...${NC}"

if [ "$ONLINE_INSTALL" = "true" ]; then
  $SUDO apt-get update -y
  $SUDO apt-get install -y git curl build-essential gnupg
else
  echo -e "${BLUE}✔ Skipping apt update (Air-Gapped mode).${NC}"
fi

# ==============================================================================
# STAGE 4: Node.js 24 LTS and npm 10+
# ==============================================================================
CURRENT_STAGE="Install Node.js 24"
echo -e "\n${YELLOW}[Stage 4/12] Checking Node.js 24 LTS and npm 10+...${NC}"

INSTALL_NODE=false
if ! command -v node >/dev/null 2>&1; then
  INSTALL_NODE=true
else
  NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
  if [ "$NODE_MAJOR" -ne 24 ]; then
    echo -e "${YELLOW}Detected Node $(node -v). Exactly Node.js 24 LTS is required.${NC}"
    INSTALL_NODE=true
  fi
fi

if [ "$INSTALL_NODE" = true ]; then
  if [ "$AIRGAPPED" = "true" ]; then
    echo -e "${RED}❌ Error: Node.js 24 is required but not installed in air-gapped mode.${NC}" >&2
    exit 1
  fi
  echo -e "${YELLOW}Installing Node.js 24 LTS from NodeSource...${NC}"
  # Task 1: Fix root and sudo curl piping
  if [ -n "$SUDO" ]; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  else
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  fi
  $SUDO apt-get install -y nodejs
fi

# Strict Node & npm validation
NODE_MAJOR=$(node -v 2>/dev/null | cut -d'.' -f1 | tr -d 'v' || echo "0")
if [ "$NODE_MAJOR" -ne 24 ]; then
  echo -e "${RED}❌ Error: Node.js validation failed. Node 24 is required, found: $(node -v 2>/dev/null || echo 'none').${NC}" >&2
  exit 1
fi

NPM_MAJOR=$(npm -v 2>/dev/null | cut -d'.' -f1 || echo "0")
if [ "$NPM_MAJOR" -lt 10 ]; then
  echo -e "${RED}❌ Error: npm validation failed. npm 10+ is required, found: $(npm -v 2>/dev/null || echo 'none').${NC}" >&2
  exit 1
fi
echo -e "${GREEN}✔ Node $(node -v) and npm v$(npm -v) verified.${NC}"

# ==============================================================================
# STAGE 5: MongoDB Community Edition 8.0 Installation
# ==============================================================================
CURRENT_STAGE="Install MongoDB 8.0"
echo -e "\n${YELLOW}[Stage 5/12] Checking MongoDB Community Edition...${NC}"

if command -v mongod >/dev/null 2>&1; then
  echo -e "${GREEN}✔ MongoDB (mongod) already installed: $(mongod --version | head -n 1)${NC}"
  if ! command -v mongosh >/dev/null 2>&1 && [ "$ONLINE_INSTALL" = "true" ]; then
    echo -e "${YELLOW}Installing mongosh...${NC}"
    $SUDO apt-get install -y mongodb-mongosh || true
  fi
else
  if [ "$AIRGAPPED" = "true" ]; then
    echo -e "${RED}❌ Error: mongod is not installed. Cannot proceed in air-gapped mode.${NC}" >&2
    exit 1
  fi

  # Task 2: Official MongoDB 8.0 repository for Ubuntu 22.04 (jammy) & 24.04 (noble)
  echo -e "${YELLOW}Configuring official MongoDB Community 8.0 repository for ${UBUNTU_CODENAME} (${ARCH})...${NC}"
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
    $SUDO gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes

  echo "deb [ arch=${ARCH} signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/8.0 multiverse" | \
    $SUDO tee /etc/apt/sources.list.d/mongodb-org-8.0.list

  $SUDO apt-get update -y
  $SUDO apt-get install -y mongodb-org mongodb-mongosh
fi

# ==============================================================================
# STAGE 6: Start and Ping MongoDB
# ==============================================================================
CURRENT_STAGE="Start & Ping MongoDB"
echo -e "\n${YELLOW}[Stage 6/12] Verifying MongoDB service and local connectivity...${NC}"

# Task 3: Strict service start without suppressing errors
if command -v systemctl >/dev/null 2>&1; then
  echo -e "${YELLOW}Enabling and starting mongod service via systemd...${NC}"
  $SUDO systemctl enable --now mongod || true
  if ! systemctl is-active --quiet mongod; then
    echo -e "${RED}❌ Error: mongod service is not active.${NC}" >&2
    systemctl status mongod --no-pager || true
    journalctl -u mongod -n 100 --no-pager || true
    exit 1
  fi
elif command -v service >/dev/null 2>&1; then
  $SUDO service mongod start || $SUDO service mongodb start || true
fi

# Ping test with mongosh
if command -v mongosh >/dev/null 2>&1; then
  echo -e "Testing local ping: db.runCommand({ ping: 1 })..."
  if ! mongosh --quiet --eval 'db.runCommand({ ping: 1 })' >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: MongoDB ping command failed. The mongod server is unresponsive.${NC}" >&2
    exit 1
  fi
  echo -e "${GREEN}✔ MongoDB ping succeeded.${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: mongosh not found; skipping ping test.${NC}"
fi

# ==============================================================================
# STAGE 7: Environment Files & LAN Configuration
# ==============================================================================
CURRENT_STAGE="Configure Environment"
echo -e "\n${YELLOW}[Stage 7/12] Setting up and validating environment files...${NC}"

# Task 5: Never overwrite existing .env files automatically
if [ ! -f "app/backend/.env" ]; then
  cp app/backend/.env.example app/backend/.env
  echo -e "${GREEN}✔ Created app/backend/.env from .env.example.${NC}"
else
  echo -e "${BLUE}✔ app/backend/.env exists (preserved).${NC}"
fi

if [ ! -f "app/frontend/.env" ]; then
  cp app/frontend/.env.example app/frontend/.env
  echo -e "${GREEN}✔ Created app/frontend/.env from .env.example.${NC}"
else
  echo -e "${BLUE}✔ app/frontend/.env exists (preserved).${NC}"
fi

# Task 11: LAN_IP Configuration
if [ -n "${LAN_IP:-}" ]; then
  # Validate IPv4 or IPv6
  if [[ ! "$LAN_IP" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ && ! "$LAN_IP" =~ ^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$ ]]; then
    echo -e "${RED}❌ Error: LAN_IP '${LAN_IP}' is not a valid IPv4 or IPv6 address.${NC}" >&2
    exit 1
  fi
  echo -e "${YELLOW}Configuring LAN access for IP: ${LAN_IP}...${NC}"

  # Configure backend .env safely
  sed -i.bak -E "s|^FRONTEND_URL=.*|FRONTEND_URL=\"http://${LAN_IP}:3000\"|" app/backend/.env
  sed -i.bak -E "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=\"http://${LAN_IP}:3000,http://localhost:3000,http://127.0.0.1:3000\"|" app/backend/.env
  sed -i.bak -E "s|^PUBLIC_SERVER_FILE=.*|PUBLIC_SERVER_FILE=\"http://${LAN_IP}:8888/\"|" app/backend/.env
  rm -f app/backend/.env.bak

  # Configure frontend .env safely
  sed -i.bak -E "s|^VITE_BACKEND_SERVER=.*|VITE_BACKEND_SERVER=\"http://${LAN_IP}:8888/\"|" app/frontend/.env
  sed -i.bak -E "s|^VITE_WEBSITE_URL=.*|VITE_WEBSITE_URL=\"http://${LAN_IP}:3000/\"|" app/frontend/.env
  rm -f app/frontend/.env.bak
  echo -e "${GREEN}✔ Configured backend and frontend URLs for LAN IP ${LAN_IP}.${NC}"
fi

# Task 5: Validate environment files using validateEnv.js
node app/backend/src/setup/validateEnv.js app/backend/.env || {
  # If validation failed because of placeholder secret, prompt or auto-generate
  if [ "${NON_INTERACTIVE:-false}" = "true" ]; then
    node app/backend/src/setup/validateEnv.js app/backend/.env --generate-secret
  else
    read -r -p "Generate a secure random 64-character JWT secret now? [Y/n]: " GEN_SECRET || GEN_SECRET="y"
    if [[ ! "$GEN_SECRET" =~ ^[Nn]$ ]]; then
      node app/backend/src/setup/validateEnv.js app/backend/.env --generate-secret
    fi
  fi
  node app/backend/src/setup/validateEnv.js app/backend/.env
}

# ==============================================================================
# STAGE 8: Install NPM Dependencies (npm ci)
# ==============================================================================
CURRENT_STAGE="Install NPM Dependencies"
echo -e "\n${YELLOW}[Stage 8/12] Installing dependencies with npm ci...${NC}"

NPM_CI_FLAGS=""
if [ "$AIRGAPPED" = "true" ]; then
  NPM_CI_FLAGS="--prefer-offline"
fi

echo "→ Installing root dependencies:"
npm ci $NPM_CI_FLAGS

echo "→ Installing backend dependencies:"
(cd app/backend && npm ci $NPM_CI_FLAGS)

echo "→ Installing frontend dependencies:"
(cd app/frontend && npm ci $NPM_CI_FLAGS)

# ==============================================================================
# STAGE 9: Backend Code Syntax & Unit Tests
# ==============================================================================
CURRENT_STAGE="Validate Code & Tests"
echo -e "\n${YELLOW}[Stage 9/12] Validating backend syntax and tests...${NC}"

echo "→ Checking backend JavaScript syntax (node --check):"
find app/backend/src -type f -name "*.js" -print0 | while IFS= read -r -d '' file; do
  node --check "$file"
done
echo -e "${GREEN}✔ Backend syntax checks passed.${NC}"

echo "→ Running backend tests:"
npm run test:backend

# ==============================================================================
# STAGE 10: Frontend Lint & Production Build
# ==============================================================================
CURRENT_STAGE="Frontend Lint & Build"
echo -e "\n${YELLOW}[Stage 10/12] Running frontend tests, lint, and build...${NC}"

echo "→ Running frontend tests:"
npm run test:frontend

echo "→ Running frontend lint:"
(cd app/frontend && npm run lint)

echo "→ Building frontend distribution:"
(cd app/frontend && npm run build)

# ==============================================================================
# STAGE 11: Puppeteer Readiness Check (Task 8)
# ==============================================================================
CURRENT_STAGE="Verify Puppeteer"
echo -e "\n${YELLOW}[Stage 11/12] Verifying Puppeteer browser execution...${NC}"

node app/backend/src/setup/verifyPuppeteer.js

# ==============================================================================
# STAGE 12: Optional Development Setup / Seeding (Task 6 & 10)
# ==============================================================================
CURRENT_STAGE="Development Data Setup"
echo -e "\n${YELLOW}[Stage 12/12] Database Seeding & Development Setup${NC}"

NON_INTERACTIVE="${NON_INTERACTIVE:-false}"
ALLOW_DEV_SEED="${ALLOW_DEV_SEED:-false}"

if [ "$NON_INTERACTIVE" = "true" ]; then
  if [ "$ALLOW_DEV_SEED" = "true" ]; then
    echo -e "NON_INTERACTIVE=true and ALLOW_DEV_SEED=true: running npm run setup:dev..."
    npm run setup:dev
  else
    echo -e "${BLUE}ℹ️  NON_INTERACTIVE=true (without ALLOW_DEV_SEED=true). Skipping database seeding.${NC}"
  fi
else
  read -r -p "Do you want to initialize development data now (admin@demo.com)? [y/N]: " CONFIRM_SETUP || CONFIRM_SETUP="n"
  if [[ "$CONFIRM_SETUP" =~ ^[Yy]$ ]]; then
    npm run setup:dev
    echo -e "${GREEN}✔ Development setup complete.${NC}"
  else
    echo -e "${BLUE}ℹ️  Skipped development setup. You can run it manually at any time with:${NC}"
    echo -e "   npm run setup:dev"
  fi
fi

# ==============================================================================
# SUCCESS SUMMARY
# ==============================================================================
CURRENT_STAGE="Complete"
LOCAL_IP="localhost"
if command -v hostname >/dev/null 2>&1; then
  LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
fi
if [ -n "${LAN_IP:-}" ]; then
  LOCAL_IP="$LAN_IP"
fi

echo -e "\n${GREEN}=================================================${NC}"
echo -e "${GREEN}       Ubinarys Dental Setup Successful!        ${NC}"
echo -e "${GREEN}=================================================${NC}"
echo -e "Startup Commands:"
echo -e "   Concurrent:   ${BLUE}npm start${NC}"
echo -e "   Backend:      ${BLUE}cd app/backend && npm run dev${NC}"
echo -e "   Frontend:     ${BLUE}cd app/frontend && npm run dev${NC}"
echo -e ""
echo -e "Application URLs:"
echo -e "   Local:        ${BLUE}http://localhost:3000${NC}"
echo -e "   LAN Access:   ${BLUE}http://${LOCAL_IP}:3000${NC}"
echo -e "   Backend API:  ${BLUE}http://${LOCAL_IP}:8888${NC}"
echo -e "   Health Live:  ${BLUE}http://${LOCAL_IP}:8888/health/live${NC}"
echo -e "   Health Ready: ${BLUE}http://${LOCAL_IP}:8888/health/ready${NC}"
echo -e ""
if [ -n "${LAN_IP:-}" ]; then
  echo -e "${YELLOW}Firewall Setup (Optional):${NC}"
  echo -e "   sudo ufw allow 3000/tcp comment \"Ubinarys Dental Frontend\""
  echo -e "   sudo ufw allow 8888/tcp comment \"Ubinarys Dental Backend API\""
  echo -e "   sudo ufw reload"
fi
echo -e "================================================="
exit 0
