# Use Node 20 to avoid Docker Hub rate limiting issues
FROM node:20-alpine AS deps
# Install dependencies needed for node-gyp
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install with legacy peer deps
RUN npm config set legacy-peer-deps true && \
    npm ci --include=dev --force

# Builder stage
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Create .env file from build arguments
RUN echo "Creating .env file for build..." && \
    echo "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}" > .env && \
    echo "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" >> .env && \
    echo "Environment variables set:" && \
    cat .env | sed 's/\(VITE_SUPABASE_ANON_KEY=\).*/\1***hidden***/'

# Build the application
RUN npm run build

# Runner stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and server
COPY package*.json ./
COPY server.js ./

# Install production dependencies only
RUN npm config set legacy-peer-deps true && \
    npm ci --omit=dev --force

# Copy built application
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "server.js"]