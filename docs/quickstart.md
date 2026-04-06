---
title: "Quick Start"
description: "Get VIVIM running locally in under 2 minutes with four commands."
---

# Quick Start

Get VIVIM running locally in under 2 minutes.

## Prerequisites

- **Bun** 1.0+ (runtime)
- **Node.js** 18+ (fallback)
- **PostgreSQL** 15+ (database)
- **Redis** 7+ (optional, for caching)

## Installation



1. **Clone the repository**
   ```bash
    git clone https://github.com/owenservera/vivim-platform.git
    cd vivim-platform
    ```

  
2. **Install dependencies**
   ```bash
    bun run setup:deps
    ```
    This installs all workspace packages and their dependencies via `bun install`.

  
3. **Set up the database**
   ```bash
    bun run setup:db
    ```
    This runs Prisma migrations to create all required tables.

  
4. **Start all services**
   ```bash
    bun run dev
    ```
    This launches the PWA, server, network engine, and admin panel concurrently.


## Access the app

Open [http://localhost:5173/demo/investor-pitch](http://localhost:5173/demo/investor-pitch) to see the 90-second demo.

## What runs

`bun run dev` starts five services concurrently:

| Service | Port | Purpose |
|---|---|---|
| PWA | `:5173` | Main web interface |
| Server | `:3000` | REST API, memory engine |
| Network WS | `:3001` | P2P WebSocket transport |
| Admin Panel | `:5174` | Platform management |
| Dashboard | `:5175` | SDK public dashboard |

## Individual services

Run a single service for development:

```bash
bun run dev:pwa       # Frontend only
bun run dev:server    # Backend only
bun run dev:network   # P2P engine only
bun run dev:admin     # Admin panel only
bun run dev:dashboard # SDK dashboard
bun run dev:agent     # Publishing agent
```

## Debug mode

Enable verbose logging:

```bash
bun run dev:debug
```

This sets `LOG_LEVEL=debug` and `DEBUG=true` across all services.

## Troubleshooting


::: details Port already in use
Stop existing processes on the default ports, or use the `bun run dev:cleanup` script to clear stale processes.
:::



::: details Database connection failed
Ensure PostgreSQL is running and the `DATABASE_URL` in `.env` points to a valid database. Run `bun run setup:db` to create tables.
:::



::: details Bun not installed
Install Bun: `curl -fsSL https://bun.sh/install | bash` (macOS/Linux) or `powershell -c "irm bun.sh/install.ps1 | iex"` (Windows).
:::



::: tip
For a full system reset including dependencies, run `bun run setup` which reinstalls packages and regenerates the database.
:::

