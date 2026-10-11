## 📋 MediFlow Pull Request Overview

### 1. Task Attribution & Role Metadata
- **Task ID**: `TASK-<ROLE>-<NN>` <!-- e.g. TASK-DEV2-01, TASK-GIT-01 -->
- **Assigned Role**: <!-- e.g. Developer 2, Git/GitHub Engineer, QA Engineer -->
- **Working Branch**: <!-- e.g. feature/TASK-DEV2-01-patient-management -->
- **Target Integration Branch**: `develop` <!-- All feature PRs MUST target develop -->
- **Closes Issue(s)**: Fixes #<!-- Issue number if applicable -->

---

### 2. Summary of Changes
<!-- Provide a high-level summary of what this PR introduces and the architectural rationale. -->
- 

---

### 3. Owned File Boundaries & Impact Assessment
- [ ] **Role File Boundaries Respected**: All modifications are strictly within the assigned role scope as defined in `AGENTS.md` and `docs/TEAM_TASKS.md`.
- [ ] **Protected Shared Resources**: Did this PR modify `package.json`, `src/lib/db/mongodb.ts`, `src/types/index.ts`, `src/app/layout.tsx`, or `docs/*`?
  - If YES, confirm Product Owner approval has been granted: `[ ] Approved by PO`

**Files Created / Modified**:
<!-- List key files added or updated in this PR -->
- 

---

### 4. Mandatory Verification Checklist (Pre-Merge Quality Gates)
All commands must be executed locally and pass with zero errors before requesting review:

- [ ] **Lint Check**: `npm run lint` passes with 0 errors and 0 warnings.
- [ ] **Type Check**: `npm run typecheck` (`tsc --noEmit`) passes with clean exit code 0.
- [ ] **Unit & Integration Tests**: `npm test` (`vitest run`) passes 100% of tests.
- [ ] **Production Build**: `npm run build` succeeds without compilation failures.

**Paste Terminal Test Outputs below**:
```text
<!-- Paste outputs of npm test and npm run build here -->
```

---

### 5. Patient Data Integrity & Security Standards
- [ ] **Synthetic Data Only**: Confirmed NO real patient medical history, real phone numbers, or production credentials are included.
- [ ] **Secrets & Environment Variables**: No `.env`, passwords, or API tokens committed.
- [ ] **Server-Side Authorization**: Endpoints handling patient/clinical data strictly enforce server-side RBAC guards via `requireAuth()` or `requireRole()`.
- [ ] **Input Validation**: All inbound payload parameters are strictly validated with Zod schemas.

---

### 6. Review & Approvals
- [ ] **Code Owner Review**: Reviewed and approved by assigned CODEOWNER.
- [ ] **Product Owner / Team Lead Approval**: Required for merging into `develop` or `main`.
