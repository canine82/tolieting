#!/bin/sh
# Start nginx in the background
nginx -g 'daemon off;' &

# Start the Node.js backend
cd /app/backend
node server.js