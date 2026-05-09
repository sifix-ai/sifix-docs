---
title: Installation
description: Complete installation guide for the SIFIX platform — clone all three repositories, build the agent SDK, launch the dApp dashboard, and load the Chrome extension on the 0G Galileo Testnet.
---

# Installation

This guide covers installing the **complete SIFIX platform** from source. You'll set up all three components — the agent SDK, the web dashboard, and the Chrome extension — and verify they work together on the **0G Galileo Testnet** (Chain ID: `16602`).

**Time to complete:** ~15 minutes

---

## Prerequisites

Ensure your system meets these requirements before starting:

- **Node.js** ≥ 18 — [Download](https://nodejs.org/) (LTS recommended)
- **pnpm** — Install globally: `npm install -g pnpm`
- **Git** — [Download](https://git-scm.com/)
- **Chrome** ≥ 116 — Required for Manifest V3 extension support
- **MetaMask** — [Install](https://metamask.io/) and create or import a wallet

Verify your environment:

```bash
node --version    # v18.x.x or higher
pnpm --version    # 8.x.x or higher
git --version     # 2.x.x
```

---

## Step 1 — Clone All Repositories

SIFIX is organized as three independent repositories. Clone them into a shared workspace:

```bash
# Create workspace
mkdir sifix-repos && cd sifix-repos

# Clone all three repos
git clone https://github.com/sifix-xyz/sifix-agent.git
git clone https://github.com/sifix-xyz/sifix-dapp.git
git clone https://github.com/sifix-xyz/sifix-extension.git
```

Expected workspace structure:

```
sifix-repos/
├── sifix-agent/       # Core SDK — simulation engine, AI routing, risk scoring
├── sifix-dapp/        # Web dashboard + REST API (Next.js 16)
└── sifix-extension/   # Chrome extension (MV3) — real-time wallet protection
```

---

## Step 2 — Setup sifix-agent (Core SDK)

The agent SDK is the security analysis engine. Build it **first** — the dApp and extension depend on it.

```bash
cd sifix-agent

# Install dependencies
pnpm install

# Build the SDK
pnpm build
```

### Verify the Agent Build

```bash
# Confirm the dist output exists
ls dist/
# Should show: index.js  index.d.ts  and other compiled files
```

**Quick smoke test (optional):**

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  rpcUrl: "https://evmrpc-testnet.0g.ai",
  aiProvider: {
    apiKey: "test-key",
    model: "gpt-4o",
  },
  storage: {
    mockMode: true,
  },
});

await agent.init();
console.log("✅ SIFIX Agent initialized successfully");
```

> **Note:** The smoke test requires a valid `AI_API_KEY` for full initialization. Use `mockMode: true` to skip on-chain operations.

---

## Step 3 — Setup sifix-dapp (Dashboard)

The dApp is a Next.js 16 full-stack application serving the web dashboard and the REST API backend (35 routes).

### 3.1 Install dependencies

```bash
cd sifix-dapp
pnpm install
```

### 3.2 Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and configure the required variables. At minimum, set:

```bash
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-id"
AI_API_KEY="your-ai-api-key"
```

> See [Configuration](./configuration.md) for the complete list of 14 environment variables with descriptions and defaults.

### 3.3 Initialize the database

The dApp uses Prisma with SQLite. Create the database and push the schema:

```bash
pnpm db:push
```

This creates `prisma/dev.db` with all 13 models (Address, ThreatReport, TransactionScan, ScanHistory, etc.).

### 3.4 Start the development server

```bash
pnpm dev
```

### Verify the dApp

```bash
curl http://localhost:3000/api/health
# Should return: { "success": true, "data": { ... } }
```

Open **http://localhost:3000** in Chrome to see the SIFIX dashboard.

---

## Step 4 — Setup sifix-extension (Chrome Extension)

The Chrome extension intercepts wallet transactions in real-time and routes them through the SIFIX analysis pipeline.

### 4.1 Install dependencies

```bash
cd sifix-extension
pnpm install
```

### 4.2 Build the extension

```bash
pnpm build
```

This runs `plasmo build` and outputs the production build to `build/chrome-mv3-prod/`.

### 4.3 Load in Chrome

1. Open Chrome and navigate to **`chrome://extensions/`**
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click **"Load unpacked"**
4. Select the `build/chrome-mv3-prod/` directory from your file system
5. The **SIFIX shield icon** will appear in your Chrome toolbar

### Verify the Extension

- Click the SIFIX shield icon in the toolbar
- The popup should display the **disconnected** state with a "Connect Wallet" button
- If you see the popup, the extension loaded successfully

> **Development mode:** For hot-reload during development, run `pnpm dev` and load from `build/chrome-mv3-dev/`. Source changes auto-reload the extension. See [Extension Setup](./extension-setup.md) for detailed instructions.

---

## Step 5 — Add 0G Galileo to MetaMask

SIFIX operates exclusively on the **0G Galileo Testnet**. Add it to MetaMask:

**Network details:**

- **Network Name:** `0G Galileo Testnet`
- **Chain ID:** `16602`
- **RPC URL:** `https://evmrpc-testnet.0g.ai`
- **Block Explorer:** `https://chainscan-galileo.0g.ai`
- **Currency Symbol:** `A0GI`

**Steps:**

1. Open MetaMask → click the **network selector** (top-left)
2. Click **"Add network"**
3. Click **"Add a network manually"** (bottom)
4. Enter the values above
5. Click **"Save"**
6. Switch to the **0G Galileo Testnet** network

**Programmatic addition (dApp integration):**

```typescript
// wagmi chain configuration used by SIFIX
const sifixChain = {
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "A0GI",
    symbol: "A0GI",
  },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "0G Chain Explorer", url: "https://chainscan-galileo.0g.ai" },
  },
};
```

---

## Step 6 — End-to-End Verification

Confirm the full system is working:

### Agent SDK ✓

```bash
cd sifix-agent
ls dist/index.js    # File exists → SDK built
```

### dApp Dashboard ✓

```bash
curl http://localhost:3000/api/health
# → { "success": true }
```

Open http://localhost:3000 → click **Connect Wallet** → MetaMask prompts on 0G Galileo.

### Chrome Extension ✓

1. Click the SIFIX shield icon → popup opens
2. Click **"Activate via dApp"** → SIWE authentication flow starts
3. Sign the message in MetaMask → extension shows **ACTIVE** status
4. Navigate to any dApp → the floating shield badge appears

### Full Pipeline Test

Once all three components are connected:

1. Visit a dApp on the 0G Galileo Testnet
2. Trigger a transaction (e.g., a token transfer)
3. The extension intercepts the request and shows a pre-flight popup
4. Choose **"Simulate & Analyze"** to run the full pipeline
5. Review the risk analysis — score, threats, AI explanation, and 0G Storage proof

---

## Troubleshooting

### Agent build fails

```bash
cd sifix-agent
rm -rf node_modules dist
pnpm install
pnpm build
```

If errors persist, ensure Node.js ≥ 18 and pnpm are up to date.

### dApp won't start

- Ensure `DATABASE_URL` is set in `.env`
- Run `pnpm db:push` to create the SQLite database
- Verify `AI_API_KEY` is set (required for the analysis pipeline)
- Check port 3000 is not already in use: `lsof -i :3000`

### Extension shows "Disconnected"

- Make sure the dApp is running at `http://localhost:3000`
- Check the **dApp API URL** in the extension settings points to `http://localhost:3000`
- Re-authenticate by clicking **"Activate via dApp"**

### MetaMask wrong network

- Switch to **0G Galileo Testnet** (Chain ID: 16602)
- If the network isn't listed, add it manually (see [Step 5](#step-5--add-0g-galileo-to-metamask))

### 0G Storage uploads failing

- Set `STORAGE_MOCK_MODE="true"` in `.env` for local development
- For real uploads, ensure `STORAGE_PRIVATE_KEY` is set and the wallet is funded with testnet A0GI

---

## Next Steps

- **[Configuration](./configuration.md)** — Complete environment variable reference and AI provider setup
- **[Quick Start](./quick-start.md)** — 5-minute guide to analyzing your first transaction
- **[Extension Setup](./extension-setup.md)** — Detailed extension build, load, and troubleshooting guide
- **[Architecture](/architecture/)** — Deep dive into system design and data flow
