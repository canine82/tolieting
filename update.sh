#!/bin/bash

# Elder Care Toileting System - VPS Update Script
# Run this on your VPS to update from GitHub: bash update.sh

set -e

echo "=========================================="
echo "Elder Care Toileting System Updater"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navigate to project
if [ ! -d "tolieting" ]; then
    echo -e "${YELLOW}Error: tolieting directory not found${NC}"
    exit 1
fi

cd tolieting

echo -e "${BLUE}[1/4] Pulling latest code from GitHub...${NC}"
git pull

echo -e "${BLUE}[2/4] Installing dependencies and building frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

echo -e "${BLUE}[3/4] Restarting application...${NC}"
pm2 restart eldercare-app

echo -e "${BLUE}[4/4] Checking status...${NC}"
pm2 status

echo ""
echo -e "${GREEN}✓ Update Complete!${NC}"
echo ""
pm2 logs eldercare-app --lines 20
