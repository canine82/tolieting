#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: bash switch-domain.sh your-domain.com"
  exit 1
fi

DOMAIN="$1"
NGINX_CONF="/etc/nginx/sites-available/eldercare"

if [ ! -f "$NGINX_CONF" ]; then
  echo "ERROR: Nginx config not found at $NGINX_CONF"
  exit 2
fi

echo "Updating Nginx config with domain: $DOMAIN"
sudo sed -i -E "s/^\s*server_name\s+.*;$/    server_name $DOMAIN;/" "$NGINX_CONF"

echo "Testing Nginx config"
sudo nginx -t

echo "Reloading Nginx"
sudo systemctl reload nginx

echo "Waiting 2 seconds for changes to settle..."
sleep 2

echo "Checking app via domain (HTTP headers)"

if command -v curl &> /dev/null; then
  curl -I "http://$DOMAIN" || true
  echo "Checking API"
  curl -s "http://$DOMAIN/api/daily-roster" | head
else
  echo "curl not installed. Please install curl and rerun to verify."
fi

echo "Switch complete. Open http://$DOMAIN"
