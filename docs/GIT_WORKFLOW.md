# MediFlow — Engineering GitFlow Standards & GitHub Collaboration Guide

**Document Version:** 1.0.0  
**Integration Role Owner:** Git/GitHub Engineer (`TASK-GIT-01`)  
**Target Release:** v0.1.0-alpha  
**Governing Authority:** `AGENTS.md` & `docs/TEAM_TASKS.md`

---

## 1. Overview & Team Structure

MediFlow is built and maintained by a 10-member DevOps engineering team. To enable parallel development without collision, all team members must adhere to this unified GitFlow standard, branch naming convention, commit format, and pull request protocol.

### 10-Member Engineering Roles & Task Identifiers
| Role # | Official Role Name | Task Identifier Prefix | Primary Repository Boundary |
|---|---|---|---|
| 1 | **Product Owner / Team Lead** | `TASK-PO-` | Repository architecture, governance, approvals, release promotion |
| 2 | **Developer 1** | `TASK-DEV1-` | Authentication, user modeling, RBAC, shell navigation |
| 3 | **Developer 2** | `TASK-DEV2-` | Patient intake, directory, search, medical profiles |
| 4 | **Developer 3** | `TASK-DEV3-` | Appointments, clinical notes, electronic prescriptions |
| 5 | **QA Engineer** | `TASK-QA-` | Unit/integration testing, Vitest fixtures, validation strategy |
| 6 | **Git/GitHub Engineer** | `TASK-GIT-` | GitFlow, branching rules, PR templates, code ownership, CI workflows |
| 7 | **Jenkins Engineer** | `TASK-CI-` | Declarative Jenkins pipelines, multi-stage CI automation |
| 8 | **Docker Engineer** | `TASK-DOCKER-` | Multi-stage Dockerfile, image hardening, layer optimization |
| 9 | **Kubernetes Engineer** | `TASK-K8S-` | K8s deployments, services, probes, config maps, ingress |
| 10 | **DevOps/SRE Engineer** | `TASK-SRE-` | System telemetry, health probes, failure recovery runbooks |

---

## 2. GitFlow Branching Model

MediFlow adopts a structured **GitFlow** branching strategy designed for clinical reliability and strict compliance.

```
[main] ──────────────────────────● (v0.1.0 Release) ─────────────● (v0.1.1 Hotfix)
  │                              ▲                                 ▲
  │                              │ Merge Release                   │
[release/v0.1.0]                 │                                 │
  │                              │                                 │
[develop] ───────●───────────────●─────────────────●───────────────┘ (Backport hotfix)
  │              ▲                                 ▲
  │ Fork feature │ PR Squash                       │ PR Squash
  ▼              │                                 │
[feature/TASK-DEV2-01-patient-management]          ▼
                                     [feature/TASK-QA-01-test-suite]
```

### 2.1 Branch Classification

1. **`main` (Production Release Branch)**:
   - Contains hardened, production-ready releases only.
   - Every commit on `main` is tagged with a Semantic Version (e.g. `v0.1.0`).
   - **Direct commits and force-pushes are strictly prohibited.**
   - Changes arrive strictly via Pull Requests from `release/*` or `hotfix/*` branches.

2. **`develop` (Integration Trunk)**:
   - The primary integration branch where all verified features converge.
   - Nightly builds and staging deployments run from `develop`.
   - Feature branches branch off from `develop` and must be merged back into `develop`.
   - **Direct commits and force-pushes are strictly prohibited.**

3. **`feature/<task-id>-<short-description>`**:
   - Dedicated branch for an assigned team task.
   - Example: `feature/TASK-DEV2-01-patient-management`.
   - Lifetime: Transient. Deleted immediately after merging into `develop`.

4. **`fix/<task-id>-<short-description>`**:
   - Dedicated branch for resolving bugs found during integration testing on `develop`.
   - Example: `fix/TASK-QA-01-auth-mock-leak`.

5. **`release/v<MAJOR>.<MINOR>.<PATCH>`**:
   - Cut from `develop` when all sprint deliverables are integrated and freeze is called.
   - Used for release candidate stabilization, changelog updates, and version tagging.
   - Merged into `main` (for production release) and back-merged into `develop`.

6. **`hotfix/v<MAJOR>.<MINOR>.<PATCH>`**:
   - Emergency patches branched directly from `main`.
   - Merged into `main` (with patch tag) and back-ported into `develop`.

---

## 3. Strict Branch Naming Standards

Every branch must strictly match the following naming convention:

```
<type>/<TASK-ID>-<kebab-case-description>
```

### Valid Prefixes:
- `feature/` : New feature implementation from `TEAM_TASKS.md`
- `fix/` : Defect remediation on `develop`
- `release/` : Scheduled release milestone staging
- `hotfix/` : Critical emergency production bugfix
- `chore/` : Tooling or dependency maintenance (PO approval required)

### Examples:
- ✅ `feature/TASK-GIT-01-gitflow-standards`
- ✅ `feature/TASK-DEV2-01-patient-management`
- ✅ `feature/TASK-DOCKER-01-dockerfile`
- ❌ `dev-patient-search` (Missing task ID prefix)
- ❌ `suryadeep/my-changes` (Personal names prohibited in branch names)
- ❌ `feature/patient_fix` (Snake case prohibited; must use kebab-case)

---

## 4. Conventional Commits Specification

MediFlow enforces the **Conventional Commits 1.0.0** standard for clear audit trails and automated changelog generation.

### 4.1 Commit Message Structure

```
<type>(<scope>): <short imperative description> [#TASK-ID]

[optional longer body detailing context and architectural rationale]

[optional footer with breaking change notes or closed issues]
```

### 4.2 Allowed Types:
- `feat`: A new feature for the application (e.g., patient search, auth guard).
- `fix`: A bug fix.
- `docs`: Documentation-only changes (e.g., updating `GIT_WORKFLOW.md`, `README.md`).
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Changes to build tools, dependencies, or repository configuration.
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `perf`: A code change that improves performance.
- `ci`: Changes to CI/CD configuration files (GitHub Actions, Jenkinsfile).

### 4.3 Scopes:
- `auth`: Authentication and RBAC
- `patient`: Patient registration and directory
- `appointment`: Scheduling and calendar
- `clinical`: Consultations and prescriptions
- `db`: Mongoose and database connection pool
- `git`: GitFlow, templates, workflows
- `docker`: Containerization and Dockerfile
- `k8s`: Kubernetes manifests
- `sre`: Observability and health monitoring

### 4.4 Commit Message Examples:
```text
feat(patient): implement fuzzy search and pagination endpoint [TASK-DEV2-01]
fix(auth): prevent timing attack on bcrypt credential verification [TASK-DEV1-01]
docs(git): publish canonical gitflow standards and branch protection [TASK-GIT-01]
ci(actions): add pull request verification workflow for lint and tests [TASK-GIT-01]
```

---

## 5. Pull Request (PR) Lifecycle & Quality Gates

Every code change must pass through a strict Pull Request review process before merging into `develop` or `main`.

```
1. Local Work in Feature Branch
       │
       ▼
2. Local Verification Gate (Zero errors)
   - npm run lint
   - npm run typecheck
   - npm test
   - npm run build
       │
       ▼
3. Push Branch & Open PR targeting 'develop'
       │
       ▼
4. Automated GitHub Actions CI Checks (`pr-integrity.yml`)
       │
       ▼
5. Peer Review (At least 1 review from designated CODEOWNERS)
       │
       ▼
6. Product Owner / Team Lead Sign-Off
       │
       ▼
7. Squash & Merge into `develop`
```

### 5.1 Pre-PR Local Checklist (Mandatory)
Before pushing and creating a PR, the author **must run and verify**:
1. `npm run lint` — Zero ESLint errors or warnings.
2. `npm run typecheck` — `tsc --noEmit` must exit with code 0.
3. `npm test` — Vitest unit & integration suite must pass 100%.
4. `npm run build` — Turbopack / Next.js production build must compile cleanly.

### 5.2 Pull Request Submission Rules
- **Title**: Must adhere to Conventional Commits (e.g. `feat(patient): add patient registration [TASK-DEV2-01]`).
- **Template**: Must use the standardized `.github/pull_request_template.md` without removing required sections.
- **Target Branch**: Must be `develop` (Never target `main` directly for features).
- **Scope**: Keep PRs focused exclusively on the assigned role's owned files.

---

## 6. GitHub Branch Protection Policy

The repository administrators must configure the following branch protection settings in GitHub:

### 6.1 Protection Rules for `main`
- **Require a pull request before merging**: Enabled.
- **Require approvals**: Minimum 2 approvals (including Product Owner / Team Lead).
- **Dismiss stale pull request approvals when new commits are pushed**: Enabled.
- **Require review from Code Owners**: Enabled (via `.github/CODEOWNERS`).
- **Require status checks to pass before merging**:
  - `PR Integrity / lint-typecheck-test` (GitHub Actions)
  - `Jenkins CI / build-and-verify` (Jenkins pipeline)
- **Require branches to be up to date before merging**: Enabled.
- **Require linear history**: Enabled.
- **Do not allow bypassing the above settings**: Enabled.
- **Restrict deletions**: Enabled.
- **Block force pushes**: Enabled for all roles.

### 6.2 Protection Rules for `develop`
- **Require a pull request before merging**: Enabled.
- **Require approvals**: Minimum 1 peer review + Product Owner / Team Lead signoff.
- **Dismiss stale pull request approvals when new commits are pushed**: Enabled.
- **Require review from Code Owners**: Enabled.
- **Require status checks to pass**: `PR Integrity / lint-typecheck-test`.
- **Require branches to be up to date before merging**: Enabled.
- **Block force pushes**: Enabled for all roles.

---

## 7. Merge Strategy & History Hygiene

To preserve a clean, bisectable, and readable commit history, MediFlow enforces distinct merge strategies depending on branch hierarchy:

| Source Branch | Target Branch | Enforced Strategy | Rationale |
|---|---|---|---|
| `feature/*` | `develop` | **Squash and Merge** | Combines iterative commits into a single atomic feature commit on `develop`. |
| `fix/*` | `develop` | **Squash and Merge** | Preserves atomic defect resolution on trunk. |
| `release/*` | `main` | **Create a Merge Commit** | Retains release milestone provenance and release branch metadata. |
| `release/*` | `develop` | **Create a Merge Commit** | Syncs version updates and release stabilization fixes back to trunk. |
| `hotfix/*` | `main` & `develop` | **Create a Merge Commit** | Records emergency patch origin and dual-integration trace. |

---

## 8. Merge Conflict Resolution Protocol

When `develop` advances while a team member is working on a feature branch, merge conflicts must be resolved using **Rebase** locally before updating the PR:

### Step-by-Step Rebase Guide:
```bash
# 1. Fetch latest updates from remote develop
git fetch origin develop

# 2. Rebase feature branch on top of origin/develop
git rebase origin/develop

# 3. If conflicts occur:
# Inspect conflicted files
git status

# Edit conflicted files to resolve markers (<<<<<<<, =======, >>>>>>>)
# Stage resolved files
git add <path/to/resolved-file>

# Continue rebase process
git rebase --continue

# 4. Verify test suite passes after resolution
npm run lint
npm run typecheck
npm test

# 5. Push safely with force-with-lease (ONLY on personal feature branch)
git push --force-with-lease origin <feature-branch-name>
```

> [!CAUTION]
> Never run `git push --force` or `--force-with-lease` on `develop` or `main`. Force-push is strictly restricted to individual feature branches that have not been merged.

---

## 9. Protected Resources & Cross-Role Modification Rules

Certain core infrastructure files are classified as **Protected Shared Resources**. Modifying these files requires explicit Product Owner approval:

- `package.json` & `package-lock.json`
- `src/lib/db/mongodb.ts` (Database connection pool)
- `src/types/index.ts` (Core TypeScript domain models)
- `src/app/layout.tsx` & `src/app/globals.css`
- `Jenkinsfile`, `Dockerfile`, `k8s/*`
- `docs/*` specifications

If an engineer requires changes to a protected resource outside their assigned boundary, they must request a schema revision or task assignment update through the Product Owner.

---

## 10. Release Tagging & Semantic Versioning

Releases on `main` must adhere to **Semantic Versioning 2.0.0** (`vMAJOR.MINOR.PATCH`):
- **MAJOR**: Incompatible API breaking changes.
- **MINOR**: Backward-compatible new clinical feature additions.
- **PATCH**: Backward-compatible bug fixes and security remediations.

### Tag Creation Command:
```bash
git checkout main
git pull origin main
git tag -a v0.1.0 -m "Release v0.1.0: Baseline platform, Auth.js RBAC, GitFlow standards"
git push origin v0.1.0
```
