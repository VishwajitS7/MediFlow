# MediFlow — Technical Architecture & Engineering Standards

**Document Version:** 1.0.0  
**Status:** Approved Baseline  
**Integration Owner:** Product Owner / Team Lead  

---

## 1. System Overview & Architectural Topology

MediFlow is architected as a modular, monolithic Next.js application utilizing the App Router architecture, backed by a persistent MongoDB Atlas database cluster and containerized with Docker for deployment onto Kubernetes.

```mermaid
graph TD
    Client[Web Browser / Client UI] -->|HTTPS Requests| NextServer[Next.js App Server (Node.js 22)]
    
    subgraph "Next.js App Server Boundary"
        NextServer --> Middleware[Edge/Route Middleware (Auth & Session Verification)]
        Middleware --> Router[App Router (/app)]
        
        Router --> UI_Pages[Server & Client UI Pages (/src/app)]
        Router --> API_Routes[Route Handlers (/src/app/api)]
        
        API_Routes --> ZodValidation[Zod Request Validation (/src/lib/validation)]
        API_Routes --> AuthService[Auth.js Session & RBAC (/src/lib/auth)]
        API_Routes --> BusinessLogic[Domain Features (/src/features)]
        
        BusinessLogic --> MongooseLayer[Mongoose Models (/src/models)]
        MongooseLayer --> MongoSingleton[DB Connection Pool (/src/lib/db/mongodb.ts)]
    end
    
    MongoSingleton -->|Mongoose ODM| MongoAtlas[(MongoDB Atlas Cluster)]
    
    subgraph "DevOps Lifecycle"
        NextServer -.-> HealthCheck[/api/health]
        HealthCheck -.-> K8sProbes[K8s Liveness & Readiness Probes]
    end
```

---

## 2. Directory Layout & Module Ownership

The repository is organized cleanly by concerns, strictly separating shared infrastructure from domain features:

```text
mediflow/
├── AGENTS.md                  # Global engineering rules & team protocol
├── README.md                  # Developer onboarding & build instructions
├── .env.example               # Canonical environment template (no secrets!)
├── .gitignore                 # Tracked ignores with .env.example exception
├── package.json               # Root dependencies and npm lifecycle scripts
├── tsconfig.json              # TypeScript strict configuration
├── docs/                      # Central repository memory and persistent truth
│   ├── MASTER_AGENT_PROMPT.md # Verbatim master team prompt
│   ├── PROJECT_SPEC.md        # Canonical requirements and scope
│   ├── ARCHITECTURE.md        # Technical architecture (this document)
│   ├── DATA_MODEL.md          # Canonical Mongoose schemas and entity rules
│   ├── API_CONTRACTS.md       # Canonical HTTP endpoints and schemas
│   ├── TEAM_TASKS.md          # 10-member task breakdown and ownership
│   ├── PROJECT_STATUS.md      # Live branch status and blockers
│   ├── DECISIONS.md           # Architecture Decision Records (ADRs)
│   ├── HANDOFF_LOG.md         # Structured milestone handoffs
│   └── PR_CHECKLIST.md        # Quality gates for pull requests
├── src/
│   ├── app/                   # Next.js App Router (pages and route handlers)
│   │   ├── (auth)/            # Auth routes (login, register)
│   │   ├── (dashboard)/       # Role-protected clinic workspace
│   │   ├── api/               # Server-side API Route Handlers
│   │   │   ├── auth/          # Auth.js route handlers
│   │   │   ├── patients/      # Patient REST APIs
│   │   │   ├── appointments/  # Appointment REST APIs
│   │   │   ├── consultations/ # Clinical consultation REST APIs
│   │   │   ├── prescriptions/ # Prescription REST APIs
│   │   │   └── health/        # SRE health & readiness probe API
│   │   ├── globals.css        # Tailwind CSS styles
│   │   └── layout.tsx         # Root layout with fonts and metadata
│   ├── components/            # Reusable UI component library
│   │   ├── ui/                # Base primitives (Button, Input, Card, Badge, Table)
│   │   └── shared/            # Shared navigation, sidebar, headers
│   ├── features/              # Modular domain feature logic & components
│   │   ├── auth/              # Dev 1: Login forms, role gates
│   │   ├── patients/          # Dev 2: Patient forms, list, search
│   │   ├── appointments/      # Dev 3: Booking modal, calendar views
│   │   ├── consultations/     # Dev 3: Vitals intake, clinical notes
│   │   └── prescriptions/     # Dev 3: Prescription composer
│   ├── lib/                   # Shared foundational utilities
│   │   ├── auth/              # Auth.js configuration & RBAC guards
│   │   ├── db/                # mongodb.ts connection manager
│   │   ├── validation/        # Shared Zod schemas
│   │   └── utils.ts           # Shared UI helpers (cn / clsx / twMerge)
│   ├── models/                # Authoritative Mongoose models (User, Patient, etc.)
│   └── types/                 # Shared TypeScript interfaces & types
├── tests/
│   ├── unit/                  # Vitest unit test suites
│   ├── integration/           # API integration tests
│   └── fixtures/              # Synthetic test fixtures
├── Dockerfile                 # Multi-stage container build
├── Jenkinsfile                # Declarative CI/CD pipeline
└── k8s/                       # Kubernetes deployment manifests
```

---

## 3. Layer Boundaries & Responsibilities

### 3.1 Presentation Layer (`src/app/`, `src/components/`)
- Pure React 19 components using Tailwind CSS and Lucide React icons.
- Server Components by default for fast rendering and data hydration.
- Client Components (`"use client"`) only where interactive state or event listeners are required.
- **Rule**: Client components must never import server-only utilities (`mongoose`, secrets, server actions containing DB queries).

### 3.2 API Layer (`src/app/api/`)
- All endpoints are Next.js Route Handlers (`GET`, `POST`, `PUT`, `DELETE`).
- Every mutation endpoint must execute server-side Zod validation on incoming request bodies.
- Standardized JSON responses using `ApiResponse<T>`:
  ```typescript
  {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: unknown;
    };
    timestamp: string;
  }
  ```

### 3.3 Data Layer (`src/models/`, `src/lib/db/mongodb.ts`)
- Mongoose singleton connection ensures that serverless hot-reloads and containerized replicas reuse active database pools without exhausting MongoDB connections.
- Mongoose models are strictly consolidated inside `src/models/`. Feature-specific folders must never define redundant Mongoose schemas.

---

## 4. Authentication & RBAC Design

- **Provider**: Credentials provider managed through Auth.js / NextAuth.
- **Session Strategy**: Signed JWT containing `{ id, email, name, role }`.
- **Role Hierarchy**:
  - `ADMIN`: Has all privileges.
  - `DOCTOR`: Access to clinical notes, appointments, patient history, prescriptions.
  - `RECEPTIONIST`: Access to patient records and appointment booking.
  - `PATIENT`: Access to own appointments and prescriptions.
- **Server Guard Pattern**:
  ```typescript
  import { requireRole } from "@/lib/auth/rbac";
  // Throws 401/403 if session is invalid or role does not match
  await requireRole(req, ["DOCTOR", "ADMIN"]);
  ```

---

## 5. Security & Error Handling Guarantees

1. **No Client Leaks**: Sensitive credentials (`MONGODB_URI`, `NEXTAUTH_SECRET`) are never prefixed with `NEXT_PUBLIC_`.
2. **Input Sanitization**: All incoming inputs are validated with Zod before being passed to MongoDB queries.
3. **Structured Errors**: Uncaught exceptions are captured and returned as standardized HTTP 500 error envelopes without exposing internal stack traces.
