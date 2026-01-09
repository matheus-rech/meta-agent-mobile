# Glass API Dockerfile for Railway Deployment
# Multi-stage build for optimized production image

# =============================================================================
# Stage 1: Build
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Glass API server
RUN pnpm build

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM node:22-alpine AS production

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S glass -u 1001

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy Glass API specific files
COPY --from=builder /app/server/glass-api ./server/glass-api
COPY --from=builder /app/lib/glass ./lib/glass
COPY --from=builder /app/agentskills ./agentskills

# Set ownership
RUN chown -R glass:nodejs /app

# Switch to non-root user
USER glass

# Expose port
EXPOSE 4000

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
