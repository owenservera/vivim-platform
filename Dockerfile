FROM oven/bun:debian

WORKDIR /app
COPY . .

# Install dependencies for the workspace
RUN bun install

WORKDIR /app/server

# Generate Prisma client
RUN bunx prisma generate

# Install Playwright and dependencies
RUN apt-get update && bunx playwright install --with-deps chromium && rm -rf /var/lib/apt/lists/*

EXPOSE 3000

ENV PORT=3000
CMD ["bun", "src/server.js"]
