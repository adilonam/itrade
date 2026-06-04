# Use Microsoft's Node.js devcontainer image as base
FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

# Install additional system dependencies if needed
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    curl \
    wget \
    ripgrep \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@latest

# Create workspace directory
WORKDIR /workspace

# Set the default user to node (non-root)
USER node

# Copy package files and install dependencies (this will be handled by postCreateCommand)
# But we can prepare the environment
ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Expose ports for Next.js development
EXPOSE 3000 3001