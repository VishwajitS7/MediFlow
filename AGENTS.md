# AGENTS.md — Global Engineering Rules & Team Coordination

This document governs all AI coding agents and human engineers working on the **MediFlow** project.
MediFlow is a web-based Smart Clinic Management Platform engineered by a 10-member DevOps engineering team.

---

## 1. OFFICIAL TEAM ROLES (EXACT NAMES)

These role names are fixed across the entire lifecycle:
1. **Product Owner / Team Lead**
2. **Developer 1**
3. **Developer 2**
4. **Developer 3**
5. **QA Engineer**
6. **Git/GitHub Engineer**
7. **Jenkins Engineer**
8. **Docker Engineer**
9. **Kubernetes Engineer**
10. **DevOps/SRE Engineer**

---

## 2. SOURCE-OF-TRUTH ORDER

When resolving conflicting instructions or design choices:
1. Explicit, latest approved decision from the **Product Owner / Team Lead** (`docs/DECISIONS.md`).
2. Root `AGENTS.md` and approved project requirements (`docs/PROJECT_SPEC.md`).
3. Approved architecture (`docs/ARCHITECTURE.md`), data model (`docs/DATA_MODEL.md`), API contracts (`docs/API_CONTRACTS.md`), and task matrix (`docs/TEAM_TASKS.md`).
4. Actual merged implementation in `develop` and verified passing tests.
5. Assigned task instructions in `docs/TEAM_TASKS.md`.
6. Agent's own implementation preference.

---

## 3. CORE ARCHITECTURAL CONSTRAINTS

- **Framework**: Next.js (App Router, `src/app`).
- **Language**: TypeScript (`strict: true`). No loose types (`any` is prohibited).
- **Database**: MongoDB Atlas via Mongoose (`src/models/`, singleton in `src/lib/db/mongodb.ts`).
- **Authentication**: Auth.js / NextAuth (`src/lib/auth/`).
- **Validation**: Zod (`src/lib/validation/`).
- **Styling & UI**: Tailwind CSS v4, Lucide React, shadcn/ui patterns (`src/components/ui/`).
- **Testing**: Vitest (`tests/unit/`, `tests/integration/`).
- **CI/CD & DevOps**: Jenkinsfile, Dockerfile (multi-stage), Kubernetes manifests (`k8s/`).

**Strict Rule**: Never introduce duplicate Mongoose models, alternate databases (e.g. SQLite, PostgreSQL), competing styling frameworks, or secondary validation libraries.

---

## 4. TASK OWNERSHIP & FILE BOUNDARIES

Every change must correlate to an assigned task in `docs/TEAM_TASKS.md`.

### Protected Shared Resources (Requires PO Approval to modify):
- `package.json` and `package-lock.json`
- `src/lib/db/mongodb.ts` (Shared DB singleton)
- `src/models/*` (Canonical Mongoose domain models)
- `src/types/*` (Shared TypeScript contracts)
- `src/lib/auth/*` (Global Auth configuration)
- `src/app/layout.tsx` & `src/app/globals.css`
- `Dockerfile`, `Jenkinsfile`, `k8s/*`
- `docs/*` specifications and architecture documents

### Role Ownership Matrix:
- **Developer 1**: `src/lib/auth/`, `src/features/auth/`, `src/app/(auth)/`, `src/components/shared/nav*`
- **Developer 2**: `src/features/patients/`, `src/app/patients/`, `src/app/api/patients/`
- **Developer 3**: `src/features/appointments/`, `src/features/consultations/`, `src/features/prescriptions/`, `src/app/appointments/`, `src/app/api/appointments/`, `src/app/api/consultations/`, `src/app/api/prescriptions/`
- **QA Engineer**: `tests/`, test configs, test fixtures
- **Git/GitHub Engineer**: GitFlow docs, GitHub workflow configs, branch rules
- **Jenkins Engineer**: `Jenkinsfile`, CI scripts
- **Docker Engineer**: `Dockerfile`, `.dockerignore`, container configs
- **Kubernetes Engineer**: `k8s/` manifests
- **DevOps/SRE Engineer**: `src/app/api/health/`, monitoring, telemetry, operational runbooks
- **Product Owner / Team Lead**: Global architecture, integration review, PR approvals, release promotion

---

## 5. GIT & GITHUB PROTOCOL

- **`main`**: Production-ready, stable releases only. Never commit directly to `main`.
- **`develop`**: Central integration branch. All feature PRs target `develop`.
- **`feature/<task-id>-<short-description>`**: Feature development branches.
- **`fix/<task-id>-<short-description>`**: Bug fix branches.
- **`release/<version>`**: Release staging branches.

### Commit Rules:
- Commit messages follow Conventional Commits: `feat(scope): ...`, `fix(scope): ...`, `test(scope): ...`, `docs(scope): ...`, `chore(scope): ...`.
- No force pushes. No committing secrets or `.env` files.
- PRs must pass `npm run lint`, `npm run typecheck`, and `npm test` before review.

---

## 6. DATA SECURITY & PATIENT DATA INTEGRITY

- Use **synthetic data only** for development, fixtures, and demonstrations.
- Never commit real patient medical history, phone numbers, or credentials.
- All endpoints handling clinical or patient data require server-side authorization and RBAC verification.
- Passwords must be hashed using bcrypt/argon2.
- Environment variables containing secrets (`MONGODB_URI`, `NEXTAUTH_SECRET`) must never be leaked to client components.

---

## 7. AGENT EXECUTION & REPORTING FORMAT

Before writing code:
1. Report assigned role and Task ID.
2. Report branch and working tree status.
3. Review relevant documentation.
4. Provide concise step-by-step implementation plan.

After completing work:
1. Report Task ID and status (`READY FOR REVIEW`).
2. Summary of changes made and files created/modified.
3. Actual test/build commands run with terminal outputs.
4. Suggested PR title and description.
5. Update `docs/PROJECT_STATUS.md` and `docs/HANDOFF_LOG.md`.
