FROM node:24.2.0-slim AS base

# Updae dependencies and install openssl
RUN apt-get update -y && apt-get install -y openssl

# Set working directory
WORKDIR /app

# Copy package.json to get packageManager info
COPY package.json ./

RUN export PKG_MGR=$(jq -r '.packageManager' package.json)

# Use corepack to install the correct pnpm version
RUN CI=true corepack enable && corepack prepare $PKG_MGR --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/utils/package.json ./packages/utils/
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY packages/utils ./packages/utils
COPY packages/backend ./packages/backend

# Build utils package first
WORKDIR /app/packages/utils
RUN pnpm build

# Set working directory to backend and build it
WORKDIR /app/packages/backend
RUN pnpm build

# Expose the port the app runs on
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Command to run the application
CMD ["pnpm", "start"]
