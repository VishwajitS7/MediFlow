# MediFlow — Engineering Delegation & Task Assignment Manual

**Document Version:** 1.0.0  
**Integration Owner:** Product Owner / Team Lead  
**Governing Standard:** [`AGENTS.md`](../AGENTS.md) & [`docs/TEAM_TASKS.md`](./TEAM_TASKS.md)  
**Date:** October 2026  
**Target Integration Branch:** `develop`

---

## 1. Executive Status & Pulled Integration Summary

Following the recent integration pull on the `develop` branch (fast-forwarding from commit `837a8d6` to `e350f9d`), all **4 foundational application development tracks** have been fully implemented, integrated, and verified against all automated quality gates:

- **Unit & Policy Tests (`npm test`):** 65/65 passed across 5 test suites.
- **TypeScript Strict Check (`npm run typecheck`):** Exit code 0 (zero errors).
- **Linting (`npm run lint`):** Exit code 0 (zero warnings).
- **Production Build (`npm run build`):** All 20 routes successfully compiled.

### Completed Track Summary

| Component / Task | Assigned Role | Status | Merged Deliverables |
|---|---|---|---|
| **TASK-PO-01 Foundation** | Product Owner / Team Lead | **MERGED** | Next.js 16 App Router scaffold, Tailwind CSS, Mongoose singleton, Zod, and Vitest baseline. |
| **TASK-GIT-01 GitFlow** | Git/GitHub Engineer | **MERGED** | `docs/GIT_WORKFLOW.md`, PR template, CODEOWNERS, issue templates, PR integrity CI. |
| **TASK-CI-01 Jenkins CI** | Jenkins Engineer | **MERGED** | Declarative 7-stage `Jenkinsfile` pipeline, NodeJS 20 tool config, `docs/JENKINS_SETUP.md`. |
| **TASK-DEV1-01 Auth & RBAC** | Developer 1 | **MERGED** | Auth.js credentials, User model, JWT sessions, Role Navbar, and staff self-registration security fix. |
| **TASK-DEV2-01 Patients** | Developer 2 | **MERGED** | Patient Mongoose model, Zod validation, sequential `MED-YYYY-XXXXX` IDs, directory UI, profile view. |
| **TASK-DEV3-01 Clinical Engine** | Developer 3 | **MERGED** | Appointments queue & slot grid, consultation draft/locking flow, vitals, prescriptions, printable views. |

---

## 2. Engineering Roadmap & Execution Dependency Flow

With application development completed, the team now transitions to **Containerization, Integration Quality Assurance, Observability/SRE, and Kubernetes Orchestration**:

```
[Current State: All Core Features & CI Merged]
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
1. Docker Engineer                        2. QA Engineer
   (TASK-DOCKER-01)                          (TASK-QA-01)
       │                                         │
       ▼                                         ▼
3. Kubernetes Engineer                    4. DevOps/SRE Engineer
   (TASK-K8S-01)                             (TASK-SRE-01)
```

- **Track A (Unblocked Now):** Docker Engineer (`TASK-DOCKER-01`)
- **Track B (Unblocked Now):** QA Engineer (`TASK-QA-01`)
- **Track C (Unblocked Now):** DevOps/SRE Engineer (`TASK-SRE-01`)
- **Track D (Standby / Blocked on Docker):** Kubernetes Engineer (`TASK-K8S-01`)

---

## 3. Detailed Role Assignment Packs

### Task Assignment 1: Docker Engineer (`TASK-DOCKER-01`)

- **Role:** Docker Engineer
- **Task ID:** `TASK-DOCKER-01`
- **Working Branch:** `feature/TASK-DOCKER-01-dockerfile` (branched from `develop`)
- **Priority:** 🔴 **Immediate** (Required to unblock Jenkins CI Stage 7 and Kubernetes manifests)
- **Owned Files:** `Dockerfile`, `.dockerignore`, `next.config.ts` (standalone output), `docs/DOCKER_GUIDE.md`

#### Scope of Work:
1. **Multi-Stage Container Build:** Create `Dockerfile` based on `node:20-alpine`:
   - **Stage 1 (`deps`):** Install production and dev dependencies cleanly via `npm ci`.
   - **Stage 2 (`builder`):** Build Next.js with standalone output enabled.
   - **Stage 3 (`runner`):** Minimal Alpine runtime image. Enforce non-root execution (`USER nextjs:nodejs`, UID `1001`) for container security compliance.
2. **Configuration:**
   - Configure Next.js standalone output in `next.config.ts` (`output: 'standalone'`).
   - Create `.dockerignore` excluding `.git`, `node_modules`, `.next`, `tests`, `docs`, and `.env*`.
3. **Documentation:** Create `docs/DOCKER_GUIDE.md` detailing build commands, run parameters, environment variable injection, and vulnerability scanning notes.
4. **CI Verification:** Ensure that Jenkinsfile Stage 7 (`docker build -t mediflow:test .`) passes cleanly.

---

### Task Assignment 2: QA Engineer (`TASK-QA-01`)

- **Role:** QA Engineer
- **Task ID:** `TASK-QA-01`
- **Working Branch:** `feature/TASK-QA-01-test-suite` (branched from `develop`)
- **Priority:** 🟡 **High** (Parallels Docker containerization)
- **Owned Files:** `tests/*` (`tests/integration/`, `tests/fixtures/`), `docs/TEST_PLAN.md`, `vitest.config.ts`

#### Scope of Work:
1. **Master Test Strategy:** Author `docs/TEST_PLAN.md` covering test architecture, coverage targets (>=80%), and CI quality gate criteria.
2. **Synthetic Fixtures:** Create reusable mock fixtures in `tests/fixtures/` for Users, Patients, Appointments, and Consultations. (Strict rule: zero real patient data).
3. **Integration Test Suites (`tests/integration/`):**
   - `auth.test.ts`: Verify registration policy (anonymous restricted to `PATIENT`; `ADMIN` required for staff; session token inspection).
   - `patients.test.ts`: Sequential `MED-YYYY-XXXXX` uniqueness, duplicate phone/email handling (409), and patient isolation (patients cannot access other records).
   - `clinical.test.ts`: 30-min slot overlap prevention, appointment state transitions, consultation completion locking (completed records are read-only), and prescription doctor authorization.

---

### Task Assignment 3: DevOps / SRE Engineer (`TASK-SRE-01`)

- **Role:** DevOps / SRE Engineer
- **Task ID:** `TASK-SRE-01`
- **Working Branch:** `feature/TASK-SRE-01-health-observability` (branched from `develop`)
- **Priority:** 🟡 **High** (Parallels QA and Docker)
- **Owned Files:** `src/app/api/health/*`, `docs/SRE_RUNBOOK.md`

#### Scope of Work:
1. **Production Health & Readiness Probes:** Enhance `src/app/api/health/route.ts`:
   - **MongoDB Live Ping:** Execute `mongoose.connection.db.admin().ping()` and measure response latency (`ms`).
   - **Probe Differentiation:** Distinguish shallow liveness (`?probe=liveness`) from deep readiness (`?probe=readiness`).
   - **System Telemetry:** Return process uptime in seconds and memory metrics (`rss`, `heapUsed`, `heapTotal`).
   - **HTTP Codes:** Return HTTP `200` with status `HEALTHY` when database is healthy; return HTTP `503` if DB connectivity fails.
2. **Operational Runbook:** Author `docs/SRE_RUNBOOK.md` documenting health probe responses, database outage recovery procedures, incident triage, and logging standards.

---

### Task Assignment 4: Kubernetes Engineer (`TASK-K8S-01`)

- **Role:** Kubernetes Engineer
- **Task ID:** `TASK-K8S-01`
- **Working Branch:** `feature/TASK-K8S-01-k8s-manifests` (branched from `develop`)
- **Priority:** 🟢 **Standby / Blocked** (Awaiting `TASK-DOCKER-01` container specifications)
- **Owned Files:** `k8s/*` (`deployment.yaml`, `service.yaml`, `configmap.yaml`, `secret.example.yaml`, `ingress.yaml`), `docs/K8S_DEPLOYMENT.md`

#### Scope of Work:
1. **Kubernetes Manifests (`k8s/`):**
   - `deployment.yaml`: Standalone container deployment, 2 replicas, containerPort `3000`, resource requests/limits, and HTTP probes pointing to `/api/health`.
   - `service.yaml`: ClusterIP service routing traffic on port `80` to targetPort `3000`.
   - `configmap.yaml`: Application config (`NODE_ENV=production`, `NEXTAUTH_URL`, `CLINIC_TIMEZONE=Asia/Kolkata`).
   - `secret.example.yaml`: Sensitive secrets template for `MONGODB_URI` and `NEXTAUTH_SECRET`.
   - `ingress.yaml`: Ingress routing for `mediflow.local` with path-based rules.
2. **Deployment Manual:** Author `docs/K8S_DEPLOYMENT.md` providing step-by-step setup for local clusters (Minikube / Kind) and production deployments.

---

## 4. Governance, PR Protocol & Team Sign-off Checklist

Before approving and merging any feature branch into `develop`, verify:
1. **Branch Naming:** `feature/<TASK-ID>-<description>` (no direct commits to `main` or `develop`).
2. **Conventional Commits:** `feat(...)`, `fix(...)`, `test(...)`, `docs(...)`.
3. **Protected Resources:** No unapproved modifications to `package.json`, `src/models/*`, or `src/types/*`.
4. **Data Security:** Only synthetic mock data permitted.
5. **Quality Gates:**
   ```bash
   npm run lint        # Zero errors and warnings
   npm run typecheck   # Clean exit code 0
   npm test            # All unit/integration tests pass
   npm run build       # Successful production build
   ```
