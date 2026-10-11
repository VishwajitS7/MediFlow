# MediFlow — Architecture Decision Records (ADRs)

**Document Version:** 1.0.0  
**Integration Owner:** Product Owner / Team Lead  

---

### ADR-001: Next.js App Router with TypeScript Strict Mode
- **Date**: 2026-10-11
- **Status**: Approved
- **Owner**: Product Owner / Team Lead
- **Context**: The team requires a modern full-stack web framework that combines server-side rendering, streaming UI, API route handlers, and unified TypeScript types.
- **Decision**: Adopt Next.js 16 with the App Router (`src/app`) and enable `"strict": true` in `tsconfig.json`.
- **Alternatives Considered**: Vite + Express SPA (rejected due to fragmented repositories and lack of unified type sharing), Remix/React Router v7 (rejected due to team familiarity and extensive ecosystem support for Next.js).
- **Consequences**: Fast server-side rendering, simplified API routing in `src/app/api`, strict typing with no `any` permitted.

---

### ADR-002: MongoDB Atlas with Mongoose ODM Singleton Connection
- **Date**: 2026-10-11
- **Status**: Approved
- **Owner**: Product Owner / Team Lead
- **Context**: Outpatient clinical records, vitals arrays, and prescription data require flexible document structures while retaining strict schema validation and referential links.
- **Decision**: Adopt MongoDB Atlas using Mongoose ODM with a cached global singleton connection (`src/lib/db/mongodb.ts`).
- **Alternatives Considered**: PostgreSQL with Prisma (rejected per canonical team stack constraints), Raw MongoDB native driver (rejected due to lack of declarative schema enforcement).
- **Consequences**: Reusable database connection pool across serverless route invocations and Docker container replicas; models consolidated strictly in `src/models/`.

---

### ADR-003: Auth.js (NextAuth) for JWT Session & Role-Based Access Control
- **Date**: 2026-10-11
- **Status**: Approved
- **Owner**: Product Owner / Team Lead
- **Context**: MediFlow supports four distinct roles (`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`) requiring secure session state across server and client components.
- **Decision**: Use Auth.js with credentials authentication and signed JWT cookies storing `{ id, email, role }`.
- **Alternatives Considered**: Custom roll-your-own JWT cookies (rejected due to security risks and CSRF vulnerabilities), Firebase Auth (rejected per approved stack constraints).
- **Consequences**: Standardized session inspection on server and client; route-level RBAC verification enforced at the server boundary.

---

### ADR-004: Zod for Server-Side Request Validation
- **Date**: 2026-10-11
- **Status**: Approved
- **Owner**: Product Owner / Team Lead
- **Context**: Clinical data inputs (patient demographics, vitals, prescriptions) must be strictly validated before touching the database.
- **Decision**: Use Zod schemas located in `src/lib/validation/` as the single validation standard for both API request bodies and frontend form parsing.
- **Alternatives Considered**: Yup, Joi, class-validator (rejected to maintain one single canonical validation library across the project).
- **Consequences**: End-to-end type inference from validation schemas to TypeScript interfaces.

---

### ADR-005: Vitest for Automated Unit & Integration Testing
- **Date**: 2026-10-11
- **Status**: Approved
- **Owner**: Product Owner / Team Lead
- **Context**: Fast, native TypeScript testing is essential for both local developer feedback and CI/CD pipeline execution.
- **Decision**: Use Vitest with `npm test` script mapped to `vitest run`.
- **Alternatives Considered**: Jest (rejected due to heavier configuration and slower transpilation times with ESM and TypeScript).
- **Consequences**: Instant execution times and native TypeScript execution out of the box.

---

### ADR-006: Controlled GitFlow Branching Model
- **Date**: 2026-10-11
- **Status**: Approved
- **Owner**: Product Owner / Team Lead & Git/GitHub Engineer
- **Context**: A 10-member engineering team with concurrent workflows needs clean branch isolation and zero merge collisions.
- **Decision**: Adopt GitFlow: `main` for release tags, `develop` for active integration, and `feature/<task-id>-<description>` for feature branches. All PRs target `develop`. Merging requires Product Owner / Team Lead review and passing CI checks.
- **Alternatives Considered**: Trunk-based development directly on main (rejected due to high collision risk with 10 parallel AI/human agents).
- **Consequences**: Predictable code reviews, clean audit trail, isolated regressions.
