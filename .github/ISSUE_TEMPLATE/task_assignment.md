---
name: "Team Task Assignment"
about: "Allocate and track an official task for one of the 10 DevOps team roles"
title: "[TASK-ROLE-XX]: "
labels: ["task", "sprint"]
assignees: []
---

### 1. Task Metadata
- **Task ID**: `TASK-<ROLE>-<NN>`
- **Assigned Role**: <!-- e.g. Developer 2, QA Engineer, Jenkins Engineer -->
- **Integration Target**: `develop`
- **Dependencies**: <!-- List predecessor tasks or None -->

### 2. Task Scope & Objectives
<!-- Describe the specific deliverable and implementation scope -->

### 3. Owned File Boundaries
<!-- List the specific files this task has permission to create or modify -->
- 

### 4. Definition of Done
- [ ] Code implemented strictly within assigned file boundaries.
- [ ] No unapproved modifications to protected shared files.
- [ ] `npm run lint` passes (0 errors, 0 warnings).
- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm test` passes 100% of unit/integration tests.
- [ ] `npm run build` compiles successfully.
- [ ] Pull request created using `.github/pull_request_template.md`.
- [ ] `docs/PROJECT_STATUS.md` and `docs/HANDOFF_LOG.md` updated.
