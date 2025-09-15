# Multi-stage build for production
FROM node:18-alpine AS builder

# Build frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Production image
FROM node:18-alpine AS production

WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy server code
COPY server/ ./server/

# Copy built frontend
COPY --from=builder /app/client/build ./client/build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S homehub -u 1001
USER homehub

EXPOSE 5000

CMD ["node", "server/index.js"]