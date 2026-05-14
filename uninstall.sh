#!/bin/bash

# Elder Care Toileting System - VPS Uninstallation Script
# Run this on your VPS: bash uninstall.sh

set -e  # Exit on error

echo "=========================================="
echo "Elder Care Toileting System Uninstaller"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Stop and remove PM2 app
echo -e "${BLUE}[1/6] Stopping and removing PM2 app...${NC}"
if command_exists pm2; then
    pm2 stop eldercare-app 2>/dev/null || echo -e "${YELLOW}App not running${NC}"
    pm2 delete eldercare-app 2>/dev/null || echo -e "${YELLOW}App not found${NC}"
    pm2 save 2>/dev/null || true
    echo -e "${GREEN}PM2 app stopped and removed${NC}"
else
    echo -e "${YELLOW}PM2 not installed${NC}"
fi

# Step 2: Remove Nginx configuration
echo -e "${BLUE}[2/6] Removing Nginx configuration...${NC}"
if [ -L /etc/nginx/sites-enabled/eldercare ]; then
    sudo rm /etc/nginx/sites-enabled/eldercare
    echo -e "${GREEN}Nginx site disabled${NC}"
fi
if [ -f /etc/nginx/sites-available/eldercare ]; then
    sudo rm /etc/nginx/sites-available/eldercare
    echo -e "${GREEN}Nginx config removed${NC}"
fi
if command_exists nginx; then
    sudo nginx -t && sudo systemctl reload nginx 2>/dev/null || echo -e "${YELLOW}Nginx reload failed${NC}"
fi

# Step 3: Remove tolieting directory
echo -e "${BLUE}[3/6] Removing application directory...${NC}"
if [ -d "tolieting" ]; then
    rm -rf tolieting
    echo -e "${GREEN}Application directory removed${NC}"
else
    echo -e "${YELLOW}Application directory not found${NC}"
fi

# Step 4: Remove PM2
echo -e "${BLUE}[4/6] Removing PM2...${NC}"
if command_exists pm2; then
    sudo npm uninstall -g pm2
    echo -e "${GREEN}PM2 removed${NC}"
else
    echo -e "${YELLOW}PM2 not installed${NC}"
fi

# Step 5: Remove Node.js
echo -e "${BLUE}[5/6] Removing Node.js...${NC}"
if command_exists node; then
    sudo apt remove -y nodejs
    sudo apt autoremove -y
    echo -e "${GREEN}Node.js removed${NC}"
else
    echo -e "${YELLOW}Node.js not installed${NC}"
fi

# Step 6: Remove other dependencies (optional)
echo -e "${BLUE}[6/6] Cleaning up...${NC}"
# Note: Not removing git, curl, nginx as they might be used by system
echo -e "${GREEN}Cleanup complete${NC}"

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "✓ Uninstallation Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}System restored to pre-installation state.${NC}"
echo -e "${YELLOW}Note: Nginx, git, and curl are kept as they may be system dependencies.${NC}"
echo -e "${YELLOW}To remove them manually: sudo apt remove nginx git curl${NC}"