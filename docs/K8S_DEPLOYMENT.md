# MediFlow — Kubernetes Deployment & Operations Guide

**Document Version:** 1.0.0  
**Role:** Kubernetes Engineer (`TASK-K8S-01`)  
**Namespace:** `mediflow`  
**Target Cluster:** Kubernetes 1.28+ (Minikube / Kind / EKS / GKE / On-Premise)

---

## 1. Architectural Overview

MediFlow is containerized as an optimized Next.js standalone application running on Node 20 Alpine. The Kubernetes deployment model guarantees high availability, security hardening, zero-downtime rolling upgrades, and resource governance.

### Topology Diagram
```text
           [ External Clients / Browser ]
                         |
                         v (Port 80/443)
               [ Ingress Controller ] (mediflow-ingress: mediflow.local)
                         |
                         v (ClusterIP Port 80 -> 3000)
             [ Service: mediflow-service ]
                         |
            +------------+------------+
            |                         |
            v                         v
   [ Pod: mediflow-web-1 ]   [ Pod: mediflow-web-2 ]  <--- Autoscaled by HPA (2 to 10)
     - Non-root UID 1001       - Non-root UID 1001
     - 100m-500m CPU           - 100m-500m CPU
     - 256Mi-512Mi Mem         - 256Mi-512Mi Mem
     - Probes: /api/health     - Probes: /api/health
```

---

## 2. Manifest Inventory (`k8s/`)

| File | Resource Kind | Purpose & Specifications |
|---|---|---|
| `k8s/namespace.yaml` | `Namespace` | Creates isolated `mediflow` namespace with resource boundaries. |
| `k8s/configmap.yaml` | `ConfigMap` | Non-sensitive runtime variables (`NODE_ENV`, `PORT`, `HOSTNAME`, `NEXTAUTH_URL`, `CLINIC_TIMEZONE`). |
| `k8s/secret.yaml` | `Secret` | Sensitive credentials (`MONGODB_URI`, `NEXTAUTH_SECRET`) injected as environment variables. |
| `k8s/deployment.yaml` | `Deployment` | 2 replicas, RollingUpdate strategy, non-root security context, resource requests/limits, liveness/readiness/startup probes. |
| `k8s/service.yaml` | `Service` | ClusterIP service exposing target port 3000 on service port 80. |
| `k8s/ingress.yaml` | `Ingress` | NGINX Ingress routing traffic for host `mediflow.local` with optimized timeouts. |
| `k8s/hpa.yaml` | `HorizontalPodAutoscaler` | Autoscales replicas between 2 and 10 based on CPU (70%) and Memory (80%) utilization. |
| `k8s/kustomization.yaml` | `Kustomization` | Bundles and manages deployment resources with declarative labeling. |

---

## 3. Security Hardening Standards

1. **Non-Root Execution**:
   - `runAsNonRoot: true`, `runAsUser: 1001`, `runAsGroup: 1001`, `fsGroup: 1001`.
   - Matches the Alpine container runner UID configured in the Dockerfile (`nextjs:nodejs`).
2. **Capability Dropping**:
   - `capabilities.drop: ["ALL"]` prevents container process privilege escalation.
   - `allowPrivilegeEscalation: false`.
3. **Decoupled Secrets**:
   - Database credentials and cryptographic keys are decoupled into Kubernetes Secrets (`mediflow-secret`) rather than hardcoded in the deployment spec.
4. **Resilience & Zero Downtime**:
   - Deployment `strategy.rollingUpdate`: `maxSurge: 1`, `maxUnavailable: 0` guarantees service continuity during upgrades.
   - 3-tier probe configuration (`startupProbe`, `readinessProbe`, `livenessProbe`) querying `/api/health` prevents bad revisions from taking traffic.

---

## 4. Deployment Instructions

### Prerequisites
- Running Kubernetes cluster (Minikube, Kind, k3s, MicroK8s, or cloud provider).
- `kubectl` CLI installed and authenticated to your cluster context.
- Ingress controller (e.g., `ingress-nginx`) enabled if testing ingress routes.

### 4.1. Fast Deployment using Kustomize (Recommended)
```bash
# Validate manifests dry-run
kubectl kustomize k8s

# Apply all manifests to the cluster
kubectl apply -k k8s
```

### 4.2. Sequential Manual Deployment
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

---

## 5. Verification & Health Monitoring

### Check Resource Status
```bash
# Verify namespace pods
kubectl get pods -n mediflow -o wide

# Check deployments and rollout status
kubectl rollout status deployment/mediflow-web -n mediflow

# Check services and endpoints
kubectl get svc,endpoints -n mediflow

# Check ingress configuration
kubectl get ingress -n mediflow

# Check HPA autoscaling
kubectl get hpa -n mediflow
```

### Accessing the Application Locally
1. **Using Port-Forward (Immediate testing)**:
   ```bash
   kubectl port-forward -n mediflow svc/mediflow-service 8080:80
   ```
   Open `http://localhost:8080` or curl `http://localhost:8080/api/health`.

2. **Using Ingress (`mediflow.local`)**:
   Add to your `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
   ```text
   127.0.0.1 mediflow.local
   ```
   Navigate to `http://mediflow.local` in your browser.

---

## 6. Rollback & Troubleshooting Runbook

### Rolling Back an Unhealthy Revision
```bash
# Inspect rollout revision history
kubectl rollout history deployment/mediflow-web -n mediflow

# Undo to previous revision
kubectl rollout undo deployment/mediflow-web -n mediflow
```

### Pod Debugging
```bash
# View pod logs
kubectl logs -n mediflow -l app.kubernetes.io/component=web --tail=100 -f

# Inspect failing pod events
kubectl describe pod <pod-name> -n mediflow
```
