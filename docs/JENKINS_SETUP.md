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
