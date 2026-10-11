# MediFlow — 10-Member Engineering Task Matrix & Ownership Registry

**Document Version:** 1.0.0  
**Integration Owner:** Product Owner / Team Lead  
**Governing Standard:** All 10 roles are fixed, canonical, and immutable.

---

## 1. Master Task Matrix

| Task ID | Role Name | Task Title | Dependencies | Status | PR Branch |
|---|---|---|---|---|---|
| **TASK-PO-01** | Product Owner / Team Lead | Repository Foundation, Architecture Baseline & Core Scaffold | None | **COMPLETE AFTER MERGE** | `main` / `develop` |
| **TASK-GIT-01** | Git/GitHub Engineer | GitFlow Conventions, PR Guidelines & Branch Protection Docs | TASK-PO-01 | **READY TO START** | `feature/TASK-GIT-01-gitflow-standards` |
| **TASK-DEV1-01** | Developer 1 | Auth.js Setup, Role-Based Navigation & Session Shell | TASK-PO-01 | **READY FOR REVIEW** | `feature/TASK-DEV1-01-auth-navigation` |
| **TASK-DEV2-01** | Developer 2 | Patient Registration, Search & Patient Profiles | TASK-PO-01 | **READY TO START** | `feature/TASK-DEV2-01-patient-management` |
| **TASK-DEV3-01** | Developer 3 | Appointment Scheduling, Consultations & Prescriptions | TASK-PO-01, TASK-DEV2-01 (API contract) | **BLOCKED** | `feature/TASK-DEV3-01-appointments-clinical` |
| **TASK-QA-01** | QA Engineer | Test Strategy, Vitest Suite Scaffolding & E2E Test Suite | TASK-PO-01 | **READY TO START** | `feature/TASK-QA-01-test-suite` |
| **TASK-CI-01** | Jenkins Engineer | Declarative Jenkinsfile Pipeline (Lint, Typecheck, Test, Build) | TASK-PO-01 | **READY TO START** | `feature/TASK-CI-01-jenkins-pipeline` |
| **TASK-DOCKER-01** | Docker Engineer | Multi-Stage Dockerfile & Container Build Optimization | TASK-PO-01 | **READY TO START** | `feature/TASK-DOCKER-01-dockerfile` |
| **TASK-K8S-01** | Kubernetes Engineer | Kubernetes Deployment, Service, ConfigMap & Probe Manifests | TASK-DOCKER-01 | **BLOCKED** | `feature/TASK-K8S-01-k8s-manifests` |
| **TASK-SRE-01** | DevOps/SRE Engineer | Observability, Health Endpoints, Telemetry & SRE Runbooks | TASK-PO-01 | **READY TO START** | `feature/TASK-SRE-01-health-observability` |

---

## 2. Detailed Task Specifications & File Boundaries

### TASK-PO-01: Repository Foundation, Architecture Baseline & Core Scaffold
- **Assigned Role**: Product Owner / Team Lead
- **Scope**:
  - Scaffolding Next.js 16 with TypeScript App Router, Tailwind CSS, Mongoose, Zod, and Vitest.
  - Authoring comprehensive architecture docs (`AGENTS.md`, `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `API_CONTRACTS.md`, `TEAM_TASKS.md`, `PROJECT_STATUS.md`, `DECISIONS.md`, `HANDOFF_LOG.md`, `PR_CHECKLIST.md`).
  - Establishing shared base utilities (`src/lib/utils.ts`, `src/lib/db/mongodb.ts`, `src/types/index.ts`).
  - Configuring baseline verification commands (`lint`, `typecheck`, `test`, `build`).
- **Files Owned**: `AGENTS.md`, `README.md`, `.env.example`, `.gitignore`, `package.json`, `tsconfig.json`, `docs/*`, `src/lib/utils.ts`, `src/lib/db/mongodb.ts`, `src/types/index.ts`, `tests/unit/baseline.test.ts`.
- **Acceptance Criteria**:
  - Clean Next.js scaffold running in strict TypeScript mode.
  - Zero lint, type-check, build, or test failures.
  - All 11 team documentation files populated and aligned with no conflicting rules.
- **Current Status**: COMPLETE AFTER MERGE

---

### TASK-GIT-01: GitFlow Conventions, PR Guidelines & Branch Protection Docs
- **Assigned Role**: Git/GitHub Engineer
- **Scope**: Establish Git collaboration guidelines, branching policy, commit message conventions, and merge conflict resolution protocols.
- **Files Owned**: `docs/GIT_WORKFLOW.md`, `.github/pull_request_template.md`, `.github/workflows/*` (if applicable).
- **Dependencies**: TASK-PO-01 merged into `develop`.
- **Status**: READY TO START

---

### TASK-DEV1-01: Auth.js Setup, Role-Based Navigation & Session Shell
- **Assigned Role**: Developer 1
- **Scope**: Implement authentication credentials provider, JWT session handling, role-aware navigation bar, and user profile drawer.
- **Files Owned**: `src/lib/auth/*`, `src/models/User.ts`, `src/features/auth/*`, `src/app/(auth)/*`, `src/components/shared/nav.tsx`.
- **Dependencies**: TASK-PO-01 merged into `develop`.
- **Status**: IN PROGRESS

---

### TASK-DEV2-01: Patient Registration, Search & Patient Profiles
- **Assigned Role**: Developer 2
- **Scope**: Implement patient registration form, patient directory table, instant search/filtering, and comprehensive patient details view.
- **Files Owned**: `src/models/Patient.ts`, `src/lib/validation/patient.ts`, `src/app/api/patients/*`, `src/features/patients/*`, `src/app/(dashboard)/patients/*`.
- **Dependencies**: TASK-PO-01 merged into `develop`.
- **Status**: BLOCKED (Awaiting TASK-PO-01)

---

### TASK-DEV3-01: Appointment Scheduling, Consultations & Prescriptions
- **Assigned Role**: Developer 3
- **Scope**: Implement calendar/slot appointment booking, doctor consultation workflow (vitals, symptoms, diagnosis), and digital prescription generator.
- **Files Owned**: `src/models/Appointment.ts`, `src/models/Consultation.ts`, `src/models/Prescription.ts`, `src/lib/validation/appointment.ts`, `src/lib/validation/consultation.ts`, `src/lib/validation/prescription.ts`, `src/app/api/appointments/*`, `src/app/api/consultations/*`, `src/app/api/prescriptions/*`, `src/features/appointments/*`, `src/features/consultations/*`, `src/features/prescriptions/*`.
- **Dependencies**: TASK-PO-01 merged, TASK-DEV2-01 API contract.
- **Status**: BLOCKED (Awaiting TASK-PO-01)

---

### TASK-QA-01: Test Strategy, Vitest Suite Scaffolding & E2E Test Suite
- **Assigned Role**: QA Engineer
- **Scope**: Create test execution plan, setup mock data fixtures, unit tests for validation schemas and models, and integration tests for route handlers.
- **Files Owned**: `tests/*`, `vitest.config.ts`, `docs/TEST_PLAN.md`.
- **Dependencies**: TASK-PO-01 merged into `develop`.
- **Status**: BLOCKED (Awaiting TASK-PO-01)

---

### TASK-CI-01: Declarative Jenkinsfile Pipeline
- **Assigned Role**: Jenkins Engineer
- **Scope**: Author `Jenkinsfile` orchestrating checkout, dependency install, linting, type-checking, automated testing, production build, and Docker build artifact creation.
- **Files Owned**: `Jenkinsfile`, `docs/JENKINS_SETUP.md`.
- **Dependencies**: TASK-PO-01 merged into `develop`.
- **Status**: BLOCKED (Awaiting TASK-PO-01)

---

### TASK-DOCKER-01: Multi-Stage Dockerfile & Container Optimization
- **Assigned Role**: Docker Engineer
- **Scope**: Author production-grade multi-stage `Dockerfile` using lightweight Alpine Node image, non-root user execution, `.dockerignore`, and standalone Next.js output optimization.
- **Files Owned**: `Dockerfile`, `.dockerignore`, `docs/DOCKER_GUIDE.md`.
- **Dependencies**: TASK-PO-01 merged into `develop`.
- **Status**: BLOCKED (Awaiting TASK-PO-01)

---

### TASK-K8S-01: Kubernetes Deployment, Service, ConfigMap & Probe Manifests
- **Assigned Role**: Kubernetes Engineer
- **Scope**: Write Kubernetes manifests for Deployment (with resource limits and readiness/liveness probes), Service (ClusterIP/NodePort), ConfigMap, and Ingress routing.
- **Files Owned**: `k8s/*`, `docs/K8S_DEPLOYMENT.md`.
- **Dependencies**: TASK-DOCKER-01 container image specifications.
- **Status**: BLOCKED (Awaiting TASK-DOCKER-01)

---

### TASK-SRE-01: Observability, Health Endpoints, Telemetry & SRE Runbooks
- **Assigned Role**: DevOps/SRE Engineer
- **Scope**: Implement production `/api/health` probes (MongoDB connection ping, memory, uptime), failure recovery runbooks, and logging standards.
- **Files Owned**: `src/app/api/health/*`, `docs/SRE_RUNBOOK.md`.
- **Dependencies**: TASK-PO-01 merged into `develop`.
- **Status**: BLOCKED (Awaiting TASK-PO-01)
