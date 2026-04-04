#!/bin/bash
set -e

# Update and install dependencies
apt-get update
apt-get install -y ca-certificates curl gnupg

# Install Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Create working directory
mkdir -p /opt/vivim-db
cd /opt/vivim-db

# Create docker-compose.yml
cat <<EOF > docker-compose.yml
version: '3.8'
services:
  postgres:
    image: ankane/pgvector:v0.5.1
    environment:
      POSTGRES_USER: vivim
      POSTGRES_PASSWORD: vivim_password
      POSTGRES_DB: vivim_db
    ports:
      - "5432:5432"
    restart: always
    volumes:
      - pgdata:/var/lib/postgresql/data
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: always
volumes:
  pgdata:
EOF

# Start services
docker compose up -d
