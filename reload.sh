#!/bin/bash

# Elder Care Toileting System - Reload/Restart Script
# Use when experiencing issues or deployed updates

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Elder Care Toileting System - Reload Menu"
echo "==========================================${NC}"
echo ""
echo "Options:"
echo "  1) Quick restart (fastest - just restart backend)"
echo "  2) Full rebuild (rebuild frontend + restart)"
echo "  3) Clean restart (kill all, rebuild, start fresh)"
echo "  4) Just kill app (stop without restarting)"
echo "  5) Check status and logs"
echo "  0) Exit"
echo ""
read -p "Choose option (0-5): " choice

case $choice in
    1)
        echo -e "${YELLOW}[Quick Restart] Restarting backend only...${NC}"
        pm2 restart eldercare-app
        sleep 2
        pm2 status
        echo -e "${GREEN}✓ Backend restarted${NC}"
        ;;
    
    2)
        echo -e "${YELLOW}[Full Rebuild] Building frontend...${NC}"
        cd ~/tolieting/frontend || exit 1
        npm run build
        echo -e "${GREEN}✓ Frontend rebuilt${NC}"
        
        echo -e "${YELLOW}Restarting backend...${NC}"
        pm2 restart eldercare-app
        sleep 2
        pm2 status
        echo -e "${GREEN}✓ Full rebuild complete${NC}"
        ;;
    
    3)
        echo -e "${RED}[Clean Restart] Stopping all processes...${NC}"
        pm2 stop eldercare-app 2>/dev/null || true
        pm2 delete eldercare-app 2>/dev/null || true
        sleep 1
        
        echo -e "${YELLOW}Rebuilding frontend...${NC}"
        cd ~/tolieting/frontend || exit 1
        npm install
        npm run build
        echo -e "${GREEN}✓ Frontend rebuilt${NC}"
        
        echo -e "${YELLOW}Installing backend dependencies...${NC}"
        cd ~/tolieting/backend || exit 1
        npm install
        echo -e "${GREEN}✓ Dependencies installed${NC}"
        
        echo -e "${YELLOW}Starting fresh...${NC}"
        pm2 start server.js --name "eldercare-app"
        sleep 3
        pm2 status
        echo -e "${GREEN}✓ Clean restart complete${NC}"
        ;;
    
    4)
        echo -e "${RED}[Kill App] Stopping application...${NC}"
        pm2 stop eldercare-app
        pm2 delete eldercare-app
        echo -e "${GREEN}✓ Application stopped${NC}"
        ;;
    
    5)
        echo -e "${BLUE}Current Status:${NC}"
        pm2 status
        echo ""
        echo -e "${BLUE}Last 30 lines of logs:${NC}"
        pm2 logs eldercare-app --lines 30 --nostream
        ;;
    
    0)
        echo "Exiting..."
        exit 0
        ;;
    
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}Testing API...${NC}"
sleep 1
if curl -s http://localhost:5000/api/daily-roster > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is responding${NC}"
    echo -e "${GREEN}✓ App should be accessible at http://<your-domain>${NC}"
else
    echo -e "${RED}✗ API not responding yet. Give it a few seconds and try again.${NC}"
    echo -e "${YELLOW}Run 'pm2 logs eldercare-app' to see error details${NC}"
fi
