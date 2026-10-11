# MediFlow — Smart Clinic Management Platform
## Engineering Master Guide & Team Handoff Manual

MediFlow is a modern, web-based Smart Clinic Management Platform engineered for outpatient clinics, polyclinics, and healthcare practitioners. Built with **Next.js 16 App Router**, **TypeScript**, **MongoDB Atlas (Mongoose)**, **Auth.js**, and **Tailwind CSS**, MediFlow streamlines clinical workflows across patient intake, appointment scheduling, consultation notes, electronic prescriptions, and DevOps observability.

---

## 1. Team Progress Tracker & Task Status

MediFlow is developed by a coordinated 10-member DevOps engineering team. Below is the live status of each role:

| Task ID | Role Name | Primary Responsibility | Status | Working / Target Branch |
|---|---|---|---|---|
| **TASK-PO-01** | Product Owner / Team Lead | Repository Architecture, Foundation & Baseline Scaffold | **MERGED** | `main` / `develop` |
| **TASK-DEV1-01** | Developer 1 | Authentication Engine, User Model, RBAC & Navigation Shell | **READY FOR REVIEW** | `feature/TASK-DEV1-01-auth-navigation` |
| **TASK-DEV2-01** | **Developer 2** | **Patient Registration, Patient Directory, Search & Profiles** | **READY FOR REVIEW** | `feature/TASK-DEV2-01-patient-management` |
| **TASK-DEV3-01** | Developer 3 | Appointment Scheduling, Clinical Consultations & Prescriptions | BLOCKED (Awaits Dev 2) | `feature/TASK-DEV3-01-appointments-clinical` |
| **TASK-QA-01** | QA Engineer | Test Strategy, Vitest Test Fixtures & E2E Validation | READY TO START | `feature/TASK-QA-01-test-suite` |
| **TASK-GIT-01** | Git/GitHub Engineer | GitFlow Conventions, PR Guidelines & Branch Protection Rules | **READY FOR REVIEW** | `feature/TASK-GIT-01-gitflow-standards` |
| **TASK-CI-01** | Jenkins Engineer | Declarative Jenkinsfile Pipeline (Lint, Test, Build, Staging) | READY TO START | `feature/TASK-CI-01-jenkins-pipeline` |
| **TASK-DOCKER-01** | Docker Engineer | Production Multi-Stage Dockerfile & Container Optimization | READY TO START | `feature/TASK-DOCKER-01-dockerfile` |
| **TASK-K8S-01** | Kubernetes Engineer | Kubernetes Deployment, Service, ConfigMap & Probe Manifests | BLOCKED (Awaits Docker) | `feature/TASK-K8S-01-k8s-manifests` |
| **TASK-SRE-01** | DevOps/SRE Engineer | System Telemetry, Health Check APIs & Operational Runbooks | READY TO START | `feature/TASK-SRE-01-health-observability` |

---

## 2. What Has Been Done So Far

### 2.1 Milestone 1: Repository Foundation (`TASK-PO-01` — Product Owner / Team Lead)
- **Scaffold**: Next.js 16 (App Router), React 19, TypeScript strict mode (`"strict": true`), Tailwind CSS v4.
- **GitFlow Setup**: Clean repository initialized with protected `main` and integration `develop` branches.
- **Documentation Suite (11 Canonical Documents)**:
  - `AGENTS.md`: Global engineering rules, 10 role boundaries, Git protocols, security constraints.
  - `docs/PROJECT_SPEC.md`: Product requirements, personas (`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`), acceptance criteria.
  - `docs/ARCHITECTURE.md`: Monolithic App Router architecture, Mermaid topologies, layer boundaries.
  - `docs/DATA_MODEL.md`: Authoritative Mongoose schemas (`User`, `Patient`, `Appointment`, `Consultation`, `Prescription`).
  - `docs/API_CONTRACTS.md`: Standardized `ApiResponse<T>` envelope, status codes, REST endpoints.
  - `docs/TEAM_TASKS.md`: Master 10-member task matrix and ownership registry.
  - `docs/PROJECT_STATUS.md`: Live integration status and blocker tracking.
  - `docs/DECISIONS.md`: Architecture Decision Records (ADR-001 through ADR-006).
  - `docs/HANDOFF_LOG.md`: Formal handoff logs (Handoff 001 and Handoff 002).
  - `docs/PR_CHECKLIST.md`: PR review quality gates and security checklist.
  - `docs/MASTER_AGENT_PROMPT.md`: Master IDE agent prompt.
- **Core Utilities**:
  - `src/lib/utils.ts`: Tailwind class merger (`cn`).
  - `src/lib/db/mongodb.ts`: Mongoose singleton connection pool manager with global caching.
  - `src/types/index.ts`: Shared TypeScript domain models and `ApiResponse` envelope.
  - `src/app/api/health/route.ts`: Public system health probe returning database state and uptime.

### 2.2 Milestone 2: Authentication & Navigation (`TASK-DEV1-01` — Developer 1)
- **Database Modeling**: Canonical `User` Mongoose model in `src/models/User.ts` supporting four roles (`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`), bcrypt password hashes, and indexes.
- **Input Validation**: Zod validation schemas in `src/lib/validation/auth.ts` (`loginSchema`, `registerSchema`).
- **Auth.js (NextAuth) Integration**:
  - Configured NextAuth credentials provider in `src/lib/auth/auth-options.ts`.
  - Augmented JWT and session types with `role` and `id` in `src/types/next-auth.d.ts`.
  - NextAuth API route handler in `src/app/api/auth/[...nextauth]/route.ts`.
- **API Endpoints**:
  - `POST /api/auth/register`: User provisioning with bcrypt salt/hashing and validation.
  - `GET /api/auth/me`: Current authenticated session profile retrieval.
- **Server RBAC Authorization Guards**:
  - `src/lib/auth/rbac.ts`: Server helpers `requireAuth()` and `requireRole(["DOCTOR", "ADMIN"])` for downstream route handlers.
- **Role-Aware UI & Shell**:
  - `src/components/providers/session-provider.tsx`: Client `SessionProvider` wrapping the root layout in `src/app/layout.tsx`.
  - `src/components/shared/navbar.tsx`: Global navigation bar displaying active user identity, color-coded role badges, and permission-filtered navigation links.
  - `src/app/(auth)/login/page.tsx`: Modern login page with 1-click demo role fillers (Doctor, Receptionist, Admin, Patient).
  - `src/app/(auth)/register/page.tsx`: Registration page with dynamic doctor specialization intake.
- **Test Suite**: 12 passing tests across `tests/unit/baseline.test.ts` and `tests/unit/auth.test.ts`.

---

## 3. Developer 2 Detailed Implementation Guide (`TASK-DEV2-01`)

> **Notice to Developer 2**: You are building the **Patient Registration, Patient Directory, Search & Profile Management** subsystem. Follow this exact specification to maintain architectural alignment.

### 3.1 Assigned Role & Boundaries
- **Assigned Role**: Developer 2
- **Task ID**: `TASK-DEV2-01`
- **Target Integration Branch**: `develop`
- **Feature Branch Name**: `feature/TASK-DEV2-01-patient-management`
- **Owned File Boundaries**:
  - `src/models/Patient.ts`
  - `src/lib/validation/patient.ts`
  - `src/app/api/patients/route.ts`
  - `src/app/api/patients/[id]/route.ts`
  - `src/features/patients/*` (e.g. `patient-form.tsx`, `patient-table.tsx`, `patient-search.tsx`, `patient-profile.tsx`)
  - `src/app/(dashboard)/patients/page.tsx`
  - `src/app/(dashboard)/patients/[id]/page.tsx`
  - `tests/unit/patient.test.ts`
- **Protected Shared Files**: Do NOT modify `src/lib/db/mongodb.ts`, `src/lib/auth/auth-options.ts`, or `package.json` without approval.

---

### 3.2 Canonical Data Model: `Patient` Model (`src/models/Patient.ts`)
Must strictly conform to `docs/DATA_MODEL.md` Section 2.2:

```typescript
// Required Schema Fields:
- patientId: string          // Unique, formatted: MED-YYYY-XXXXX (e.g. MED-2026-00001)
- fullName: string           // Required, trimmed
- dateOfBirth: Date          // Required
- gender: 'MALE' | 'FEMALE' | 'OTHER' // Required enum
- phone: string              // Required, trimmed, indexed
- email?: string             // Optional, lowercase, trimmed
- bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
- allergies: string[]        // Default: []
- emergencyContact: {        // Required subdocument
    name: string,
    relationship: string,
    phone: string
  }
- address?: {                // Optional subdocument
    street?: string,
    city?: string,
    state?: string,
    zipCode?: string
  }
- userId?: ObjectId          // Optional link to User model (ref: 'User')
- timestamps: true           // createdAt, updatedAt auto-managed by Mongoose
```

**Required Indexes**:
- `{ patientId: 1 }` (unique: true)
- `{ phone: 1 }`
- `{ fullName: "text", phone: "text" }` (for fast full-text searching)

**Patient ID Auto-Generation Rule**:
Generate sequential or timestamp-based IDs conforming to: `MED-<YYYY>-<5_DIGIT_SEQUENCE>` (e.g. `MED-2026-00101`).

---

### 3.3 Zod Validation Schemas (`src/lib/validation/patient.ts`)
Create schemas for intake validation:
- `createPatientSchema`: validates `fullName` (min 2), `dateOfBirth` (valid past date), `gender` (enum), `phone` (min 7), optional `email`, optional `bloodGroup`, `emergencyContact` (`name`, `relationship`, `phone`), `allergies` (array of strings), optional `address`.
- `updatePatientSchema`: partial version of `createPatientSchema`.

---

### 3.4 API Endpoints Developer 2 Must Implement

All endpoints must return the standardized `ApiResponse<T>` envelope defined in `src/types/index.ts` and enforce server-side RBAC using `src/lib/auth/rbac.ts`.

#### Endpoint 1: `GET /api/patients`
- **Purpose**: Search and paginate patient directory.
- **RBAC Guard**: `await requireRole(["ADMIN", "DOCTOR", "RECEPTIONIST"])`
- **Query Params**:
  - `query` (optional string): full-text search against `fullName` or `phone`.
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Response**: `{ success: true, data: { patients: IPatient[], pagination: { page, limit, total } }, timestamp }`

#### Endpoint 2: `POST /api/patients`
- **Purpose**: Register a new patient.
- **RBAC Guard**: `await requireRole(["ADMIN", "RECEPTIONIST"])`
- **Input Validation**: `createPatientSchema.safeParse(await req.json())`
- **Business Logic**: Check for duplicate phone/email, auto-generate `patientId`, save to MongoDB.
- **Response**: `201 Created` with created patient payload.

#### Endpoint 3: `GET /api/patients/[id]`
- **Purpose**: Retrieve complete patient profile.
- **RBAC Guard**: `await requireRole(["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"])` (for `PATIENT`, verify they are accessing their own record).
- **Response**: Patient document or `404 Not Found`.

#### Endpoint 4: `PUT /api/patients/[id]`
- **Purpose**: Update patient demographics, contact info, or allergies.
- **RBAC Guard**: `await requireRole(["ADMIN", "RECEPTIONIST"])`
- **Response**: Updated patient document.

---

### 3.5 Frontend UI Components & Pages Developer 2 Must Build

#### Feature Components (`src/features/patients/`)
1. `patient-form.tsx`: Intuitive patient intake form with personal details, emergency contact, allergy multi-tags, and blood group selector.
2. `patient-table.tsx`: Clean data table displaying `Patient ID`, `Full Name`, `Gender`, `Phone`, `Blood Group`, `Allergies`, and quick action buttons.
3. `patient-search.tsx`: Instant search bar and debounce filter by name or phone.
4. `patient-profile.tsx`: Comprehensive patient summary overview showing demographic cards, allergies badge pills, and contact info.

#### Dashboard Pages
1. `src/app/(dashboard)/patients/page.tsx`:
   - Patient directory view with search bar, "Register New Patient" button (modal or route), and table of existing patients.
2. `src/app/(dashboard)/patients/[id]/page.tsx`:
   - Patient detail view displaying their medical profile, vitals summary card, and historical consultations tab.

---

### 3.6 How Developer 2 Reuses Existing Utilities
```typescript
// 1. Database Connection
import { connectToDatabase } from "@/lib/db/mongodb";

// 2. Server Authorization Guard
import { requireRole } from "@/lib/auth/rbac";

// 3. Canonical Types & Response Envelope
import { ApiResponse, IPatient } from "@/types";

// 4. Styling Helper
import { cn } from "@/lib/utils";
```

---

### 3.7 Developer 2 Quality Checklist (Before Submitting PR)
Before opening a PR, Developer 2 must verify in their terminal:
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm run typecheck` passes with 0 errors.
- [ ] `npm test` runs and passes (including new tests in `tests/unit/patient.test.ts`).
- [ ] `npm run build` compiles production build without errors.
- [ ] Feature branch created from `develop`: `feature/TASK-DEV2-01-patient-management`.
- [ ] PR targets `develop` with clear description and test evidence.

---

## 4. What Has to Be Done by Other Team Members

### 4.1 Developer 3 (`TASK-DEV3-01: Appointments, Consultations & Prescriptions`)
- **Dependencies**: Depends on Developer 2's `Patient` model.
- **Scope**:
  - `src/models/Appointment.ts`: Scheduled slot booking, doctor allocation, statuses (`SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
  - `src/models/Consultation.ts`: Doctor workspace, clinical vitals intake (BP, HR, Temp, SpO2), symptoms array, diagnosis, treatment notes.
  - `src/models/Prescription.ts`: Drug prescription composer (medication name, dosage, frequency, duration, instructions).
  - API Routes: `/api/appointments`, `/api/consultations`, `/api/prescriptions`.
  - UI Pages: Calendar booking modal, doctor consultation console, printable prescription view.

### 4.2 QA Engineer (`TASK-QA-01: Test Strategy & Automation`)
- **Scope**:
  - Author formal test plan in `docs/TEST_PLAN.md`.
  - Create synthetic test fixtures in `tests/fixtures/patients.json` and `tests/fixtures/appointments.json`.
  - Build integration tests in `tests/integration/` validating API routes against mock MongoDB databases.
  - Maintain reproducible defect logs and regression testing.

### 4.3 Git/GitHub Engineer (`TASK-GIT-01: GitFlow & Collaboration Standards`)
- **Scope**:
  - Create Pull Request template in `.github/pull_request_template.md`.
  - Document collaboration standards in `docs/GIT_WORKFLOW.md`.
  - Define branch protection rules for `main` and `develop` (require PR review, require passing CI checks).

### 4.4 Jenkins Engineer (`TASK-CI-01: CI/CD Pipeline Automation`)
- **Scope**:
  - Author declarative `Jenkinsfile` at repository root.
  - Pipeline stages:
    1. Checkout SCM
    2. Dependency Installation (`npm ci`)
    3. Code Linting (`npm run lint`)
    4. TypeScript Strict Validation (`npm run typecheck`)
    5. Unit & Integration Tests (`npm test`)
    6. Production Next.js Build (`npm run build`)
    7. Container Build Staging
  - Document Jenkins setup in `docs/JENKINS_SETUP.md`.

### 4.5 Docker Engineer (`TASK-DOCKER-01: Multi-Stage Containerization`)
- **Scope**:
  - Author production multi-stage `Dockerfile` (Stages: `deps`, `builder`, `runner`).
  - Use lightweight Node.js 22 Alpine base image with non-root security user (`nextjs:nodejs`).
  - Configure `.dockerignore` to exclude `node_modules`, `.git`, `.next`, and secrets.
  - Test container startup, memory footprint, and health check integration.

### 4.6 Kubernetes Engineer (`TASK-K8S-01: K8s Deployment & Orchestration`)
- **Dependencies**: Depends on Docker Engineer's image configuration.
- **Scope**:
  - Author Kubernetes manifests in `k8s/`:
    - `deployment.yaml` (with resource requests/limits, replicas, readiness probe `/api/health`, liveness probe).
    - `service.yaml` (ClusterIP / NodePort).
    - `configmap.yaml` & `secret-template.yaml` for runtime environment variables.
    - `ingress.yaml` for routing.
  - Document deployment and troubleshooting commands in `docs/K8S_DEPLOYMENT.md`.

### 4.7 DevOps/SRE Engineer (`TASK-SRE-01: Observability & Runbooks`)
- **Scope**:
  - Enhance `/api/health` with deep telemetry (database ping, memory heap usage, process uptime).
  - Define incident response and rollback procedures in `docs/SRE_RUNBOOK.md`.
  - Establish structured JSON logging and error monitoring standards.

---

## 5. Development Setup & Verification Commands

### Prerequisites
- Node.js `v22+` (LTS)
- npm `v10+`
- Git

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/VishwajitS7/MediFlow.git
cd MediFlow

# Switch to the integration branch
git checkout develop
git pull origin develop

# Install dependencies
npm install

# Setup local environment
cp .env.example .env.local
# (Configure your MONGODB_URI and NEXTAUTH_SECRET in .env.local)

# Run local development server
npm run dev
```

### Verification Scripts
Run these before any commit or pull request:
```bash
npm run lint        # ESLint verification (must exit with 0)
npm run typecheck   # TypeScript strict check (must exit with 0)
npm test            # Automated Vitest test suite (must pass 100%)
npm run build       # Next.js production build verification (must compile cleanly)
```

---

## 6. Official Documentation Directory (`docs/`)

- [AGENTS.md](file:///d:/MediFlow/AGENTS.md) — Master engineering rules and team role ownership matrix.
- [docs/PROJECT_SPEC.md](file:///d:/MediFlow/docs/PROJECT_SPEC.md) — Product requirements, personas, and feature boundaries.
- [docs/ARCHITECTURE.md](file:///d:/MediFlow/docs/ARCHITECTURE.md) — Architectural diagrams, topologies, and layer contracts.
- [docs/DATA_MODEL.md](file:///d:/MediFlow/docs/DATA_MODEL.md) — Canonical Mongoose schemas and entity relationships.
- [docs/API_CONTRACTS.md](file:///d:/MediFlow/docs/API_CONTRACTS.md) — Comprehensive REST API catalog and error specifications.
- [docs/TEAM_TASKS.md](file:///d:/MediFlow/docs/TEAM_TASKS.md) — Live 10-member task matrix and ownership assignments.
- [docs/PROJECT_STATUS.md](file:///d:/MediFlow/docs/PROJECT_STATUS.md) — Live integration status and release health.
- [docs/DECISIONS.md](file:///d:/MediFlow/docs/DECISIONS.md) — Architecture Decision Records (ADRs).
- [docs/HANDOFF_LOG.md](file:///d:/MediFlow/docs/HANDOFF_LOG.md) — Milestone handoff logs (Handoff 001, Handoff 002).
- [docs/PR_CHECKLIST.md](file:///d:/MediFlow/docs/PR_CHECKLIST.md) — Quality gates required for PR approval.
