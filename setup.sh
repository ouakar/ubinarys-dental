#!/bin/bash

# Ubinarys Dental - Ubuntu Setup Script
# Version: 1.0
# Compatible with Ubuntu 20.04, 22.04, 24.04

# --- Color Definitions ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}       Ubinarys Dental - Ubuntu Setup          ${NC}"
echo -e "${BLUE}=================================================${NC}"

# --- Error Handling ---
trap 'echo -e "${RED}Error: Setup failed at line $LINENO${NC}"; exit 1' ERR

# --- 1. Check/Install Dependencies ---
echo -e "\n${YELLOW}[1/5] Checking system dependencies...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Git
if ! command_exists git; then
    echo -e "${YELLOW}Installing Git...${NC}"
    sudo apt-get update && sudo apt-get install -y git
else
    echo -e "${GREEN}✔ Git is already installed.${NC}"
fi

# Check Node.js
if ! command_exists node; then
    echo -e "${YELLOW}Installing Node.js v18 LTS...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✔ Node.js is already installed ($NODE_VERSION).${NC}"
fi

# Check npm
if ! command_exists npm; then
    echo -e "${YELLOW}Installing npm...${NC}"
    sudo apt-get install -y npm
else
    echo -e "${GREEN}✔ npm is already installed.${NC}"
fi

# --- 2. Setup Environment Files ---
echo -e "\n${YELLOW}[2/5] Setting up environment files...${NC}"

if [ ! -f "app/backend/.env" ]; then
    cp app/backend/.env.example app/backend/.env
    echo -e "${GREEN}✔ Created app/backend/.env from example.${NC}"
else
    echo -e "${BLUE}! app/backend/.env already exists. Skipping copy.${NC}"
fi

if [ ! -f "app/frontend/.env" ]; then
    cp app/frontend/.env.example app/frontend/.env
    echo -e "${GREEN}✔ Created app/frontend/.env from example.${NC}"
else
    echo -e "${BLUE}! app/frontend/.env already exists. Skipping copy.${NC}"
fi

echo -e "${YELLOW}IMPORTANT: Please open app/backend/.env and provide your DATABASE (MongoDB) URL before starting the app.${NC}"

# --- 3. Install NPM Dependencies ---
echo -e "\n${YELLOW}[3/5] Installing project dependencies (this may take a few minutes)...${NC}"

echo "Installing backend dependencies..."
cd app/backend && npm install
echo -e "${GREEN}✔ Backend dependencies installed.${NC}"

cd ../frontend
echo "Installing frontend dependencies..."
npm install
echo -e "${GREEN}✔ Frontend dependencies installed.${NC}"

cd ../..

# --- 4. Detect Local IP ---
echo -e "\n${YELLOW}[4/5] Detecting local IP address...${NC}"

# Try to get the IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ip route get 1 | awk '{print $NF;exit}')
fi

echo -e "${GREEN}✔ Detected Local IP: ${BLUE}$LOCAL_IP${NC}"
echo -e "${YELLOW}You should use this IP in your .env files for local network access.${NC}"

# --- 5. Finalize and Start ---
echo -e "\n${YELLOW}[5/5] Setup Complete!${NC}"

read -p "Do you want to start the application now? (y/n) " START_NOW

if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
    echo -e "\n${GREEN}Starting Ubinarys Dental...${NC}"
    
    # Check for PM2
    if command_exists pm2; then
        echo "Starting backend with PM2..."
        cd app/backend && pm2 start src/server.js --name "ubinarys-backend"
        cd ../..
    else
        echo -e "${YELLOW}PM2 not found. Starting backend in background with Node...${NC}"
        cd app/backend && (npm run dev > ../../backend.log 2>&1 &)
        cd ../..
    fi

    echo "Starting frontend..."
    echo -e "${GREEN}-------------------------------------------------${NC}"
    echo -e "${GREEN}Application URLS:${NC}"
    echo -e "  Local:   ${BLUE}http://localhost:3000${NC}"
    echo -e "  Network: ${BLUE}http://$LOCAL_IP:3000${NC}"
    echo -e "${GREEN}-------------------------------------------------${NC}"
    
    cd app/frontend && npm run dev
else
    echo -e "\n${GREEN}Setup finished. You can start the app later with:${NC}"
    echo -e "Backend:  cd app/backend && npm run dev"
    echo -e "Frontend: cd app/frontend && npm run dev"
fi
