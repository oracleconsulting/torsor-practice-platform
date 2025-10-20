# Use Node 20 LTS - Alternative: node:20.11-alpine if 20-alpine fails
FROM node:20.11-alpine AS deps
# Install dependencies needed for node-gyp
# BUILD: 2025-10-21-v1.0.5 - STRATEGIC PLANNING FEATURES + CLEAN THEME
# Features: Service Line Rankings, VARK Assessment, Strategic Matching
# Theme: Clean white theme matching Skills Heatmap
RUN apk add --no-cache python3 make g++ git curl wget nano

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install with legacy peer deps
RUN npm config set legacy-peer-deps true && \
    npm ci --include=dev --force

# Builder stage
FROM node:20.11-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Force cache invalidation - MUST be after node_modules copy
ARG CACHEBUST=2
RUN echo "Builder cache bust: $CACHEBUST" && \
    echo "Timestamp: $(date)" && \
    rm -rf dist .vite node_modules/.vite

# Copy source code (this layer should now be invalidated)
COPY . .

# Accept build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_RESEND_API_KEY
ARG VITE_FROM_EMAIL
ARG VITE_FROM_NAME

# Create .env file from build arguments
RUN echo "Creating .env file for build..." && \
    echo "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}" > .env && \
    echo "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" >> .env && \
    echo "VITE_RESEND_API_KEY=${VITE_RESEND_API_KEY}" >> .env && \
    echo "VITE_FROM_EMAIL=${VITE_FROM_EMAIL}" >> .env && \
    echo "VITE_FROM_NAME=${VITE_FROM_NAME}" >> .env && \
    echo "Environment variables set:" && \
    cat .env | sed 's/\(VITE_SUPABASE_ANON_KEY=\).*/\1***hidden***/' | sed 's/\(VITE_RESEND_API_KEY=\).*/\1***hidden***/'

# Clear Vite cache to force fresh build
RUN echo "Clearing Vite cache..." && \
    rm -rf node_modules/.vite .vite dist && \
    echo "Cache cleared, starting fresh build..."

# Build the application (fresh, no cache)
RUN npm run build

# Runner stage
FROM node:20.11-alpine

# Force cache invalidation for runner stage
ARG CACHEBUST=2
RUN echo "Runner cache bust: $CACHEBUST"

WORKDIR /app

# Copy package files and server
COPY package*.json ./
COPY server.js ./

# Install production dependencies only
RUN npm config set legacy-peer-deps true && \
    npm ci --omit=dev --force

# Copy built application (this should NOT be cached)
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "server.js"]