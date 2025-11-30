FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for native dependencies (bcrypt, better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies (skip prepare scripts to avoid husky in Docker)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install build tools for native dependencies (bcrypt, better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies only (skip prepare scripts)
RUN npm ci --production --ignore-scripts

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

# Create storage directory
RUN mkdir -p /app/storage/metadata

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV STORAGE_PATH=/app/storage

# Start application
CMD ["node", "build"]
