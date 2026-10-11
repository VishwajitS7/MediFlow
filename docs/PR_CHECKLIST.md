# MediFlow — Pull Request Review Checklist & Quality Gates

**Document Version:** 1.0.0  
**Integration Owner:** Product Owner / Team Lead  

Every pull request in MediFlow must be vetted against this checklist prior to approval and merging into `develop`.

---

## 1. Author Pre-Submission Verification

Before opening or submitting a PR, the author must confirm that:

- [ ] **Branch Target**: PR targets `develop` (not `main`).
- [ ] **Branch Naming**: Branch follows convention: `feature/<task-id>-<description>` or `fix/<task-id>-<description>`.
- [ ] **Task Correlation**: A corresponding task exists in `docs/TEAM_TASKS.md` matching the PR's task ID.
- [ ] **No Unrelated Files**: `git status` / `git diff` shows only files within the author's assigned scope.
- [ ] **No Secrets**: No API keys, passwords, connection strings, or `.env` files are committed.
- [ ] **Typecheck Passes**: `npm run typecheck` passes with zero errors.
- [ ] **Linter Passes**: `npm run lint` passes with zero errors or warnings.
- [ ] **Tests Pass**: `npm test` runs and all unit/integration tests pass.
- [ ] **Build Passes**: `npm run build` succeeds without build errors.

---

## 2. Architectural & Code Quality Review

The reviewer (Product Owner / Team Lead) will check:

- [ ] **Single Source of Truth**: Does the change use approved canonical models (`src/models/`) and shared types (`src/types/`)?
- [ ] **No Duplicate Abstractions**: Did the author avoid duplicate database connection logic, auth handlers, or helper functions?
- [ ] **Layer Boundaries**: Are server-side operations (database queries, secrets) strictly isolated from client components?
- [ ] **Zod Input Validation**: Do all API mutation endpoints validate input payloads using Zod schemas before database writes?
- [ ] **RBAC Authorization**: Is server-side authorization enforced on protected routes using the approved RBAC roles?
- [ ] **Error Handling**: Do API routes return the canonical `ApiResponse<T>` envelope with appropriate HTTP status codes?

---

## 3. Security & Data Integrity Review

- [ ] **Synthetic Data Only**: All fixtures, tests, and mock data use synthetic records (no real patient or personal info).
- [ ] **Password Security**: Passwords are never stored in plaintext and never returned in API responses.
- [ ] **SQL/NoSQL Injection**: Database queries use parameterized Mongoose methods rather than unsanitized raw inputs.

---

## 4. Documentation & Handoff Updates

- [ ] **Handoff Log**: Entry added in `docs/HANDOFF_LOG.md` with execution evidence and next owner.
- [ ] **Task Status**: `docs/TEAM_TASKS.md` updated to reflect the current state (`READY FOR REVIEW`).
- [ ] **Project Status**: `docs/PROJECT_STATUS.md` updated if this change alters integration status or unblocks dependencies.

---

## 5. Merge Authority

- Only the **Product Owner / Team Lead** possesses merge authority into `develop` or `main`.
- Self-merging by feature developers or AI agents is strictly prohibited.
- Fast-forward or squash-and-merge with descriptive commit message referencing the Task ID is required.
