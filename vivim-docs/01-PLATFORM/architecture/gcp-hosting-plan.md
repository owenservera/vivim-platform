# Google Cloud Hosting Plan: Vivim App

## Objective
Design and document the cheapest, fully-featured Google Cloud Platform (GCP) hosting architecture for the Vivim App. The environment is primarily for testing but will be accessible publicly via `vivim.live`.

## Architecture Overview

To achieve the lowest cost while supporting WebSockets, PostgreSQL with `pgvector`, Redis, and Playwright, we will use a hybrid serverless and IaaS approach:

1. **Frontend (PWA & Admin)**: **Firebase Hosting** or **Cloud Storage + Cloud CDN**. Firebase Hosting is recommended for its generous free tier, easy CI/CD integration, and global CDN.
2. **Backend API (Server & Network)**: **Cloud Run**. It is serverless, scales to zero (incurring zero cost when not in use), and now natively supports WebSockets. We will configure the container with at least 2GB of memory to support headless Playwright.
3. **Database & Cache (PostgreSQL + pgvector & Redis)**: **Compute Engine (e2-micro / e2-small)**. Managed services like Cloud SQL and Memorystore are expensive. For the absolute lowest cost, we will provision a single tiny VM (e2-micro is in the Always Free tier in specific US regions) and run both PostgreSQL and Redis as Docker containers.

## Component Breakdown

### 1. Database & Cache VM (Compute Engine)
- **Instance Type**: `e2-micro` (Always Free tier eligible) or `e2-small` (if `pgvector` requires more RAM during intensive operations).
- **OS**: Container-Optimized OS or Debian 12.
- **Workload**: Docker Compose running:
  - `postgres:15` with the `pgvector` extension.
  - `redis:alpine`.
- **Networking**: VPC firewall rules to restrict access to these ports *only* from the Cloud Run backend, ensuring security.

### 2. Backend API (Cloud Run)
- **Service**: Dockerized Bun/Express server.
- **Scaling**: 0 to X instances. This ensures you only pay for compute time while requests are being processed.
- **Memory**: Minimum 2GB (required for Playwright browser instances).
- **Concurrency**: High concurrency enabled to handle multiple WebSocket connections per instance.

### 3. Frontend (Firebase Hosting)
- **Hosting**: Static assets for the PWA and Admin Panel.
- **Domain**: Custom domain integration for `app.vivim.live` or the main domain.

## Estimated Monthly Cost (Testing / Low Traffic)

- **Compute Engine (e2-micro)**: ~$0.00 (Always Free tier) or ~$7.50/mo.
- **Cloud Run**: ~$0.00 (Generous free tier: 2M requests, 360,000 GB-seconds free).
- **Firebase Hosting**: ~$0.00 (Free tier: 10GB storage, 360MB/day transfer).
- **Cloud Storage / Artifact Registry**: ~$0.00 - $1.00/mo (Storage for Docker images).
- **Total Estimated Cost**: **$0 to $10/month**.

## Implementation Steps (Using `gcloud`)

Once this plan is approved, the following setup phases will be executed automatically using your local `gcloud` CLI:

### Phase 1: GCP Project Setup
1. Create or select a GCP project.
2. Enable required APIs: Compute Engine, Cloud Run, Artifact Registry, Cloud Build.
3. Configure default region and zone (e.g., `us-central1`).

### Phase 2: Database & Redis Provisioning
1. Create a `docker-compose.yml` for Postgres (`pgvector`) and Redis.
2. Use `gcloud compute instances create-with-container` or standard VM creation to deploy the database stack.
3. Configure VPC firewall rules to allow internal traffic.

### Phase 3: Backend Deployment
1. Create an Artifact Registry repository for Docker images.
2. Build the backend Docker image containing Bun, Express, and Playwright dependencies.
3. Push the image to Artifact Registry using `gcloud builds submit`.
4. Deploy to Cloud Run using `gcloud run deploy`, injecting the internal IP of the Database VM as environment variables (`DATABASE_URL`, `REDIS_URL`).

### Phase 4: Frontend Deployment
1. Build the PWA and Admin Panel locally.
2. Initialize Firebase Hosting (or upload to a public GCS bucket with Load Balancer).
3. Deploy frontend assets.

### Phase 5: Domain Configuration (`vivim.live`)
1. Provide DNS records (A/CNAME) to point `app.vivim.live` to Firebase Hosting or Cloud Run.
2. If `vivim.live` remains on Vercel for documentation, configure subdomains (e.g., `api.vivim.live` for backend, `app.vivim.live` for PWA) in your domain registrar to point to the respective GCP resources.

## Verification & Testing
- Verify backend connectivity to the database and Redis.
- Test WebSocket connections (Yjs, libp2p) via the deployed Cloud Run URL.
- Perform a test extraction utilizing Playwright on the deployed backend to ensure memory limits are adequate.
- Verify custom domain routing.