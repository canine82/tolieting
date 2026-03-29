#!/bin/bash
set -e

# Usage: bash install-cloudflare-origin.sh toliet.iwoof.tech
# This script sets up Cloudflare origin cert and nginx HTTPS for toliet.iwoof.tech.

if [ -z "$1" ]; then
  echo "Usage: bash install-cloudflare-origin.sh your-domain.com"
  exit 1
fi

DOMAIN="$1"
CERT_DIR="/etc/ssl/cloudflare"
NGINX_CONF="/etc/nginx/sites-available/eldercare"

# Prompt for pem blocks (copy from Cloudflare)
read -p "Enter origin certificate file path (or leave empty to paste manually): " ORIG_CERT_PATH
read -p "Enter origin private key file path (or leave empty to paste manually): " ORIG_KEY_PATH

sudo mkdir -p "$CERT_DIR"

if [ -n "$ORIG_CERT_PATH" ] && [ -f "$ORIG_CERT_PATH" ]; then
  sudo cp "$ORIG_CERT_PATH" "$CERT_DIR/origin.pem"
else
  echo "Paste origin certificate (.pem) and then Ctrl+D:"
  sudo tee "$CERT_DIR/origin.pem" > /dev/null
fi

if [ -n "$ORIG_KEY_PATH" ] && [ -f "$ORIG_KEY_PATH" ]; then
  sudo cp "$ORIG_KEY_PATH" "$CERT_DIR/origin.key"
else
  echo "Paste origin private key (.key) and then Ctrl+D:"
  sudo tee "$CERT_DIR/origin.key" > /dev/null
fi

sudo chmod 600 "$CERT_DIR/origin.key"

if [ ! -f "$NGINX_CONF" ]; then
  echo "ERROR: Nginx config not found at $NGINX_CONF"
  exit 2
fi

# Set up nginx server block for https + redirect
SQL=$(cat <<'EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    error_page 502 503 504 /maintenance.html;
    location = /maintenance.html {
        root /home/your_user/tolieting;
        internal;
    }
}
EOF
)

sudo bash -c "echo \"${SQL//DOMAIN_PLACEHOLDER/$DOMAIN}\" > $NGINX_CONF"

sudo nginx -t
sudo systemctl reload nginx

echo "Cloudflare origin cert installed and nginx updated for https://$DOMAIN"

echo "Testing response..."
curl -I "https://$DOMAIN" || true
curl -s "https://$DOMAIN/api/daily-roster" | head
