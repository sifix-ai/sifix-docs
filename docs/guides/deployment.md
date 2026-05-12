---
title: Deployment
description: Deploy SIFIX to production — dApp on Vercel, docs on GitHub Pages, extension to Chrome Web Store, environment variables, CI/CD with GitHub Actions, and monitoring.
---

# Deployment

> **TL;DR** — Push `sifix-dapp` to GitHub → import in Vercel → set 14 environment variables → deploy. Docs auto-deploy to GitHub Pages via Actions. Extension builds from `build/chrome-mv3-prod/` for Chrome Web Store distribution.

This guide covers deploying the SIFIX platform to production. You'll deploy the dApp dashboard to Vercel, documentation to GitHub Pages, and prepare the Chrome extension for distribution.

---

## Architecture

The production deployment consists of three independent components:

```
Production Deployment
├── dApp (Vercel)                    — Next.js 16 dashboard + 35 API routes
│   ├── Serverless Functions         — API endpoints
│   ├── Edge Runtime                 — Auth middleware
│   └── SQLite (Turso / PlanetScale) — Persistent database
├── Docs (GitHub Pages)              — Static documentation site
└── Extension (Chrome Web Store)     — MV3 extension (future)
```

---

## Deploy the dApp to Vercel

The SIFIX dApp is a Next.js 16 application optimized for Vercel's serverless infrastructure.

### Prerequisites

- A [Vercel account](https://vercel.com) (free tier works)
- The `sifix-dapp` repository pushed to GitHub
- All required API keys and private keys ready

### Step 1 — Push to GitHub

```bash
cd sifix-dapp
git remote add origin https://github.com/sifix-xyz/sifix-dapp.git
git push -u origin main
```

### Step 2 — Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `sifix-dapp` repository
3. Configure the framework:
   - **Framework Preset:** Next.js
   - **Build Command:** `pnpm build`
   - **Output Directory:** `.next`

### Step 3 — Configure environment variables

In the Vercel project settings → **Environment Variables**, add all 14 variables:

```bash
# Database — use Turso for serverless SQLite or PlanetScale for MySQL
DATABASE_URL="file:./prod.db"          # or Turso connection string

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"

# 0G Galileo Network
NEXT_PUBLIC_ZG_RPC_URL="https://evmrpc-testnet.0g.ai"
NEXT_PUBLIC_ZG_CHAIN_ID="16602"

# AI Provider
AI_API_KEY="your-production-api-key"
AI_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4o"

# 0G Storage
ZG_INDEXER_URL="https://indexer-storage-testnet-turbo.0g.ai"
STORAGE_PRIVATE_KEY="0xProductionStorageKey..."
STORAGE_MOCK_MODE="false"

# 0G Compute
COMPUTE_PRIVATE_KEY="0xProductionComputeKey..."
COMPUTE_PROVIDER_ADDRESS="0xProviderAddress..."

# Agentic Identity
NEXT_PUBLIC_AGENTIC_ID_CONTRACT_ADDRESS="0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F"
NEXT_PUBLIC_AGENTIC_ID_TOKEN_ID="99"
```

> **Security:** Never commit these values to the repository. Use Vercel's encrypted environment variable storage. Mark private keys as **Sensitive** to prevent exposure in build logs.

### Step 4 — Database migration

For production, the default SQLite (`file:./dev.db`) won't work in Vercel's serverless environment because each function invocation gets an isolated filesystem. Use one of these alternatives:

**Option A: Turso (Recommended — SQLite-compatible)**

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create a database
turso db create sifix-production

# Get the connection string
turso db show sifix-production --url
# → libsql://sifix-production-xxx.turso.io

# Get the auth token
turso db tokens create sifix-production
```

Update `DATABASE_URL` in Vercel:
```
DATABASE_URL="libsql://sifix-production-xxx.turso.io?authToken=xxx"
```

Update `schema.prisma` to use the Turso provider if needed.

**Option B: PlanetScale (MySQL-compatible)**

```bash
# Create a PlanetScale database
pscale database create sifix-production

# Get connection string
pscale connect sifix-production main --secure
```

Update `DATABASE_URL` in Vercel with the PlanetScale connection string.

### Step 5 — Deploy

```bash
# Deploy via Vercel CLI (optional — auto-deploys on push)
npx vercel --prod
```

Or push to `main` — Vercel auto-deploys on every push.

### Step 6 — Verify the deployment

```bash
# Test the health endpoint
curl https://your-app.vercel.app/api/health
# → { "success": true, "data": { ... } }

# Test a scan endpoint (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-app.vercel.app/api/v1/scan/0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18
```

---

## Deploy Docs to GitHub Pages

The SIFIX documentation is a static site that deploys to GitHub Pages.

### Step 1 — Configure the docs site

Ensure `docs/` contains a static site generator config (e.g., VitePress, Docusaurus, or MkDocs). The key settings:

```yaml
# .github/workflows/docs.yml or equivalent
base: /sifix-docs/
```

### Step 2 — GitHub Actions workflow

Create `.github/workflows/docs.yml` in the `sifix-docs` repository:

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]
    paths: ['docs/**']

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Build docs
        run: pnpm docs:build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Step 3 — Enable GitHub Pages

1. Go to the repository **Settings** → **Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main` to trigger the first deployment

The docs will be available at `https://sifix-xyz.github.io/sifix-docs/`.

---

## Chrome Web Store (Future)

The Chrome extension is currently distributed as an unpacked extension for development. Chrome Web Store publication is planned for a future release.

### Preparation checklist

- [ ] Production build passes all lint and type checks
- [ ] Extension tested on Chrome 116+ with MV3 compatibility
- [ ] Privacy policy page published (required by Chrome Web Store)
- [ ] Screenshots prepared (1280×800 or 640×400)
- [ ] Promotional images prepared (440×280 small, 920×680 large)
- [ ] Extension description and category selected

### Build for submission

```bash
cd sifix-extension
pnpm build
# The production build is in build/chrome-mv3-prod/
```

### Submission steps (future)

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay the one-time $5 registration fee
3. Click **"New Item"** → upload the ZIP of `build/chrome-mv3-prod/`
4. Fill in listing details:
   - **Name:** SIFIX — AI Wallet Security
   - **Short description:** AI-powered real-time wallet protection for Web3
   - **Detailed description:** Full feature description with screenshots
   - **Category:** Productivity / Developer Tools
   - **Language:** English
5. Submit for review (typically 1–3 business days)

### Packaging for distribution

```bash
# Create a ZIP for submission
cd build/chrome-mv3-prod/
zip -r ../sifix-extension-v1.0.0.zip .
```

---

## Environment Variables for Production

### Security best practices

- **Never commit `.env` files** — Use the deployment platform's encrypted environment variable storage
- **Mark secrets as sensitive** — Prevent accidental exposure in build logs
- **Use separate keys per environment** — Development and production should use different API keys and wallet private keys
- **Rotate keys regularly** — Especially after any team member leaves
- **Use least-privilege wallets** — Storage and compute wallets should hold only the minimum A0GI needed

### Production-specific considerations

**`STORAGE_MOCK_MODE`:**
```bash
STORAGE_MOCK_MODE="false"  # Must be false in production for real 0G Storage uploads
```

**`STORAGE_PRIVATE_KEY`:**
- Use a dedicated wallet funded with testnet A0GI
- Monitor the wallet balance and set up alerts for low funds
- Keep a backup of the key in a secure secrets manager

**`AI_API_KEY`:**
- Use a production-tier API key with appropriate rate limits
- Consider using 0G Compute as the primary provider to reduce external dependencies
- Set up fallback providers in case the primary is unavailable

**`NEXT_PUBLIC_` variables:**
- These are embedded in the client bundle at build time
- Changing them requires a redeployment
- Only use the `NEXT_PUBLIC_` prefix for truly public values (chain ID, RPC URL, contract addresses)
- Never put secrets in `NEXT_PUBLIC_` variables

---

## CI/CD with GitHub Actions

Automate testing, building, and deployment with GitHub Actions.

### dApp CI/CD

Create `.github/workflows/dapp.yml` in `sifix-dapp`:

```yaml
name: dApp CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm tsc --noEmit

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build
        env:
          DATABASE_URL: "file:./test.db"
          NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "test-id"
          AI_API_KEY: "test-key"
          NEXT_PUBLIC_ZG_RPC_URL: "https://evmrpc-testnet.0g.ai"
          NEXT_PUBLIC_ZG_CHAIN_ID: "16602"

      - name: Push database schema
        run: pnpm db:push
        env:
          DATABASE_URL: "file:./test.db"

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Extension CI

Create `.github/workflows/extension.yml` in `sifix-extension`:

```yaml
name: Extension CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm tsc --noEmit

      - name: Lint
        run: pnpm lint

      - name: Build production
        run: pnpm build

      - name: Verify manifest
        run: |
          cat build/chrome-mv3-prod/manifest.json | python3 -m json.tool

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: chrome-extension
          path: build/chrome-mv3-prod/
```

### Agent SDK CI

Create `.github/workflows/agent.yml` in `sifix-agent`:

```yaml
name: Agent SDK CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm tsc --noEmit

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build

      - name: Run tests
        run: pnpm test
        env:
          AI_API_KEY: "test-key"

      - name: Publish to npm (main only)
        if: github.ref == 'refs/heads/main'
        run: pnpm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Monitoring and Health Checks

### Health endpoint

The dApp exposes a health endpoint for monitoring:

```bash
curl https://your-app.vercel.app/api/health
```

**Expected response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "aiProvider": "available",
    "storage": "mock",
    "network": {
      "chainId": 16602,
      "rpcUrl": "https://evmrpc-testnet.0g.ai"
    },
    "version": "1.5.0",
    "timestamp": "2026-05-09T20:00:00Z"
  }
}
```

### Uptime monitoring

**Option A: UptimeRobot (Free)**

1. Create an account at [uptimerobot.com](https://uptimerobot.com)
2. Add a new monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://your-app.vercel.app/api/health`
   - **Interval:** 5 minutes
3. Set up alerts via email, Slack, or webhook

**Option B: Vercel Built-in Analytics**

Vercel provides built-in analytics and Web Vitals monitoring:
1. Go to your Vercel project → **Analytics** tab
2. Enable Web Analytics
3. Monitor real-time performance metrics

**Option C: Custom health check workflow**

```yaml
# .github/workflows/health-check.yml
name: Health Check

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes

jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - name: Check API health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://your-app.vercel.app/api/health)
          if [ "$response" != "200" ]; then
            echo "❌ Health check failed with status $response"
            exit 1
          fi
          echo "✅ Health check passed"

      - name: Check AI provider
        run: |
          health=$(curl -s https://your-app.vercel.app/api/health)
          echo "$health" | jq -e '.success == true'
```

### Application logging

**Server-side (Vercel):**

Vercel captures all `console.log`, `console.error`, and `console.warn` output from serverless functions. View logs in:

1. Vercel Dashboard → Project → **Functions** tab
2. Select any function to see real-time invocation logs
3. Filter by status code, duration, or error

**Client-side (Dashboard):**

Use the browser's DevTools for client-side debugging. For production error tracking, integrate:

- **Sentry** — Error tracking and performance monitoring
- **LogRocket** — Session replay and analytics

### Key metrics to monitor

- **API response time** — Analysis endpoints should respond within 30 seconds (AI inference time)
- **Error rate** — Track 4xx and 5xx responses across all 35 endpoints
- **Database connections** — Monitor connection pool usage for serverless database
- **AI provider availability** — Track fallback rate from 0G Compute to alternative providers
- **Storage upload success rate** — Monitor 0G Storage upload failures
- **Extension user count** — Track daily active users via the auth endpoint

### Alerting

Set up alerts for:

- **API downtime** — Health endpoint returns non-200 for 2 consecutive checks
- **High error rate** — >5% of requests return 5xx errors
- **Storage wallet balance** — A0GI balance drops below threshold
- **AI provider failures** — Fallback rate exceeds 50%

---

## Production Checklist

Before going live, verify:

- [ ] All environment variables set in Vercel (14 variables)
- [ ] Database configured for serverless (Turso/PlanetScale)
- [ ] `STORAGE_MOCK_MODE` set to `"false"`
- [ ] Storage wallet funded with testnet A0GI
- [ ] Compute wallet funded and provider configured
- [ ] Health endpoint responding correctly
- [ ] CORS headers configured for extension access
- [ ] Uptime monitoring active
- [ ] Error tracking integrated (Sentry or equivalent)
- [ ] GitHub Actions CI/CD pipeline passing
- [ ] Documentation deployed to GitHub Pages
- [ ] MetaMask network configured for 0G Galileo (Chain ID: 16602)

---

## Next Steps

- **[Installation](./installation)** — Full setup guide
- **[Configuration](./configuration)** — Complete environment variable reference
- **[Quick Start](./quick-start)** — Analyze your first transaction
- **[System Architecture](/architecture/system-overview)** — System design deep dive
