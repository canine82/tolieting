#!/bin/bash

# Elder Care Toileting System - VPS Installation Script
# Run this on your VPS: bash install.sh

set -e  # Exit on error

echo "=========================================="
echo "Elder Care Toileting System Installer"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get GitHub repo URL
read -p "Enter your GitHub repo URL (e.g., https://github.com/username/tolieting.git): " GITHUB_REPO

if [ -z "$GITHUB_REPO" ]; then
    echo -e "${YELLOW}Error: GitHub repo URL is required${NC}"
    exit 1
fi

# Get VPS domain/IP
read -p "Enter your VPS domain or IP address (for Nginx): " VPS_DOMAIN

if [ -z "$VPS_DOMAIN" ]; then
    echo -e "${YELLOW}Error: VPS domain/IP is required${NC}"
    exit 1
fi

# Step 1: Update System
echo -e "${BLUE}[1/8] Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

# Step 2: Install Node.js
echo -e "${BLUE}[2/8] Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo -e "${GREEN}Node.js already installed${NC}"
fi

# Step 3: Install PM2 globally
echo -e "${BLUE}[3/8] Installing PM2...${NC}"
sudo npm install -g pm2

# Step 4: Clone Repository
echo -e "${BLUE}[4/8] Cloning repository...${NC}"
if [ -d "tolieting" ]; then
    echo -e "${YELLOW}tolieting directory already exists. Removing...${NC}"
    rm -rf tolieting
fi
git clone "$GITHUB_REPO" tolieting
cd tolieting

# Step 5: Install Dependencies
echo -e "${BLUE}[5/8] Installing dependencies...${NC}"
cd backend
npm install
cd ../frontend
npm install
npm run build
cd ..

# Step 6: Create Nginx Config
echo -e "${BLUE}[6/8] Setting up Nginx...${NC}"
sudo tee /etc/nginx/sites-available/eldercare > /dev/null <<EOF
server {
    listen 80;
    server_name $VPS_DOMAIN;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable Nginx site
if [ ! -L /etc/nginx/sites-enabled/eldercare ]; then
    sudo ln -s /etc/nginx/sites-available/eldercare /etc/nginx/sites-enabled/
fi

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# Step 7: Start App with PM2
echo -e "${BLUE}[7/8] Starting application with PM2...${NC}"
cd backend
pm2 start server.js --name "eldercare-app"
pm2 startup
pm2 save
cd ..

# Step 8: Display Status
echo -e "${BLUE}[8/8] Verifying installation...${NC}"
pm2 status

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "✓ Installation Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}Your app is running at:${NC}"
echo -e "  http://$VPS_DOMAIN"
echo ""
echo -e "${GREEN}Useful Commands:${NC}"
echo "  pm2 status              - Check app status"
echo "  pm2 logs eldercare-app  - View live logs"
echo "  pm2 restart eldercare-app - Restart app"
echo "  pm2 stop eldercare-app  - Stop app"
echo ""
echo -e "${GREEN}To update from GitHub:${NC}"
echo "  cd ~/tolieting"
echo "  git pull"
echo "  cd frontend && npm run build && cd .."
echo "  pm2 restart eldercare-app"
echo ""
