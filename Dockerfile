# Stage 1: Build frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npx vite build

# Stage 2: Backend and nginx
FROM node:18-alpine
RUN apk add --no-cache nginx python3 py3-pip make g++
WORKDIR /app

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production
COPY backend/ ./backend/
# Rebuild native modules for the target platform
RUN cd backend && npm rebuild sqlite3 --build-from-source

# Expose port
EXPOSE 80

# Copy start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]