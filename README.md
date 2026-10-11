# MediFlow — Smart Clinic Management Platform

MediFlow is a modern, web-based Smart Clinic Management Platform designed for outpatient clinics, polyclinics, and healthcare practitioners. Built with **Next.js App Router**, **TypeScript**, **MongoDB Atlas (Mongoose)**, and **Tailwind CSS**, MediFlow streamlines clinical workflows across patient intake, appointment scheduling, consultation notes, electronic prescriptions, and DevOps observability.

---

## 1. 10-Member Team Structure & Responsibilities

MediFlow is developed by a coordinated 10-member DevOps engineering team. Each member owns a specific domain:

| # | Role Name | Primary Domain | Task Reference |
|---|---|---|---|
| 1 | **Product Owner / Team Lead** | Requirements, Architecture, PR Approvals, Integration | `TASK-PO-01` |
| 2 | **Developer 1** | Authentication, RBAC, Layout, Navigation Shell | `TASK-DEV1-01` |
| 3 | **Developer 2** | Patient Registration, Profiles, Directory Search | `TASK-DEV2-01` |
| 4 | **Developer 3** | Appointment Scheduling, Consultations, Prescriptions | `TASK-DEV3-01` |
| 5 | **QA Engineer** | Test Strategy, Vitest Suites, Fixtures, E2E | `TASK-QA-01` |
| 6 | **Git/GitHub Engineer** | GitFlow Conventions, PR Guidelines, Branch Rules | `TASK-GIT-01` |
| 7 | **Jenkins Engineer** | Declarative Jenkinsfile, Automated Pipeline Stages | `TASK-CI-01` |
| 8 | **Docker Engineer** | Multi-Stage Dockerfile, Alpine Image Optimization | `TASK-DOCKER-01` |
| 9 | **Kubernetes Engineer** | Deployments, Services, ConfigMaps, Health Probes | `TASK-K8S-01` |
| 10 | **DevOps/SRE Engineer** | Observability, Health Endpoints, Telemetry, Runbooks | `TASK-SRE-01` |

---

## 2. Canonical Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (`strict: true`)
- **Runtime**: Node.js 22 LTS
- **Database**: MongoDB Atlas via Mongoose ODM
- **Authentication**: Auth.js (NextAuth) with JWT sessions
- **Validation**: Zod
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Testing**: Vitest (Unit & Integration)
- **CI/CD**: Jenkins Declarative Pipeline
- **Containers & Orchestration**: Docker & Kubernetes

---

## 3. Getting Started

### Prerequisites
- Node.js `v20+` or `v22+` (Node `v22.20+` recommended)
- npm `v10+`
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd mediflow

# Install dependencies
npm install

# Setup local environment
cp .env.example .env.local
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Verification & Build Commands

| Command | Action |
|---|---|
| `npm run lint` | Runs ESLint across the codebase |
| `npm run typecheck` | Executes TypeScript type-checking (`tsc --noEmit`) |
| `npm test` | Runs automated Vitest test suite |
| `npm run build` | Compiles production Next.js build |
| `npm run start` | Boots production server |

---

## 5. Repository Documentation Index

All team knowledge and architectural specifications reside in the `docs/` directory:

- [AGENTS.md](file:///d:/MediFlow/AGENTS.md) — Global engineering constraints and agent protocols.
- [docs/PROJECT_SPEC.md](file:///d:/MediFlow/docs/PROJECT_SPEC.md) — Product requirements and user personas.
- [docs/ARCHITECTURE.md](file:///d:/MediFlow/docs/ARCHITECTURE.md) — Architecture diagrams and layer boundaries.
- [docs/DATA_MODEL.md](file:///d:/MediFlow/docs/DATA_MODEL.md) — Canonical Mongoose schemas and relationships.
- [docs/API_CONTRACTS.md](file:///d:/MediFlow/docs/API_CONTRACTS.md) — Complete REST API specifications.
- [docs/TEAM_TASKS.md](file:///d:/MediFlow/docs/TEAM_TASKS.md) — Task matrix and file ownership registry.
- [docs/PROJECT_STATUS.md](file:///d:/MediFlow/docs/PROJECT_STATUS.md) — Live integration status and blocker tracking.
- [docs/DECISIONS.md](file:///d:/MediFlow/docs/DECISIONS.md) — Architecture Decision Records (ADRs).
- [docs/HANDOFF_LOG.md](file:///d:/MediFlow/docs/HANDOFF_LOG.md) — Team milestone handoffs.
- [docs/PR_CHECKLIST.md](file:///d:/MediFlow/docs/PR_CHECKLIST.md) — Pull request quality gates.

---

## 6. Git Workflow

- MediFlow strictly enforces a **GitFlow** model.
- Feature work is committed to `feature/<task-id>-<description>` branches.
- Pull requests must target the `develop` integration branch.
- No direct commits to `main` or `develop`.
