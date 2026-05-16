     1|---
     2|title: Deployment
     3|description: Deploy SIFIX to production — dApp on Vercel, docs on GitHub Pages, extension to Chrome Web Store, environment variables, CI/CD with GitHub Actions, and monitoring.
     4|---
     5|
     6|# Deployment
     7|
     8|> **TL;DR** — Push `sifix-dapp` to GitHub → import in Vercel → set 14 environment variables → deploy. Docs auto-deploy to GitHub Pages via Actions. Extension builds from `build/chrome-mv3-prod/` for Chrome Web Store distribution.
     9|
    10|This guide covers deploying the SIFIX platform to production. You'll deploy the dApp dashboard to Vercel, documentation to GitHub Pages, and prepare the Chrome extension for distribution.
    11|
    12|---
    13|
    14|## Architecture
    15|
    16|The production deployment consists of three independent components:
    17|
    18|```
    19|Production Deployment
    20|├── dApp (Vercel)                    — Next.js 16 dashboard + 35 API routes
    21|│   ├── Serverless Functions         — API endpoints
    22|│   ├── Edge Runtime                 — Auth middleware
    23|│   └── PostgreSQL (managed PostgreSQL) — Persistent database
    24|├── Docs (GitHub Pages)              — Static documentation site
    25|└── Extension (Chrome Web Store)     — MV3 extension (future)
    26|```
    27|
    28|---
    29|
    30|## Deploy the dApp to Vercel
    31|
    32|The SIFIX dApp is a Next.js 16 application optimized for Vercel's serverless infrastructure.
    33|
    34|### Prerequisites
    35|
    36|- A [Vercel account](https://vercel.com) (free tier works)
    37|- The `sifix-dapp` repository pushed to GitHub
    38|- All required API keys and private keys ready
    39|
    40|### Step 1 — Push to GitHub
    41|
    42|```bash
    43|cd sifix-dapp
    44|git remote add origin https://github.com/sifix-xyz/sifix-dapp.git
    45|git push -u origin main
    46|```
    47|
    48|### Step 2 — Import in Vercel
    49|
    50|1. Go to [vercel.com/new](https://vercel.com/new)
    51|2. Import the `sifix-dapp` repository
    52|3. Configure the framework:
    53|   - **Framework Preset:** Next.js
    54|   - **Build Command:** `pnpm build`
    55|   - **Output Directory:** `.next`
    56|
    57|### Step 3 — Configure environment variables
    58|
    59|In the Vercel project settings → **Environment Variables**, add all 14 variables:
    60|
    61|```bash
    62|# Database — use managed PostgreSQL
    63|DATABASE_URL="postgresql://user:password@db-host:5432/sifix?schema=public"
    64|
    65|# WalletConnect
    66|NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"
    67|
    68|# 0G Galileo Network
    69|NEXT_PUBLIC_ZG_RPC_URL="https://evmrpc-testnet.0g.ai"
    70|NEXT_PUBLIC_ZG_CHAIN_ID="16602"
    71|
    72|# AI Provider
    73|AI_API_KEY="your-production-api-key"
    74|AI_BASE_URL="https://api.openai.com/v1"
    75|AI_MODEL="gpt-4o"
    76|
    77|# 0G Storage
    78|ZG_INDEXER_URL="https://indexer-storage-testnet-turbo.0g.ai"
    79|STORAGE_PRIVATE_KEY="0xProductionStorageKey..."
    80|STORAGE_MOCK_MODE="false"
    81|
    82|# 0G Compute
    83|COMPUTE_PRIVATE_KEY="0xProductionComputeKey..."
    84|COMPUTE_PROVIDER_ADDRESS="0xProviderAddress..."
    85|
    86|# Agentic Identity
    87|NEXT_PUBLIC_AGENTIC_ID_CONTRACT_ADDRESS="0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F"
    88|NEXT_PUBLIC_AGENTIC_ID_TOKEN_ID="99"
    89|```
    90|
    91|> **Security:** Never commit these values to the repository. Use Vercel's encrypted environment variable storage. Mark private keys as **Sensitive** to prevent exposure in build logs.
    92|
    93|### Step 4 — Database migration
    94|
    95|For production, the default PostgreSQL (`postgresql://user:password@127.0.0.1:5432/sifix`) won't work in Vercel's serverless environment because each function invocation gets an isolated filesystem. Use one of these alternatives:
    96|
    97|**Option A: Turso (Recommended — PostgreSQL-compatible)**
    98|
    99|```bash
   100|# Install Turso CLI
   101|curl -sSfL https://get.tur.so/install.sh | bash
   102|
   103|# Create a database
   104|turso db create sifix-production
   105|
   106|# Get the connection string
   107|turso db show sifix-production --url
   108|# → libsql://sifix-production-xxx.turso.io
   109|
   110|# Get the auth token
   111|turso db tokens create sifix-production
   112|```
   113|
   114|Update `DATABASE_URL` in Vercel:
   115|```
   116|DATABASE_URL="libsql://sifix-production-xxx.turso.io?authToken=xxx"
   117|```
   118|
   119|Update `schema.prisma` to use the Turso provider if needed.
   120|
   121|**Option B: PlanetScale (MySQL-compatible)**
   122|
   123|```bash
   124|# Create a PlanetScale database
   125|pscale database create sifix-production
   126|
   127|# Get connection string
   128|pscale connect sifix-production main --secure
   129|```
   130|
   131|Update `DATABASE_URL` in Vercel with the PlanetScale connection string.
   132|
   133|### Step 5 — Deploy
   134|
   135|```bash
   136|# Deploy via Vercel CLI (optional — auto-deploys on push)
   137|npx vercel --prod
   138|```
   139|
   140|Or push to `main` — Vercel auto-deploys on every push.
   141|
   142|### Step 6 — Verify the deployment
   143|
   144|```bash
   145|# Test the health endpoint
   146|curl https://your-app.vercel.app/api/health
   147|# → { "success": true, "data": { ... } }
   148|
   149|# Test a scan endpoint (requires auth)
   150|curl -H "Authorization: Bearer YOUR_TOKEN" \
   151|  https://your-app.vercel.app/api/v1/scan/0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18
   152|```
   153|
   154|---
   155|
   156|## Deploy Docs to GitHub Pages
   157|
   158|The SIFIX documentation is a static site that deploys to GitHub Pages.
   159|
   160|### Step 1 — Configure the docs site
   161|
   162|Ensure `docs/` contains a static site generator config (e.g., VitePress, Docusaurus, or MkDocs). The key settings:
   163|
   164|```yaml
   165|# .github/workflows/docs.yml or equivalent
   166|base: /sifix-docs/
   167|```
   168|
   169|### Step 2 — GitHub Actions workflow
   170|
   171|Create `.github/workflows/docs.yml` in the `sifix-docs` repository:
   172|
   173|```yaml
   174|name: Deploy Docs
   175|
   176|on:
   177|  push:
   178|    branches: [main]
   179|    paths: ['docs/**']
   180|
   181|permissions:
   182|  contents: read
   183|  pages: write
   184|  id-token: write
   185|
   186|concurrency:
   187|  group: pages
   188|  cancel-in-progress: true
   189|
   190|jobs:
   191|  build:
   192|    runs-on: ubuntu-latest
   193|    steps:
   194|      - uses: actions/checkout@v4
   195|
   196|      - uses: pnpm/action-setup@v4
   197|        with:
   198|          version: 9
   199|
   200|      - uses: actions/setup-node@v4
   201|        with:
   202|          node-version: 20
   203|          cache: pnpm
   204|
   205|      - name: Install dependencies
   206|        run: pnpm install
   207|
   208|      - name: Build docs
   209|        run: pnpm docs:build
   210|
   211|      - name: Upload artifact
   212|        uses: actions/upload-pages-artifact@v3
   213|        with:
   214|          path: docs/.vitepress/dist
   215|
   216|  deploy:
   217|    needs: build
   218|    runs-on: ubuntu-latest
   219|    environment:
   220|      name: github-pages
   221|      url: ${{ steps.deployment.outputs.page_url }}
   222|    steps:
   223|      - name: Deploy to GitHub Pages
   224|        id: deployment
   225|        uses: actions/deploy-pages@v4
   226|```
   227|
   228|### Step 3 — Enable GitHub Pages
   229|
   230|1. Go to the repository **Settings** → **Pages**
   231|2. Set **Source** to **GitHub Actions**
   232|3. Push to `main` to trigger the first deployment
   233|
   234|The docs will be available at `https://sifix-xyz.github.io/sifix-docs/`.
   235|
   236|---
   237|
   238|## Chrome Web Store (Future)
   239|
   240|The Chrome extension is currently distributed as an unpacked extension for development. Chrome Web Store publication is planned for a future release.
   241|
   242|### Preparation checklist
   243|
   244|- [ ] Production build passes all lint and type checks
   245|- [ ] Extension tested on Chrome 116+ with MV3 compatibility
   246|- [ ] Privacy policy page published (required by Chrome Web Store)
   247|- [ ] Screenshots prepared (1280×800 or 640×400)
   248|- [ ] Promotional images prepared (440×280 small, 920×680 large)
   249|- [ ] Extension description and category selected
   250|
   251|### Build for submission
   252|
   253|```bash
   254|cd sifix-extension
   255|pnpm build
   256|# The production build is in build/chrome-mv3-prod/
   257|```
   258|
   259|### Submission steps (future)
   260|
   261|1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   262|2. Pay the one-time $5 registration fee
   263|3. Click **"New Item"** → upload the ZIP of `build/chrome-mv3-prod/`
   264|4. Fill in listing details:
   265|   - **Name:** SIFIX — AI Wallet Security
   266|   - **Short description:** AI-powered real-time wallet protection for Web3
   267|   - **Detailed description:** Full feature description with screenshots
   268|   - **Category:** Productivity / Developer Tools
   269|   - **Language:** English
   270|5. Submit for review (typically 1–3 business days)
   271|
   272|### Packaging for distribution
   273|
   274|```bash
   275|# Create a ZIP for submission
   276|cd build/chrome-mv3-prod/
   277|zip -r ../sifix-extension-v1.0.0.zip .
   278|```
   279|
   280|---
   281|
   282|## Environment Variables for Production
   283|
   284|### Security best practices
   285|
   286|- **Never commit `.env` files** — Use the deployment platform's encrypted environment variable storage
   287|- **Mark secrets as sensitive** — Prevent accidental exposure in build logs
   288|- **Use separate keys per environment** — Development and production should use different API keys and wallet private keys
   289|- **Rotate keys regularly** — Especially after any team member leaves
   290|- **Use least-privilege wallets** — Storage and compute wallets should hold only the minimum A0GI needed
   291|
   292|### Production-specific considerations
   293|
   294|**`STORAGE_MOCK_MODE`:**
   295|```bash
   296|STORAGE_MOCK_MODE="false"  # Must be false in production for real 0G Storage uploads
   297|```
   298|
   299|**`STORAGE_PRIVATE_KEY`:**
   300|- Use a dedicated wallet funded with testnet A0GI
   301|- Monitor the wallet balance and set up alerts for low funds
   302|- Keep a backup of the key in a secure secrets manager
   303|
   304|**`AI_API_KEY`:**
   305|- Use a production-tier API key with appropriate rate limits
   306|- Consider using 0G Compute as the primary provider to reduce external dependencies
   307|- Set up fallback providers in case the primary is unavailable
   308|
   309|**`NEXT_PUBLIC_` variables:**
   310|- These are embedded in the client bundle at build time
   311|- Changing them requires a redeployment
   312|- Only use the `NEXT_PUBLIC_` prefix for truly public values (chain ID, RPC URL, contract addresses)
   313|- Never put secrets in `NEXT_PUBLIC_` variables
   314|
   315|---
   316|
   317|## CI/CD with GitHub Actions
   318|
   319|Automate testing, building, and deployment with GitHub Actions.
   320|
   321|### dApp CI/CD
   322|
   323|Create `.github/workflows/dapp.yml` in `sifix-dapp`:
   324|
   325|```yaml
   326|name: dApp CI/CD
   327|
   328|on:
   329|  push:
   330|    branches: [main, develop]
   331|  pull_request:
   332|    branches: [main]
   333|
   334|jobs:
   335|  test:
   336|    runs-on: ubuntu-latest
   337|    steps:
   338|      - uses: actions/checkout@v4
   339|
   340|      - uses: pnpm/action-setup@v4
   341|        with:
   342|          version: 9
   343|
   344|      - uses: actions/setup-node@v4
   345|        with:
   346|          node-version: 20
   347|          cache: pnpm
   348|
   349|      - name: Install dependencies
   350|        run: pnpm install
   351|
   352|      - name: Type check
   353|        run: pnpm tsc --noEmit
   354|
   355|      - name: Lint
   356|        run: pnpm lint
   357|
   358|      - name: Build
   359|        run: pnpm build
   360|        env:
   361|          DATABASE_URL: "file:./test.db"
   362|          NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "test-id"
   363|          AI_API_KEY: "test-key"
   364|          NEXT_PUBLIC_ZG_RPC_URL: "https://evmrpc-testnet.0g.ai"
   365|          NEXT_PUBLIC_ZG_CHAIN_ID: "16602"
   366|
   367|      - name: Push database schema
   368|        run: pnpm db:push
   369|        env:
   370|          DATABASE_URL: "file:./test.db"
   371|
   372|  deploy:
   373|    needs: test
   374|    if: github.ref == 'refs/heads/main'
   375|    runs-on: ubuntu-latest
   376|    steps:
   377|      - uses: actions/checkout@v4
   378|
   379|      - name: Deploy to Vercel
   380|        uses: amondnet/vercel-action@v25
   381|        with:
   382|          vercel-token: ${{ secrets.VERCEL_TOKEN }}
   383|          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
   384|          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
   385|          vercel-args: '--prod'
   386|```
   387|
   388|### Extension CI
   389|
   390|Create `.github/workflows/extension.yml` in `sifix-extension`:
   391|
   392|```yaml
   393|name: Extension CI
   394|
   395|on:
   396|  push:
   397|    branches: [main, develop]
   398|  pull_request:
   399|    branches: [main]
   400|
   401|jobs:
   402|  build:
   403|    runs-on: ubuntu-latest
   404|    steps:
   405|      - uses: actions/checkout@v4
   406|
   407|      - uses: pnpm/action-setup@v4
   408|        with:
   409|          version: 9
   410|
   411|      - uses: actions/setup-node@v4
   412|        with:
   413|          node-version: 20
   414|          cache: pnpm
   415|
   416|      - name: Install dependencies
   417|        run: pnpm install
   418|
   419|      - name: Type check
   420|        run: pnpm tsc --noEmit
   421|
   422|      - name: Lint
   423|        run: pnpm lint
   424|
   425|      - name: Build production
   426|        run: pnpm build
   427|
   428|      - name: Verify manifest
   429|        run: |
   430|          cat build/chrome-mv3-prod/manifest.json | python3 -m json.tool
   431|
   432|      - name: Upload build artifact
   433|        uses: actions/upload-artifact@v4
   434|        with:
   435|          name: chrome-extension
   436|          path: build/chrome-mv3-prod/
   437|```
   438|
   439|### Agent SDK CI
   440|
   441|Create `.github/workflows/agent.yml` in `sifix-agent`:
   442|
   443|```yaml
   444|name: Agent SDK CI
   445|
   446|on:
   447|  push:
   448|    branches: [main, develop]
   449|  pull_request:
   450|    branches: [main]
   451|
   452|jobs:
   453|  build:
   454|    runs-on: ubuntu-latest
   455|    steps:
   456|      - uses: actions/checkout@v4
   457|
   458|      - uses: pnpm/action-setup@v4
   459|        with:
   460|          version: 9
   461|
   462|      - uses: actions/setup-node@v4
   463|        with:
   464|          node-version: 20
   465|          cache: pnpm
   466|
   467|      - name: Install dependencies
   468|        run: pnpm install
   469|
   470|      - name: Type check
   471|        run: pnpm tsc --noEmit
   472|
   473|      - name: Lint
   474|        run: pnpm lint
   475|
   476|      - name: Build
   477|        run: pnpm build
   478|
   479|      - name: Run tests
   480|        run: pnpm test
   481|        env:
   482|          AI_API_KEY: "test-key"
   483|
   484|      - name: Publish to npm (main only)
   485|        if: github.ref == 'refs/heads/main'
   486|        run: pnpm publish --access public
   487|        env:
   488|          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   489|```
   490|
   491|---
   492|
   493|## Monitoring and Health Checks
   494|
   495|### Health endpoint
   496|
   497|The dApp exposes a health endpoint for monitoring:
   498|
   499|```bash
   500|curl https://your-app.vercel.app/api/health
   501|```
   502|
   503|**Expected response:**
   504|
   505|```json
   506|{
   507|  "success": true,
   508|  "data": {
   509|    "status": "healthy",
   510|    "database": "connected",
   511|    "aiProvider": "available",
   512|    "storage": "mock",
   513|    "network": {
   514|      "chainId": 16602,
   515|      "rpcUrl": "https://evmrpc-testnet.0g.ai"
   516|    },
   517|    "version": "1.5.0",
   518|    "timestamp": "2026-05-09T20:00:00Z"
   519|  }
   520|}
   521|```
   522|
   523|### Uptime monitoring
   524|
   525|**Option A: UptimeRobot (Free)**
   526|
   527|1. Create an account at [uptimerobot.com](https://uptimerobot.com)
   528|2. Add a new monitor:
   529|   - **Type:** HTTP(s)
   530|   - **URL:** `https://your-app.vercel.app/api/health`
   531|   - **Interval:** 5 minutes
   532|3. Set up alerts via email, Slack, or webhook
   533|
   534|**Option B: Vercel Built-in Analytics**
   535|
   536|Vercel provides built-in analytics and Web Vitals monitoring:
   537|1. Go to your Vercel project → **Analytics** tab
   538|2. Enable Web Analytics
   539|3. Monitor real-time performance metrics
   540|
   541|**Option C: Custom health check workflow**
   542|
   543|```yaml
   544|# .github/workflows/health-check.yml
   545|name: Health Check
   546|
   547|on:
   548|  schedule:
   549|    - cron: '*/15 * * * *'  # Every 15 minutes
   550|
   551|jobs:
   552|  health:
   553|    runs-on: ubuntu-latest
   554|    steps:
   555|      - name: Check API health
   556|        run: |
   557|          response=$(curl -s -o /dev/null -w "%{http_code}" https://your-app.vercel.app/api/health)
   558|          if [ "$response" != "200" ]; then
   559|            echo "❌ Health check failed with status $response"
   560|            exit 1
   561|          fi
   562|          echo "✅ Health check passed"
   563|
   564|      - name: Check AI provider
   565|        run: |
   566|          health=$(curl -s https://your-app.vercel.app/api/health)
   567|          echo "$health" | jq -e '.success == true'
   568|```
   569|
   570|### Application logging
   571|
   572|**Server-side (Vercel):**
   573|
   574|Vercel captures all `console.log`, `console.error`, and `console.warn` output from serverless functions. View logs in:
   575|
   576|1. Vercel Dashboard → Project → **Functions** tab
   577|2. Select any function to see real-time invocation logs
   578|3. Filter by status code, duration, or error
   579|
   580|**Client-side (Dashboard):**
   581|
   582|Use the browser's DevTools for client-side debugging. For production error tracking, integrate:
   583|
   584|- **Sentry** — Error tracking and performance monitoring
   585|- **LogRocket** — Session replay and analytics
   586|
   587|### Key metrics to monitor
   588|
   589|- **API response time** — Analysis endpoints should respond within 30 seconds (AI inference time)
   590|- **Error rate** — Track 4xx and 5xx responses across all endpoints
   591|- **Database connections** — Monitor connection pool usage for serverless database
   592|- **AI provider availability** — Track fallback rate from 0G Compute to alternative providers
   593|- **Storage upload success rate** — Monitor 0G Storage upload failures
   594|- **Extension user count** — Track daily active users via the auth endpoint
   595|
   596|### Alerting
   597|
   598|Set up alerts for:
   599|
   600|- **API downtime** — Health endpoint returns non-200 for 2 consecutive checks
   601|- **High error rate** — >5% of requests return 5xx errors
   602|- **Storage wallet balance** — A0GI balance drops below threshold
   603|- **AI provider failures** — Fallback rate exceeds 50%
   604|
   605|---
   606|
   607|## Production Checklist
   608|
   609|Before going live, verify:
   610|
   611|- [ ] All environment variables set in Vercel (14 variables)
   612|- [ ] Database configured for serverless (Turso/PlanetScale)
   613|- [ ] `STORAGE_MOCK_MODE` set to `"false"`
   614|- [ ] Storage wallet funded with testnet A0GI
   615|- [ ] Compute wallet funded and provider configured
   616|- [ ] Health endpoint responding correctly
   617|- [ ] CORS headers configured for extension access
   618|- [ ] Uptime monitoring active
   619|- [ ] Error tracking integrated (Sentry or equivalent)
   620|- [ ] GitHub Actions CI/CD pipeline passing
   621|- [ ] Documentation deployed to GitHub Pages
   622|- [ ] MetaMask network configured for 0G Galileo (Chain ID: 16602)
   623|
   624|---
   625|
   626|## Next Steps
   627|
   628|- **[Installation](./installation)** — Full setup guide
   629|- **[Configuration](./configuration)** — Complete environment variable reference
   630|- **[Quick Start](./quick-start)** — Analyze your first transaction
   631|- **[System Architecture](/architecture/system-overview)** — System design deep dive
   632|