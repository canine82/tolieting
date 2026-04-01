#!/bin/sh
# Start nginx in the background
nginx -g 'daemon off;' &

# Store nginx PID
NGINX_PID=$!

# Start the Node.js backend
cd /app/backend
node server.js

# If Node.js process exits, kill nginx
kill $NGINX_PID