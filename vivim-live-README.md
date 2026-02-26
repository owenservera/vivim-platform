# VIVIM Live

**Sovereign AI Interface with Documentation**

This repository contains the VIVIM Live deployment with:
- **Landing Page**: Stealth-style interface at root
- **Documentation**: Docusaurus-powered docs at `/docs`

## Quick Start

```bash
# Install all dependencies
bun run install:all

# Run development servers
bun run dev

# Build for production
bun run build
```

## Structure

```
vivim-live/
├── github-frontend/    # Next.js 15 GitHub-style frontend
├── docs/               # Docusaurus documentation
│   ├── build/          # Production build output
│   ├── docs/           # Documentation source
│   │   └── sdk/        # SDK documentation
│   └── docusaurus.config.ts
├── index.html          # Landing page
└── package.json        # Root package.json
```

## Deployment

### For vivim.live

The documentation is configured to be served at `https://www.vivim.live/docs`.

1. **Build the documentation**:
   ```bash
   cd docs
   bun run build
   ```

2. **Deploy the `docs/build` directory** to your hosting provider.

3. **Configure your web server** to serve:
   - Root (`/`) → Landing page (`index.html`)
   - `/docs/*` → Documentation (`docs/build/*`)

### Using Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Using Netlify

1. Connect your repository to Netlify
2. Set build command: `bun run build`
3. Set publish directory: `docs/build`
4. Configure redirects in `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/docs/*"
     to = "/docs/:splat"
     status = 200
   ```

### Using nginx

```nginx
server {
    listen 80;
    server_name vivim.live www.vivim.live;

    root /var/www/vivim-live;
    index index.html;

    # Landing page
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Documentation
    location /docs {
        alias /var/www/vivim-live/docs/build;
        try_files $uri $uri/ /docs/index.html;
    }
}
```

## Development

### Run Documentation Only

```bash
cd docs
bun run dev
```

The docs will be available at `http://localhost:3000/docs`.

### Run Landing Page Only

The landing page is a static HTML file. Open `index.html` in a browser or serve it:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

## Documentation Structure

The SDK documentation is organized into:

- **Overview** (`/docs/sdk/overview`) - Introduction to VIVIM SDK
- **Core SDK** (`/docs/sdk/core/overview`) - Core types and utilities
- **API Nodes** (`/docs/sdk/api-nodes/overview`) - Identity, Storage, AI Chat, etc.
- **SDK Nodes** (`/docs/sdk/sdk-nodes/overview`) - React, Vue, Svelte, Flutter adapters
- **Network** (`/docs/sdk/network/overview`) - P2P networking
- **Guides** (`/docs/sdk/guides/getting-started`) - Step-by-step tutorials
- **Examples** (`/docs/sdk/examples/basic`) - Code examples

## GitHub Repositories

- **Main Application**: [github.com/owenservera/vivim-app](https://github.com/owenservera/vivim-app)
- **SDK**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)

## License

MIT License - See LICENSE file for details.
