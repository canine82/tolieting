# Stage 1: Build frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Backend and nginx
FROM node:18-alpine
RUN apk add --no-cache nginx
WORKDIR /app

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production
COPY backend/ ./backend/

# Expose port
EXPOSE 80

# Copy start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]