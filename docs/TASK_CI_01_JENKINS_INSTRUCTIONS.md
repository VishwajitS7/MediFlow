# MEDIFLOW — MASTER HANDOFF GUIDE: JENKINS ENGINEER (`TASK-CI-01`)

> **Notice to Jenkins Engineer**: You are role **#7 (Jenkins Engineer)** in our 10-member DevOps engineering team working on **MediFlow** (Smart Clinic Management Platform). Follow this exact specification to implement your deliverables cleanly without breaking team boundaries.

---

## 1. Project Context & Current Milestone Status

MediFlow is a modern Next.js 16 (App Router), React 19, TypeScript strict mode, MongoDB Atlas, and Auth.js healthcare platform.

Before you, the following milestones have been integrated and merged into branch `develop`:
1. **TASK-PO-01 (Product Owner / Team Lead)**: Repository architecture, documentation suite, Mongoose connection pool, and baseline scaffold (**MERGED**).
2. **TASK-DEV1-01 (Developer 1)**: Authentication engine, `User` model, bcrypt password hashing, server-side RBAC guards, and role-aware navigation bar (**MERGED**).
3. **TASK-GIT-01 (Git/GitHub Engineer)**: Canonical GitFlow branching standards (`docs/GIT_WORKFLOW.md`), PR template (`.github/pull_request_template.md`), CODEOWNERS matrix, and automated GitHub Actions verification (**MERGED**).

Your task, **`TASK-CI-01`**, is **UNBLOCKED** and ready to execute.

---

## 2. Your Assigned Role, Boundaries & Task Metadata

* **Assigned Role**: **Jenkins Engineer**
* **Task ID**: `TASK-CI-01`
* **Task Title**: Declarative Jenkins CI Pipeline & Automation Guide
* **Base Branch to Branch From**: `develop`
* **Your Feature Branch Name**: `feature/TASK-CI-01-jenkins-pipeline`
* **Target Integration Branch for PR**: `develop`

### 2.1 Owned File Boundaries (Files You Create / Modify)
You have permission to create and modify **ONLY** these files:
- `Jenkinsfile` (Root directory)
- `docs/JENKINS_SETUP.md` (Documentation directory)
- `docs/PROJECT_STATUS.md` & `docs/HANDOFF_LOG.md` (To append your handoff log after completion)

### 2.2 Protected Shared Files (DO NOT MODIFY)
Do **NOT** touch:
- `package.json` or `package-lock.json`
- `src/lib/db/mongodb.ts`
- `src/models/*`
- `src/types/*`
- `src/lib/auth/*`
- `src/app/layout.tsx`

---

## 3. Git Step-by-Step Instructions

Clone the repository and create your assigned feature branch:

```bash
# 1. Ensure you are on the develop branch and pull the latest code
git checkout develop
git pull origin develop

# 2. Create your dedicated feature branch
git checkout -b feature/TASK-CI-01-jenkins-pipeline
```

---

## 4. Deliverable 1: Declarative Pipeline (`Jenkinsfile`)

Create a file named `Jenkinsfile` in the **root directory** of the repository:

```groovy
pipeline {
    agent any

    tools {
        // Must match the NodeJS tool name configured in Jenkins Global Tools
        nodejs 'NodeJS-20'
    }

    environment {
        CI = 'true'
        NODE_ENV = 'test'
        NEXTAUTH_SECRET = 'jenkins-ci-pipeline-mock-secret-key-32-chars!'
        NEXTAUTH_URL = 'http://localhost:3000'
        MONGODB_URI = 'mongodb://localhost:27017/mediflow-ci'
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo '=== Stage 1: Checking out repository code ==='
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '=== Stage 2: Installing npm dependencies with clean state ==='
                // For Windows agents use bat, for Linux/Unix use sh
                bat 'npm ci'
            }
        }

        stage('Code Quality (Lint)') {
            steps {
                echo '=== Stage 3: Running ESLint code verification ==='
                bat 'npm run lint'
            }
        }

        stage('Strict Typecheck') {
            steps {
                echo '=== Stage 4: Verifying TypeScript compiler types ==='
                bat 'npm run typecheck'
            }
        }

        stage('Unit & Integration Tests') {
            steps {
                echo '=== Stage 5: Executing Vitest test suite ==='
                bat 'npm test'
            }
        }

        stage('Production Build') {
            steps {
                echo '=== Stage 6: Compiling Next.js Turbopack production bundle ==='
                bat 'npm run build'
            }
        }

        stage('Docker Artifact Verification') {
            when {
                expression { return fileExists('Dockerfile') }
            }
            steps {
                echo '=== Stage 7: Dockerfile detected, verifying container build ==='
                bat 'docker build -t mediflow:ci-${BUILD_NUMBER} .'
            }
        }
    }

    post {
        always {
            echo '=== Pipeline Execution Completed ==='
            cleanWs()
        }
        success {
            echo '✅ Pipeline execution and quality gates PASSED successfully!'
        }
        failure {
            echo '❌ Pipeline execution FAILED! Review stage logs above.'
        }
    }
}
```

> **Note on OS Compatibility**: If your Jenkins worker is running on **Linux / macOS**, replace `bat` with `sh`. If your agent is running on **Windows**, keep `bat`.

---

## 5. Deliverable 2: Jenkins Setup Manual (`docs/JENKINS_SETUP.md`)

Create `docs/JENKINS_SETUP.md` with full setup and operational instructions:

```markdown
# MediFlow — Jenkins CI Server Setup & Pipeline Manual

**Role Owner**: Jenkins Engineer (`TASK-CI-01`)  
**Target Integration Branch**: `develop`  
**Governing Standard**: `docs/GIT_WORKFLOW.md` & `AGENTS.md`

---

## 1. Prerequisites
- Jenkins 2.400+ installed (Docker container or Bare-metal host).
- Recommended Plugins to install via **Manage Jenkins ➔ Plugins**:
  - **NodeJS Plugin** (for dynamic Node.js version management)
  - **Git Plugin**
  - **Pipeline / Declarative Pipeline**
  - **GitHub Branch Source**
  - **Docker Pipeline** (optional, for containerization stage)

---

## 2. Global Tool Configuration in Jenkins
1. Navigate to: **Manage Jenkins ➔ Tools ➔ NodeJS installations**.
2. Click **Add NodeJS**:
   - **Name**: `NodeJS-20` (must match the name in `Jenkinsfile`)
   - **Version**: Select `NodeJS 20.x` (LTS)
   - Check **Install automatically**
3. Click **Save**.

---

## 3. Creating the Pipeline Job
1. From Jenkins Dashboard, click **New Item**.
2. Enter Name: `MediFlow-CI`.
3. Choose **Pipeline** (or **Multibranch Pipeline**) and click **OK**.
4. In the job configuration:
   - Under **Build Triggers**, enable: **GitHub hook trigger for GITScm polling**.
   - Under **Pipeline Definition**, choose: **Pipeline script from SCM**.
   - **SCM**: Select **Git**.
   - **Repository URL**: `https://github.com/VishwajitS7/MediFlow.git`
   - **Branch Specifier**: `*/develop` (or `*/feature/*` for PR tracking).
   - **Script Path**: `Jenkinsfile`.
5. Click **Save** and test by clicking **Build Now**.

---

## 4. GitHub Webhook Configuration
To automate Jenkins triggers upon push or pull requests:
1. In the GitHub repository, navigate to: **Settings ➔ Webhooks ➔ Add webhook**.
2. **Payload URL**: `http://<your-jenkins-public-ip-or-ngrok>:8080/github-webhook/`
3. **Content type**: `application/json`
4. **Events**: Select **Just the push event** and **Pull requests**.
5. Click **Add webhook**.

---

## 5. Pipeline Stages & Verification Matrix

| Stage | Command Run | Pass Criteria |
|---|---|---|
| **Checkout SCM** | `checkout scm` | Clones latest commit from target branch |
| **Install Dependencies** | `npm ci` | Installs exact dependency tree from `package-lock.json` |
| **Lint** | `npm run lint` | 0 ESLint errors |
| **Typecheck** | `npm run typecheck` | `tsc --noEmit` exits with 0 errors |
| **Unit Tests** | `npm test` | Vitest passes 100% of test files |
| **Production Build** | `npm run build` | Next.js compilation succeeds with all routes |
| **Docker Build** | `docker build` | Conditional on `Dockerfile` presence |
```

---

## 6. Pre-Commit Quality Verification Checklist

Before committing, run these commands locally on your machine to verify everything passes:
```bash
npm run typecheck
npm test
npm run build
```

---

## 7. Commit & Pull Request Instructions

1. **Commit using Conventional Commits**:
   ```bash
   git add Jenkinsfile docs/JENKINS_SETUP.md
   git commit -m "ci(jenkins): implement declarative CI pipeline and setup documentation [TASK-CI-01]"
   ```

2. **Push your feature branch**:
   ```bash
   git push -u origin feature/TASK-CI-01-jenkins-pipeline
   ```

3. **Open Pull Request on GitHub**:
   - Target Base Branch: **`develop`**
   - Compare Branch: **`feature/TASK-CI-01-jenkins-pipeline`**
   - Fill in the PR form using `.github/pull_request_template.md`.
