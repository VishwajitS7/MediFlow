# MediFlow — Containerization & Docker Engineering Guide

**Document Version:** 1.0.0  
**Role Owner:** Docker Engineer (`TASK-DOCKER-01`)  
**Target Image:** `mediflow:latest`  
**Base Image:** `node:20-alpine`  

---

## 1. Overview & Architecture

MediFlow uses a high-performance, 3-stage multi-stage Docker build designed specifically for Next.js 16 App Router applications. The architecture minimizes image size, isolates build-time dependencies, and complies with enterprise container security requirements.

### Build Stages:
1. **`deps` (Stage 1):** Installs production and dev dependencies cleanly using `npm ci` on lightweight Alpine Linux (`node:20-alpine`). Includes `libc6-compat` for Alpine compatibility.
2. **`builder` (Stage 2):** Takes dependencies from stage 1, compiles Next.js source code using `output: 'standalone'` mode configured in `next.config.ts`.
3. **`runner` (Stage 3):** Creates an ultra-lean runtime image containing only the Node.js runtime, standalone JavaScript bundle (`server.js`), static assets (`.next/static`), and public folder assets.

### Security Highlights:
- **Non-Root Execution:** Adheres to CIS Docker Benchmark guidelines. Drops root privileges and runs as `nextjs:nodejs` (UID/GID `1001`).
- **Minimal Attack Surface:** Alpine Linux base image without compilers or unused tools.
- **Embedded Health Check:** Built-in `HEALTHCHECK` command polling `/api/health` every 30s.

---

## 2. Dockerfile Build & Execution Instructions

### Prerequisites:
- Docker Engine 20.10+ installed and running.
- Alternatively, Docker Desktop on Windows/macOS.

### Build Command:
```bash
docker build -t mediflow:latest .
```

To build with a specific tag for versioning or CI:
```bash
docker build -t mediflow:1.0.0 -t mediflow:latest .
```

### Running the Container:
```bash
docker run -d \
  --name mediflow-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET="your-32-character-secret-key-goes-here!!" \
  -e MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/mediflow" \
  mediflow:latest
```

---

## 3. Environment Variable Injection Matrix

The container expects the following runtime environment variables:

| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | Optional (Default: `3000`) | Port on which the containerized HTTP server listens | `3000` |
| `NODE_ENV` | Yes | Node environment | `production` |
| `NEXTAUTH_URL` | Yes | Canonical base URL for NextAuth callbacks | `http://localhost:3000` or `https://clinic.example.com` |
| `NEXTAUTH_SECRET` | Yes | Strong cryptographically random 32+ character key | `change-me-to-a-very-long-secret-key-32` |
| `MONGODB_URI` | Yes | MongoDB Atlas or replica set connection string | `mongodb+srv://user:pass@cluster.mongodb.net/mediflow` |

### Using an Environment File (`.env`):
```bash
docker run -d \
  --name mediflow-app \
  -p 3000:3000 \
  --env-file .env.production \
  mediflow:latest
```

---

## 4. Container Health & Verification

### Container Status & Logs:
```bash
docker ps -f name=mediflow-app
docker logs -f mediflow-app
```

### Verify Container Health Endpoint:
```bash
curl -I http://localhost:3000/api/health
```
Response format:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-10-12T08:00:00.000Z",
    "services": {
      "database": "connected"
    }
  }
}
```

---

## 5. Security & Vulnerability Scanning (Trivy / Docker Scout)

To scan the container for CVEs prior to pushing to a container registry:

```bash
# Using Trivy
trivy image mediflow:latest

# Using Docker Scout
docker scout cves mediflow:latest
```

---

## 6. Integration with Downstream Kubernetes Deployment (`TASK-K8S-01`)

This container image directly unblocks the **Kubernetes Engineer (`TASK-K8S-01`)**:
- **Target Port:** `3000`
- **User ID:** `1001` (`runAsUser: 1001`, `runAsNonRoot: true`)
- **Liveness & Readiness Probe Path:** `/api/health`
- **Port:** `3000`
