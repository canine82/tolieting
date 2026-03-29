#!/bin/bash

# Elder Care Toileting System - Health Check & Diagnostics Script
# Run to diagnose issues: bash health-check.sh

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Elder Care Toileting - Health Check"
echo "==========================================${NC}"
echo ""

ISSUES=0

# 1. Check Node.js
echo -e "${YELLOW}[1/10] Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js NOT installed${NC}"
    ISSUES=$((ISSUES + 1))
fi

# 2. Check PM2
echo -e "${YELLOW}[2/10] Checking PM2...${NC}"
if pm2 status &> /dev/null; then
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${RED}✗ PM2 NOT installed${NC}"
    ISSUES=$((ISSUES + 1))
fi

# 3. Check App Status
echo -e "${YELLOW}[3/10] Checking app status...${NC}"
if pm2 status 2>/dev/null | grep -q "eldercare-app"; then
    if pm2 status 2>/dev/null | grep "eldercare-app" | grep -q "online"; then
        echo -e "${GREEN}✓ App is running${NC}"
    else
        echo -e "${RED}✗ App is NOT running${NC}"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${RED}✗ App not registered with PM2${NC}"
    ISSUES=$((ISSUES + 1))
fi

# 4. Check API Port
echo -e "${YELLOW}[4/10] Checking API port (5000)...${NC}"
if curl -s http://localhost:5000/api/daily-roster > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is responding (port 5000)${NC}"
else
    echo -e "${RED}✗ API not responding on port 5000${NC}"
    ISSUES=$((ISSUES + 1))
fi

# 5. Check Nginx
echo -e "${YELLOW}[5/10] Checking Nginx...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx is NOT running${NC}"
    ISSUES=$((ISSUES + 1))
fi

# 6. Check Database
echo -e "${YELLOW}[6/10] Checking SQLite database...${NC}"
if [ -f "$HOME/tolieting/backend/data/eldercaredb.sqlite3" ]; then
    DB_SIZE=$(du -h "$HOME/tolieting/backend/data/eldercaredb.sqlite3" | cut -f1)
    echo -e "${GREEN}✓ Database exists (size: $DB_SIZE)${NC}"
else
    echo -e "${YELLOW}⚠ Database not found (will be created on first use)${NC}"
fi

# 7. Check Node Modules
echo -e "${YELLOW}[7/10] Checking dependencies...${NC}"
if [ -d "$HOME/tolieting/backend/node_modules" ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}✗ Backend dependencies NOT installed${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -d "$HOME/tolieting/frontend/dist" ]; then
    echo -e "${GREEN}✓ Frontend build exists${NC}"
else
    echo -e "${YELLOW}⚠ Frontend not built yet${NC}"
fi

# 8. Check Disk Space
echo -e "${YELLOW}[8/10] Checking disk space...${NC}"
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✓ Disk space OK ($DISK_USAGE% used)${NC}"
else
    echo -e "${RED}✗ Low disk space ($DISK_USAGE% used)${NC}"
    ISSUES=$((ISSUES + 1))
fi

# 9. Check Memory
echo -e "${YELLOW}[9/10] Checking memory...${NC}"
MEM_USAGE=$(free | awk 'NR==2 {printf("%.0f", $3/$2 * 100)}')
echo -e "Memory usage: ${MEM_USAGE}%"
if [ "$MEM_USAGE" -lt 85 ]; then
    echo -e "${GREEN}✓ Memory OK${NC}"
else
    echo -e "${RED}⚠ High memory usage${NC}"
fi

# 10. Show Recent Logs
echo -e "${YELLOW}[10/10] Checking recent logs...${NC}"
if pm2 logs eldercare-app --lines 5 --nostream 2>/dev/null | grep -i "error\|fatal\|exception" > /dev/null; then
    echo -e "${RED}⚠ Errors detected in logs:${NC}"
    pm2 logs eldercare-app --lines 10 --nostream 2>/dev/null | grep -i "error\|fatal\|exception"
else
    echo -e "${GREEN}✓ No critical errors in recent logs${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}=========================================="
echo "Summary"
echo "==========================================${NC}"

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All systems operational!${NC}"
    echo ""
    echo -e "Your app is accessible at:"
    echo -e "${GREEN}  http://localhost:5000${NC}"
    echo -e "  (or your configured domain via Nginx)"
else
    echo -e "${RED}✗ Found $ISSUES issue(s)${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting Tips:${NC}"
    echo "  1. View logs: pm2 logs eldercare-app"
    echo "  2. Restart: bash reload.sh"
    echo "  3. Check Nginx: sudo nginx -t"
    echo "  4. Check ports: sudo netstat -tlnp | grep 5000"
fi

echo ""
