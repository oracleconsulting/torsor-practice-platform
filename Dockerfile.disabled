# TEMPORARY: Single-stage build due to Docker Hub outage (503 errors)
# Docker Hub authentication is completely down - using single FROM to minimize registry calls
# Will revert to optimized multi-stage build when Docker Hub recovers
# BUILD: 2025-10-21-v1.0.7 - STRATEGIC PLANNING + DOCKER HUB WORKAROUND

FROM node:20-slim

# Install all dependencies needed for build and runtime
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    curl \
    wget \
    nano \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm config set legacy-peer-deps true && \
    npm ci --include=dev

# Copy source code
COPY . .

# Build arguments for environment variables
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

# Build the application
RUN npm run build

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5173/ || exit 1

# Start the application with preview server (serves built dist folder)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
