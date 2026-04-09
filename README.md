# 🎭 Playwright QAOps — Full Setup Guide
### GitHub Actions + Azure Cloud + Merge Gates + Dashboard Reports

> **QAOps** is the practice of integrating Quality Assurance deeply into the DevOps pipeline — ensuring that test execution, infrastructure, and reporting are treated as **first-class engineering concerns**, not an afterthought. Just like DevOps brought development and operations together, QAOps brings testing into the **continuous delivery lifecycle**.

---

## 📋 Table of Contents

1. [What is QAOps? Problem → Solution](#-step-1-what-is-qaops-problem--solution)
2. [Create Azure Account & Playwright Workspace](#-step-2-create-azure-account--playwright-workspace-resource)
3. [Integrate Local Workspace with Azure Cloud](#-step-3-integrate-local-workspace-with-azure-cloud)
4. [Execute Tests via Azure Cloud](#-step-4-executing-tests-via-azure-cloud)
5. [GitHub Repository Setup](#-step-5-github-repository-setup)
6. [GitHub Actions & CI/CD Pipelines](#-step-6-github-actions--cicd-pipelines)
7. [Azure Integration with CI/CD](#-step-7-azure-integration-with-cicd)
8. [Pull Requests & Merge Gates](#-step-8-pull-requests--merge-gates)
9. [Architecture Overview](#-architecture-overview)

---

## 🧠 Step 1: What is QAOps? Problem → Solution

### The Real-World Challenge

Writing tests is only **20% of the problem**. In real projects, the bigger challenge is **making tests run reliably, fast, and automatically at scale**.

#### ❌ Common Pain Points

| Problem | Impact |
|---|---|
| No dedicated test infrastructure | Tests can't run without a developer's machine |
| Tests run locally only | Results are never shared with the team |
| Slow sequential execution | Feedback loops take too long |
| No CI/CD integration | Quality checks are manual and skipped |
| Reports lost after run | No historical visibility or trend analysis |
| No visibility for the team | QA becomes a black box |
| Flaky results in shared environments | False failures erode trust in the test suite |
| Manual trigger required | Quality gates are forgotten under deadline pressure |

### ✅ The QAOps Solution

QAOps solves this by:

- **Automating test execution** on every push or pull request via GitHub Actions
- **Running tests in the cloud** using Microsoft Azure Playwright Testing (parallel shards, real browsers)
- **Centralizing reports** in the Azure Dashboard with traces, screenshots, and trend history
- **Enforcing merge gates** so no code merges to `main` without a passing test run

---

## ☁️ Step 2: Create Azure Account & Playwright Workspace Resource

### 2.1 Create an Azure Account

1. Visit [https://portal.azure.com](https://portal.azure.com) and sign up or log in
2. Activate your subscription (Free Tier available)

### 2.2 Create a Resource Group

```bash
# Via Azure CLI
az group create --name playwright-rg --location eastus
```

Or via Azure Portal:
- Navigate to **Resource Groups** → **+ Create**
- Name: `playwright-rg`
- Region: Choose nearest to your team

### 2.3 Create a Playwright Testing Workspace

1. In the Azure Portal, search for **Microsoft Playwright Testing**
2. Click **+ Create**
3. Fill in:
   - **Subscription**: Your active subscription
   - **Resource Group**: `playwright-rg`
   - **Name**: `playwright-workspace`
   - **Region**: East US (or closest)
4. Click **Review + Create** → **Create**

### 2.4 Get Your Service URL

After creation, navigate to your workspace and copy the **Service URL**:

```
PLAYWRIGHT_SERVICE_URL=wss://<region>.api.playwright.microsoft.com/accounts/<workspace-id>/...
```

> ⚠️ Keep this URL safe — it's needed for local and CI/CD configuration.

---

## 🔗 Step 3: Integrate Local Workspace with Azure Cloud

### 3.1 Configure Role-Based Access Control (RBAC)

Your user account (and later, your CI/CD service principal) needs **Contributor** or **Owner** access to the Azure Storage Account used by Playwright Testing.

```bash
# Assign role to your user
az role assignment create \
  --assignee <your-email-or-object-id> \
  --role "Contributor" \
  --scope /subscriptions/<subscription-id>/resourceGroups/playwright-rg
```

Via Portal:
- Go to your **Storage Account** → **Access Control (IAM)**
- Click **+ Add role assignment**
- Role: `Storage Blob Data Contributor`
- Assign to: your user account

### 3.2 Install Playwright & Azure Dependencies

```bash
# Install Playwright
npm init playwright@latest

# Install Azure Playwright Testing package
npm install @azure/microsoft-playwright-testing --save-dev
```

### 3.3 Configure `playwright.config.ts` for Azure

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import { getServiceConfig, ServiceOS } from '@azure/microsoft-playwright-testing';

const config = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 2,
  reporter: [['list'], ['@azure/microsoft-playwright-testing/reporter']],
  use: {
    baseURL: process.env.BASE_URL || 'https://your-app.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});

// If PLAYWRIGHT_SERVICE_URL is set, run tests on Azure cloud
export default process.env.PLAYWRIGHT_SERVICE_URL
  ? getServiceConfig(config, {
      os: ServiceOS.LINUX,
      runId: process.env.PLAYWRIGHT_SERVICE_RUN_ID,
    })
  : config;
```

### 3.4 Set Environment Variables Locally

```bash
# .env (never commit this!)
PLAYWRIGHT_SERVICE_URL=wss://<region>.api.playwright.microsoft.com/...
PLAYWRIGHT_SERVICE_ACCESS_TOKEN=<your-access-token>
```

```bash
# Add .env to .gitignore
echo ".env" >> .gitignore
```

---

## ▶️ Step 4: Executing Tests via Azure Cloud

### 4.1 Run Tests Remotely from Local Machine

```bash
# Set env vars first (or use .env file with dotenv)
export PLAYWRIGHT_SERVICE_URL="wss://..."
export PLAYWRIGHT_SERVICE_ACCESS_TOKEN="..."

# Run against Azure cloud browsers
npx playwright test --config azure.config.ts
```

### 4.2 Understanding the Cloud Execution Flow

```
Local Machine
    │
    ├── npx playwright test --config azure.config.ts
    │
    └──► Azure Playwright Testing
              ├── Spins up Chromium / Firefox / WebKit cloud browsers
              ├── Distributes tests across parallel shards
              ├── Collects results (pass / fail / traces)
              └── Uploads report to Azure Dashboard
```

### 4.3 View Results on Azure Dashboard

1. Open **Azure Portal** → **Microsoft Playwright Testing** → your workspace
2. Navigate to **Test Runs**
3. Select a run to view:
   - ✅ Pass / ❌ Fail / ⏭ Skipped summary
   - Filter by browser, status, shard
   - Failure details with stack traces
   - Screenshots & video recordings
   - Step-by-step Trace Viewer
   - Trend history across runs

---

## 🗂️ Step 5: GitHub Repository Setup

### 5.1 Initialize Repository

```bash
# If starting fresh
git init
git add .
git commit -m "feat: initial Playwright QAOps setup"

# Connect to GitHub
git remote add origin https://github.com/<your-org>/<your-repo>.git
git branch -M main
git push -u origin main
```

### 5.2 Recommended Project Structure

```
your-project/
├── .github/
│   └── workflows/
│       └── playwright.yml          # CI/CD pipeline
├── tests/
│   ├── example.spec.ts
│   └── auth.spec.ts
├── playwright.config.ts            # Default config (local)
├── azure.config.ts                 # Azure cloud config
├── package.json
├── .gitignore
└── README.md
```

### 5.3 `.gitignore` Essentials

```gitignore
node_modules/
playwright-report/
test-results/
.env
*.env.local
.playwright/
```

---

## ⚙️ Step 6: GitHub Actions & CI/CD Pipelines

### 6.1 YAML Structure Overview

A GitHub Actions workflow consists of three levels:
- **`on`** — Events that trigger the workflow (push, pull_request, schedule)
- **`jobs`** — Groups of steps that run on the same runner
- **`steps`** — Individual actions or shell commands

### 6.2 Playwright CI/CD Workflow

Create `.github/workflows/playwright.yml`:

```yaml
name: 🎭 Playwright Tests — Azure Cloud

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Playwright Tests
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      # Step 1: Checkout source code
      - name: Checkout Repository
        uses: actions/checkout@v4

      # Step 2: Set up Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # Step 3: Install dependencies (clean install)
      - name: Install Dependencies
        run: npm ci

      # Step 4: Install Playwright browsers (needed for local fallback)
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      # Step 5: Set Azure environment variables
      - name: Set Azure Playwright Service URL
        run: echo "PLAYWRIGHT_SERVICE_URL=${{ secrets.PLAYWRIGHT_SERVICE_URL }}" >> $GITHUB_ENV

      # Step 6: Run tests on Azure Cloud
      - name: Run Playwright Tests
        run: npx playwright test --config azure.config.ts
        env:
          PLAYWRIGHT_SERVICE_URL: ${{ secrets.PLAYWRIGHT_SERVICE_URL }}
          PLAYWRIGHT_SERVICE_ACCESS_TOKEN: ${{ secrets.PLAYWRIGHT_SERVICE_ACCESS_TOKEN }}
          PLAYWRIGHT_SERVICE_RUN_ID: ${{ github.run_id }}-${{ github.run_attempt }}
          BASE_URL: ${{ secrets.BASE_URL }}

      # Step 7: Upload artifacts (always, even on failure)
      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ github.run_id }}
          path: playwright-report/
          retention-days: 30
```

### 6.3 Key YAML Concepts

| Concept | Description |
|---|---|
| `on: push` | Triggers on every push to specified branches |
| `on: pull_request` | Triggers when a PR is opened or updated |
| `runs-on: ubuntu-latest` | Uses GitHub-hosted Linux runner |
| `if: always()` | Runs the step even if previous steps fail |
| `${{ secrets.NAME }}` | Reads encrypted secret from GitHub |
| `${{ github.run_id }}` | Unique identifier for the current workflow run |

---

## 🔐 Step 7: Azure Integration with CI/CD

### 7.1 Create an Azure Service Principal

A **Service Principal** is an identity for automated pipelines — like a "service account" for GitHub Actions.

```bash
# Create service principal with Contributor role
az ad sp create-for-rbac \
  --name "github-playwright-sp" \
  --role Contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/playwright-rg \
  --sdk-auth
```

This outputs a JSON block like:

```json
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "...",
  "activeDirectoryEndpointUrl": "...",
  "resourceManagerEndpointUrl": "..."
}
```

> 🔒 Store this entire JSON block as a GitHub Secret named `AZURE_CREDENTIALS`.

### 7.2 Add Secrets to GitHub Repository

Navigate to: **GitHub Repo** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value |
|---|---|
| `PLAYWRIGHT_SERVICE_URL` | Your Azure Playwright Testing WSS URL |
| `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` | Access token from Azure workspace |
| `AZURE_CREDENTIALS` | Full JSON output from service principal creation |
| `BASE_URL` | The URL of your application under test |

### 7.3 Add Azure Login Step to Workflow

```yaml
steps:
  - name: Azure Login
    uses: azure/login@v1
    with:
      creds: ${{ secrets.AZURE_CREDENTIALS }}

  - name: Run Playwright Tests
    run: npx playwright test --config azure.config.ts
    env:
      PLAYWRIGHT_SERVICE_URL: ${{ secrets.PLAYWRIGHT_SERVICE_URL }}
      PLAYWRIGHT_SERVICE_ACCESS_TOKEN: ${{ secrets.PLAYWRIGHT_SERVICE_ACCESS_TOKEN }}
```

### 7.4 How Azure Authorization Works in CI/CD

```
GitHub Actions Runner
    │
    ├── azure/login@v1 (uses AZURE_CREDENTIALS)
    │       └── Authenticates service principal
    │
    └── npx playwright test
            └── PLAYWRIGHT_SERVICE_URL
                    └──► Azure Playwright Testing
                              ├── Validates service principal permissions
                              └── Grants access to cloud browsers + storage
```

---

## 🛡️ Step 8: Pull Requests & Merge Gates

### 8.1 Configure Branch Protection Rules

Navigate to: **GitHub Repo** → **Settings** → **Branches** → **Add rule**

Configure the following for the `main` branch:

- ✅ **Require a pull request before merging**
- ✅ **Require status checks to pass before merging**
  - Add: `Run Playwright Tests` (your job name from the workflow)
- ✅ **Require branches to be up to date before merging**
- ✅ **Do not allow bypassing the above settings**

### 8.2 The Merge Gate Flow

```
Developer creates PR
    │
    └──► GitHub Actions triggered (on: pull_request)
              │
              ├── Tests run on Azure Cloud
              │
              ├── PASS ✅ → PR shows green check → Merge enabled
              │
              └── FAIL ❌ → PR shows red X → Merge BLOCKED
                              │
                              └── Developer must fix tests before merge
```

### 8.3 Creating a Pull Request (CLI)

```bash
# Create a feature branch
git checkout -b feature/new-login-tests

# Make changes and commit
git add .
git commit -m "feat: add login flow e2e tests"

# Push and open PR
git push origin feature/new-login-tests
gh pr create --title "Add login e2e tests" --body "Adds Playwright tests for the login flow" --base main
```

### 8.4 PR Status Check Example

```
✅ Run Playwright Tests (2m 34s)
   ├── 47 passed
   ├── 0 failed
   └── View report → Azure Dashboard link

✅ All checks have passed
   This branch has no conflicts with the base branch.
   [Merge pull request] ← Button now enabled
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        DEVELOPER                            │
│  git push / merge PR → GitHub Repository                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ on: push / pull_request
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS                           │
│                                                             │
│  1. Workflow triggered (.github/workflows/playwright.yml)   │
│  2. Checkout & install deps (npm ci, install browsers)      │
│  3. Set env variables (PLAYWRIGHT_SERVICE_URL)              │
│  4. Run: npx playwright test --config azure.config.ts       │
└──────────────────────────┬──────────────────────────────────┘
                           │ remote run
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   MICROSOFT AZURE                           │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │ Playwright       │    │ Cloud Browsers               │   │
│  │ Testing Service  ├───►│ Chromium / Firefox / WebKit  │   │
│  └─────────────────┘    └──────────────┬───────────────┘   │
│                                        │                    │
│                          ┌─────────────▼───────────────┐   │
│                          │ Parallel Shards              │   │
│                          │ (distributed execution)      │   │
│                          └─────────────┬───────────────┘   │
│                                        │                    │
│                          ┌─────────────▼───────────────┐   │
│                          │ Results Collected            │   │
│                          │ pass / fail / traces         │   │
│                          └─────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ upload report
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           AZURE PLAYWRIGHT TESTING DASHBOARD                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Run Summary      │  │ Filter & Search  │                │
│  │ passed/failed    │  │ by status/shard  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Failure Details  │  │ Screenshots &    │                │
│  │ stack traces     │  │ Videos           │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Trace Viewer     │  │ Trend & History  │                │
│  │ DOM snapshots    │  │ across runs      │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Checklist

- [ ] Azure account created and Playwright Testing workspace provisioned
- [ ] `PLAYWRIGHT_SERVICE_URL` copied from Azure workspace
- [ ] Local project configured with `azure.config.ts`
- [ ] Tests verified running on Azure cloud locally
- [ ] GitHub repository initialized and pushed
- [ ] GitHub Secrets added (`PLAYWRIGHT_SERVICE_URL`, `PLAYWRIGHT_SERVICE_ACCESS_TOKEN`, `AZURE_CREDENTIALS`, `BASE_URL`)
- [ ] `.github/workflows/playwright.yml` created and pushed
- [ ] GitHub Actions workflow runs successfully
- [ ] Branch protection rules configured on `main`
- [ ] Merge gate verified: failing tests block PR merge

---

## 📚 Resources

- https://youtu.be/Ur7txGAr330?si=gWt4yKATdzf4JDly 
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Microsoft Playwright Testing (Azure)](https://learn.microsoft.com/en-us/azure/playwright-testing/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure RBAC Documentation](https://learn.microsoft.com/en-us/azure/role-based-access-control/)
- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

## 🏷️ Tech Stack

![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Microsoft Azure](https://img.shields.io/badge/Microsoft_Azure-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

---

*Built with ❤️ using the QAOps methodology — Quality as a first-class engineering concern.*
