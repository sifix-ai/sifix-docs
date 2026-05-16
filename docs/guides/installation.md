     1|---
     2|title: Installation
     3|description: Complete installation guide for the SIFIX platform — clone all three repositories, build the agent SDK, launch the dApp dashboard, and load the Chrome extension on the 0G Galileo Testnet.
     4|---
     5|
     6|# Installation
     7|
     8|> **⏱ Estimated time:** ~15 minutes
     9|>
    10|> **TL;DR** — Clone three repos (`sifix-agent`, `sifix-dapp`, `sifix-extension`), run `pnpm install && pnpm build` in each, configure `.env`, load the extension in Chrome, and verify the full pipeline on 0G Galileo Testnet.
    11|
    12|This guide covers installing the **complete SIFIX platform** from source. You'll set up all three components — the agent SDK, the web dashboard, and the Chrome extension — and verify they work together on the **0G Galileo Testnet** (Chain ID: `16602`).
    13|
    14|---
    15|
    16|## Prerequisites
    17|
    18|Ensure your system meets these requirements before starting:
    19|
    20|- **Node.js** ≥ 18 — [Download](https://nodejs.org/) (LTS recommended)
    21|- **pnpm** — Install globally: `npm install -g pnpm`
    22|- **Git** — [Download](https://git-scm.com/)
    23|- **Chrome** ≥ 116 — Required for Manifest V3 extension support
    24|- **MetaMask** — [Install](https://metamask.io/) and create or import a wallet
    25|
    26|Verify your environment:
    27|
    28|```bash
    29|node --version    # v18.x.x or higher
    30|pnpm --version    # 8.x.x or higher
    31|git --version     # 2.x.x
    32|```
    33|
    34|---
    35|
    36|## Step 1 — Clone All Repositories
    37|
    38|SIFIX is organized as three independent repositories. Clone them into a shared workspace:
    39|
    40|```bash
    41|# Create workspace
    42|mkdir sifix-repos && cd sifix-repos
    43|
    44|# Clone all three repos
    45|git clone https://github.com/sifix-xyz/sifix-agent.git
    46|git clone https://github.com/sifix-xyz/sifix-dapp.git
    47|git clone https://github.com/sifix-xyz/sifix-extension.git
    48|```
    49|
    50|Expected workspace structure:
    51|
    52|```
    53|sifix-repos/
    54|├── sifix-agent/       # Core SDK — simulation engine, AI routing, risk scoring
    55|├── sifix-dapp/        # Web dashboard + REST API (Next.js 16)
    56|└── sifix-extension/   # Chrome extension (MV3) — real-time wallet protection
    57|```
    58|
    59|---
    60|
    61|## Step 2 — Setup sifix-agent (Core SDK)
    62|
    63|The agent SDK is the security analysis engine. Build it **first** — the dApp and extension depend on it.
    64|
    65|```bash
    66|cd sifix-agent
    67|
    68|# Install dependencies
    69|pnpm install
    70|
    71|# Build the SDK
    72|pnpm build
    73|```
    74|
    75|### Verify the Agent Build
    76|
    77|```bash
    78|# Confirm the dist output exists
    79|ls dist/
    80|# Should show: index.js  index.d.ts  and other compiled files
    81|```
    82|
    83|**Quick smoke test (optional):**
    84|
    85|```typescript
    86|import { SecurityAgent } from "@sifix/agent";
    87|
    88|const agent = new SecurityAgent({
    89|  rpcUrl: "https://evmrpc-testnet.0g.ai",
    90|  aiProvider: {
    91|    apiKey: "test-key",
    92|    model: "gpt-4o",
    93|  },
    94|  storage: {
    95|    mockMode: true,
    96|  },
    97|});
    98|
    99|await agent.init();
   100|console.log("✅ SIFIX Agent initialized successfully");
   101|```
   102|
   103|> **Note:** The smoke test requires a valid `AI_API_KEY` for full initialization. Use `mockMode: true` to skip on-chain operations.
   104|
   105|---
   106|
   107|## Step 3 — Setup sifix-dapp (Dashboard)
   108|
   109|The dApp is a Next.js 16 full-stack application serving the web dashboard and the REST API backend (35 routes).
   110|
   111|### 3.1 Install dependencies
   112|
   113|```bash
   114|cd sifix-dapp
   115|pnpm install
   116|```
   117|
   118|### 3.2 Configure environment variables
   119|
   120|```bash
   121|cp .env.example .env
   122|```
   123|
   124|Open `.env` and configure the required variables. At minimum, set:
   125|
   126|```bash
   127|DATABASE_URL="postgresql://user:password@127.0.0.1:5432/sifix"
   128|NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-id"
   129|AI_API_KEY="your-ai-api-key"
   130|```
   131|
   132|> See [Configuration](./configuration) for the complete list of 14 environment variables with descriptions and defaults.
   133|
   134|### 3.3 Initialize the database
   135|
   136|The dApp uses Prisma with PostgreSQL. Create the database and push the schema:
   137|
   138|```bash
   139|pnpm db:push
   140|```
   141|
   142|This creates `prisma/dev.db` with all 13 models (Address, ThreatReport, TransactionScan, ScanHistory, etc.).
   143|
   144|### 3.4 Start the development server
   145|
   146|```bash
   147|pnpm dev
   148|```
   149|
   150|### Verify the dApp
   151|
   152|```bash
   153|curl http://localhost:3000/api/health
   154|# Should return: { "success": true, "data": { ... } }
   155|```
   156|
   157|Open **http://localhost:3000** in Chrome to see the SIFIX dashboard.
   158|
   159|---
   160|
   161|## Step 4 — Setup sifix-extension (Chrome Extension)
   162|
   163|The Chrome extension intercepts wallet transactions in real-time and routes them through the SIFIX analysis pipeline.
   164|
   165|### 4.1 Install dependencies
   166|
   167|```bash
   168|cd sifix-extension
   169|pnpm install
   170|```
   171|
   172|### 4.2 Build the extension
   173|
   174|```bash
   175|pnpm build
   176|```
   177|
   178|This runs `plasmo build` and outputs the production build to `build/chrome-mv3-prod/`.
   179|
   180|### 4.3 Load in Chrome
   181|
   182|1. Open Chrome and navigate to **`chrome://extensions/`**
   183|2. Enable **Developer mode** using the toggle in the top-right corner
   184|3. Click **"Load unpacked"**
   185|4. Select the `build/chrome-mv3-prod/` directory from your file system
   186|5. The **SIFIX shield icon** will appear in your Chrome toolbar
   187|
   188|### Verify the Extension
   189|
   190|- Click the SIFIX shield icon in the toolbar
   191|- The popup should display the **disconnected** state with a "Connect Wallet" button
   192|- If you see the popup, the extension loaded successfully
   193|
   194|> **Development mode:** For hot-reload during development, run `pnpm dev` and load from `build/chrome-mv3-dev/`. Source changes auto-reload the extension. See [Extension Setup](./extension-setup) for detailed instructions.
   195|
   196|---
   197|
   198|## Step 5 — Add 0G Galileo to MetaMask
   199|
   200|SIFIX operates exclusively on the **0G Galileo Testnet**. Add it to MetaMask:
   201|
   202|**Network details:**
   203|
   204|- **Network Name:** `0G Galileo Testnet`
   205|- **Chain ID:** `16602`
   206|- **RPC URL:** `https://evmrpc-testnet.0g.ai`
   207|- **Block Explorer:** `https://chainscan-galileo.0g.ai`
   208|- **Currency Symbol:** `A0GI`
   209|
   210|**Steps:**
   211|
   212|1. Open MetaMask → click the **network selector** (top-left)
   213|2. Click **"Add network"**
   214|3. Click **"Add a network manually"** (bottom)
   215|4. Enter the values above
   216|5. Click **"Save"**
   217|6. Switch to the **0G Galileo Testnet** network
   218|
   219|**Programmatic addition (dApp integration):**
   220|
   221|```typescript
   222|// wagmi chain configuration used by SIFIX
   223|const sifixChain = {
   224|  id: 16602,
   225|  name: "0G Galileo Testnet",
   226|  nativeCurrency: {
   227|    decimals: 18,
   228|    name: "A0GI",
   229|    symbol: "A0GI",
   230|  },
   231|  rpcUrls: {
   232|    default: { http: ["https://evmrpc-testnet.0g.ai"] },
   233|  },
   234|  blockExplorers: {
   235|    default: { name: "0G Chain Explorer", url: "https://chainscan-galileo.0g.ai" },
   236|  },
   237|};
   238|```
   239|
   240|---
   241|
   242|## Step 6 — End-to-End Verification
   243|
   244|Confirm the full system is working:
   245|
   246|### Agent SDK ✓
   247|
   248|```bash
   249|cd sifix-agent
   250|ls dist/index.js    # File exists → SDK built
   251|```
   252|
   253|### dApp Dashboard ✓
   254|
   255|```bash
   256|curl http://localhost:3000/api/health
   257|# → { "success": true }
   258|```
   259|
   260|Open http://localhost:3000 → click **Connect Wallet** → MetaMask prompts on 0G Galileo.
   261|
   262|### Chrome Extension ✓
   263|
   264|1. Click the SIFIX shield icon → popup opens
   265|2. Click **"Activate via dApp"** → SIWE authentication flow starts
   266|3. Sign the message in MetaMask → extension shows **ACTIVE** status
   267|4. Navigate to any dApp → the floating shield badge appears
   268|
   269|### Full Pipeline Test
   270|
   271|Once all three components are connected:
   272|
   273|1. Visit a dApp on the 0G Galileo Testnet
   274|2. Trigger a transaction (e.g., a token transfer)
   275|3. The extension intercepts the request and shows a pre-flight popup
   276|4. Choose **"Simulate & Analyze"** to run the full pipeline
   277|5. Review the risk analysis — score, threats, AI explanation, and 0G Storage proof
   278|
   279|---
   280|
   281|## Troubleshooting
   282|
   283|### Agent build fails
   284|
   285|```bash
   286|cd sifix-agent
   287|rm -rf node_modules dist
   288|pnpm install
   289|pnpm build
   290|```
   291|
   292|If errors persist, ensure Node.js ≥ 18 and pnpm are up to date.
   293|
   294|### dApp won't start
   295|
   296|- Ensure `DATABASE_URL` is set in `.env`
   297|- Run `pnpm db:push` to create the PostgreSQL database
   298|- Verify `AI_API_KEY` is set (required for the analysis pipeline)
   299|- Check port 3000 is not already in use: `lsof -i :3000`
   300|
   301|### Extension shows "Disconnected"
   302|
   303|- Make sure the dApp is running at `http://localhost:3000`
   304|- Check the **dApp API URL** in the extension settings points to `http://localhost:3000`
   305|- Re-authenticate by clicking **"Activate via dApp"**
   306|
   307|### MetaMask wrong network
   308|
   309|- Switch to **0G Galileo Testnet** (Chain ID: 16602)
   310|- If the network isn't listed, add it manually (see [Step 5](#step-5--add-0g-galileo-to-metamask))
   311|
   312|### 0G Storage uploads failing
   313|
   314|- Set `STORAGE_MOCK_MODE="true"` in `.env` for local development
   315|- For real uploads, ensure `STORAGE_PRIVATE_KEY` is set and the wallet is funded with testnet A0GI
   316|
   317|---
   318|
   319|## Next Steps
   320|
   321|- **[Configuration](./configuration)** — Complete environment variable reference and AI provider setup
   322|- **[Quick Start](./quick-start)** — 5-minute guide to analyzing your first transaction
   323|- **[Extension Setup](./extension-setup)** — Detailed extension build, load, and troubleshooting guide
   324|- **[System Architecture](/architecture/system-overview)** — Deep dive into system design and data flow
   325|