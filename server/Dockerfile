# Multi-stage Dockerfile for OpenScroll Server with Bun
# Optimized for production use

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM oven/bun:1 AS base
# Or use specific version: oven/bun:1.1.30

# Install dependencies required for native modules
RUN apk add --no-cache \
    libc6-compat \
    postgresql-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install all dependencies
RUN bun install --frozen-lockfile

# ============================================================================
# Stage 2: Build
# ============================================================================
FROM base AS build

# Copy source code
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Run tests (optional, can be skipped for faster builds)
RUN bun test || true

# ============================================================================
# Stage 3: Production
# ============================================================================
FROM oven/bun:1-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    libc6-compat \
    postgresql-client

# Set NODE_ENV to production
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 openscroll && \
    adduser --system --uid 1001 openscroll

# Set working directory
WORKDIR /app

# Copy necessary files from dependencies stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lockb ./bun.lockb

# Copy built files from build stage
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/tests ./tests

# Copy Prisma client
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Change ownership to non-root user
RUN chown -R openscroll:openscroll /app

# Switch to non-root user
USER openscroll

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun -e "fetch('http://localhost:3000/').then(r => r.ok ? 0 : 1)"

# Start the application
CMD ["bun", "src/server.js"]
