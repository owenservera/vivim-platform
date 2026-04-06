---
title: "Kubernetes Deployment"
description: "Deploy VIVIM on Kubernetes with Helm charts for scalable, production-grade infrastructure."
---

# Kubernetes Deployment

Deploy VIVIM on Kubernetes using Helm charts for scalable, production-grade infrastructure.


::: info
The Kubernetes Helm chart is planned for Q3 2025. Until then, use the Docker Compose deployment or the manual Kubernetes manifests below.
:::


## Manual Kubernetes manifests

### Database

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          env:
            - name: POSTGRES_USER
              value: vivim
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: vivim-secrets
                  key: postgres-password
            - name: POSTGRES_DB
              value: vivim
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-storage
          persistentVolumeClaim:
            claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
```

### API Server

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vivim-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vivim-server
  template:
    metadata:
      labels:
        app: vivim-server
    spec:
      containers:
        - name: server
          image: ghcr.io/owenservera/vivim-server:latest
          env:
            - name: DATABASE_URL
              value: postgresql://vivim:$(POSTGRES_PASSWORD)@postgres:5432/vivim
            - name: NODE_ENV
              value: production
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /api/v1/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/v1/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: vivim-server
spec:
  selector:
    app: vivim-server
  ports:
    - port: 3000
  type: ClusterIP
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vivim
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - vivim.example.com
      secretName: vivim-tls
  rules:
    - host: vivim.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: vivim-pwa
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: vivim-server
                port:
                  number: 3000
```

## Helm chart (planned)

When available, the Helm chart will support:

| Feature | Description |
|---|---|
| **Database provisioning** | PostgreSQL or external database connection |
| **TLS** | Automatic certificate management via cert-manager |
| **Scaling** | Horizontal pod autoscaler configuration |
| **Monitoring** | Prometheus metrics export |
| **Backups** | Automated database backups to S3 |


::: warning
For production Kubernetes deployments, always use secrets management (e.g., sealed-secrets, Vault) for sensitive values like `POSTGRES_PASSWORD` and `VIVIM_MASTER_SECRET`.
:::

