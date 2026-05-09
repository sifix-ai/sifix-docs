---
title: Getting Started
description: Set up the full SIFIX platform locally — clone all three repositories, configure the 0G Galileo testnet, and run the agent SDK, dApp dashboard, and Chrome extension end-to-end.
---

# Getting Started

This guide walks you through setting up the **complete SIFIX platform** on your local machine. You'll clone all three repositories, configure the 0G Galileo Testnet, and have the agent SDK, web dashboard, and Chrome extension running together.

**What you'll have running:**

- **sifix-agent** — The core security analysis SDK (`@sifix/agent`)
- **sifix-dapp** — Next.js 16 dashboard with 35 API routes and 12 pages
- **sifix-extension** — Chrome MV3 extension that intercepts wallet transactions

---

## Prerequisites

Before you begin, make sure your system has the following:

- **Node.js** ≥ 18 — [Download](https://nodejs.org/)
- **pnpm** — Install with `npm install -g pnpm`
- **Git** — [Download](https://git-scm.com/)
- **Chrome** ≥ 116 — Required for Manifest V3 extension support
- **MetaMask** — [Install the extension](https://metamask.io/) and set up a wallet
- **0G Galileo Testnet** — Configured in MetaMask (see [Add 0G Galileo to MetaMask](#add-0g-galileo-to-metamask))

---

## Add 0G Galileo to MetaMask

SIFIX operates entirely on the **0G Galileo Testnet**. Add the network to MetaMask before proceeding:

**Network details:**

- **Network Name:** 0G Galileo Testnet
- **Chain ID:** `16602`
- **RPC URL:** `https://evmrpc-testnet.0g.ai`
- **Block Explorer:** `https://chainscan-galileo.0g.ai`
- **Currency Symbol:** `A0GI`

**Steps:**

1. Open MetaMask → click the network selector → **Add Network**
2. Click **Add a network manually**
3. Fill in the fields above
4. Click **Save**
5. Switch to the 0G Galileo Testnet network

You can also add it programmatically in your dApp using the wagmi chain config:

```typescript
import { SIFIX_CHAIN } from "./config/chains";

// SIFIX_CHAIN contains:
// {
//   id: 16602,
//   name: "0G Galileo Testnet",
//   nativeCurrency: { decimals: 18, name: "A0GI", symbol: "A0GI" },
//   rpcUrls: { default: { http: ["https://evmrpc-testnet.0g.ai"] } },
//   blockExplorers: { default: { name: "0G Chain Explorer", url: "https://chainscan-galileo.0g.ai" } },
// }
```

---

## Clone All Repositories

SIFIX is organized as three independent repositories. Clone them into a shared parent directory:

```bash
# Create a workspace directory
mkdir sifix-repos && cd sifix-repos

# Clone all three repos
git clone https://github.com/sifix-xyz/sifix-agent.git
git clone https://github.com/sifix-xyz/sifix-dapp.git
git clone https://github.com/sifix-xyz/sifix-extension.git
```

Your workspace should look like this:

```
sifix-repos/
├── sifix-agent/       # Core SDK
├── sifix-dapp/        # Web dashboard + API
└── sifix-extension/   # Chrome extension
```

---

## Setup sifix-agent

The agent SDK provides the security analysis engine — transaction simulation, AI risk analysis, 0G Storage uploads, and threat intelligence.

```bash
cd sifix-agent

# Install dependencies
pnpm install

# Build the SDK
pnpm build
```

This produces the `@sifix/agent` package. The dApp references it locally, so build it **before** setting up the dApp.

**Verify the build:**

```bash
# Check that the dist output exists
ls dist/
# Should show: index.js  index.d.ts  ...
```

**Quick test (optional):**

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  rpcUrl: "https://evmrpc-testnet.0g.ai",
  aiProvider: {
    apiKey: "test-key",
    model: "gpt-4o",
  },
  storage: {
    mockMode: true, // Skip on-chain writes during development
  },
});

await agent.init();
console.log("SIFIX Agent initialized successfully");
```

---

## Setup sifix-dapp

The dApp is a Next.js 16 application that serves as both the web dashboard and the REST API backend for the extension.

### 1. Install dependencies

```bash
cd sifix-dapp

pnpm install
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and configure all variables. See the [Environment Variables](#environment-variables) section below for detailed descriptions.

### 3. Push the database schema

The dApp uses Prisma with SQLite. Create the database and apply the schema:

```bash
pnpm db:push
```

This creates a `prisma/dev.db` file with all 13 models (Address, ThreatReport, TransactionScan, ScanHistory, etc.).

### 4. Start the development server

```bash
pnpm dev
```

The dApp will be available at **`http://localhost:3000`**.

**Verify it's running:**

```bash
curl http://localhost:3000/api/health
# Should return: { "success": true, "data": { ... } }
```

---

## Environment Variables

All environment variables are defined in the `.env` file at the root of `sifix-dapp`. Here's a complete reference:

### Database

- **`DATABASE_URL`** — SQLite connection string for Prisma. Default: `"file:./dev.db"`

### WalletConnect

- **`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`** — Your WalletConnect Cloud project ID. Get one at [cloud.walletconnect.com](https://cloud.walletconnect.com). Required for wallet connection in the dApp.

### 0G Network

- **`NEXT_PUBLIC_ZG_RPC_URL`** — RPC endpoint for 0G Galileo Testnet. Default: `"https://evmrpc-testnet.0g.ai"`
- **`NEXT_PUBLIC_ZG_CHAIN_ID`** — Chain ID for the 0G Galileo Testnet. Default: `"16602"`

### AI Provider

- **`AI_API_KEY`** — API key for the OpenAI-compatible fallback AI provider (OpenAI, Groq, OpenRouter, Together AI, or Ollama). **Required** for AI analysis when 0G Compute is not configured.
- **`AI_BASE_URL`** — Base URL for the OpenAI-compatible API endpoint. Leave empty to use OpenAI defaults. Examples: `"https://api.groq.com/openai/v1"`, `"http://localhost:11434/v1"` (Ollama), `"https://openrouter.ai/api/v1"`. Default model is `"glm/glm-5.1"`.
- **`AI_MODEL`** — Model name for the AI provider. Examples: `"gpt-4o"`, `"llama-3.1-70b-versatile"`, `"llama3.1:70b"`.

### 0G Storage

- **`ZG_INDEXER_URL`** — URL for the 0G Storage indexer service. Default: `"https://indexer-storage-testnet-turbo.0g.ai"`
- **`STORAGE_PRIVATE_KEY`** — Private key of the wallet used for 0G Storage uploads (server-side only, never exposed to the browser). Fund this wallet with testnet A0GI tokens.
- **`STORAGE_MOCK_MODE`** — Set to `"true"` to skip on-chain storage writes and use deterministic keccak256 hashes instead. Ideal for local development. Set to `"false"` for real 0G Storage uploads. Default: `"true"`

### 0G Compute

- **`COMPUTE_PRIVATE_KEY`** — Private key for 0G Compute broker interactions (decentralized AI inference). Must be funded with testnet A0GI and have deposits transferred to the provider.
- **`COMPUTE_PROVIDER_ADDRESS`** — Address of the 0G Compute provider to use. Find available providers with: `0g-compute-cli inference list-providers`

**Setting up 0G Compute (optional, for decentralized AI):**

```bash
# Step 1: List available compute providers
0g-compute-cli inference list-providers

# Step 2: Deposit funds
0g-compute-cli deposit --amount 10

# Step 3: Transfer funds to your chosen provider
0g-compute-cli transfer-fund --provider <ADDRESS> --amount 5

# Step 4: Set COMPUTE_PROVIDER_ADDRESS in .env
```

### Agentic Identity (ERC-7857)

- **`NEXT_PUBLIC_AGENTIC_ID_CONTRACT_ADDRESS`** — Address of the ERC-7857 Agentic ID contract on 0G Galileo. Default: `"0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F"`
- **`NEXT_PUBLIC_AGENTIC_ID_TOKEN_ID`** — Token ID of the minted agent identity. Set after minting an Agentic ID NFT. Leave empty to disable the Agentic ID guard.

### Minimal `.env` for local development

```bash
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-id"
NEXT_PUBLIC_ZG_RPC_URL="https://evmrpc-testnet.0g.ai"
NEXT_PUBLIC_ZG_CHAIN_ID="16602"
AI_API_KEY="your-ai-api-key"
AI_BASE_URL=""
AI_MODEL="glm/glm-5.1"
ZG_INDEXER_URL="https://indexer-storage-testnet-turbo.0g.ai"
STORAGE_PRIVATE_KEY=""
STORAGE_MOCK_MODE="true"
COMPUTE_PRIVATE_KEY=""
COMPUTE_PROVIDER_ADDRESS=""
NEXT_PUBLIC_AGENTIC_ID_CONTRACT_ADDRESS="0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F"
NEXT_PUBLIC_AGENTIC_ID_TOKEN_ID=""
```

---

## Setup sifix-extension

The Chrome extension intercepts wallet transactions and routes them through the SIFIX agent for analysis.

### 1. Install dependencies

```bash
cd sifix-extension

pnpm install
```

### 2. Build the extension

```bash
pnpm build
```

This runs `plasmo build` and copies the pre-compiled `tx-interceptor.js` into the build output. The production build is output to `build/chrome-mv3-prod/`.

### 3. Load in Chrome

1. Open Chrome and go to **`chrome://extensions/`**
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `build/chrome-mv3-prod/` directory
5. The SIFIX shield icon will appear in your toolbar

> **Development mode:** For hot-reload during development, run `pnpm dev` instead and load from `build/chrome-mv3-dev/`. Changes to `src/` files will auto-reload the extension.

---

## Connect Flow

Once all three components are running, here's how to connect everything end-to-end:

### 1. Open the dApp

Navigate to **`http://localhost:3000`** in Chrome. You'll see the SIFIX landing page.

### 2. Connect your wallet

Click **Connect Wallet** in the dApp navbar. MetaMask will prompt you to connect — make sure you're on the **0G Galileo Testnet** (Chain ID: 16602).

### 3. Activate the extension

1. Click the **SIFIX shield icon** in your Chrome toolbar to open the extension popup
2. Click **Activate via dApp** — this opens the extension activation page
3. The dApp will perform a **Sign-In with Ethereum (SIWE)** flow:
   - Prompt you to sign a message in MetaMask
   - Issue a JWT token
   - Pass the token to the extension via `postMessage`
4. Once authenticated, the extension popup will show your wallet address and **ACTIVE** status

### 4. Browse with protection

After activation, the extension will:

- **Scan every domain** you visit with a multi-layer safety check (local blacklist → SIFIX API → GoPlus fallback)
- **Show a shield badge** on every page indicating safety status (SAFE / WARN / RISK)
- **Display warning banners** on dangerous dApp pages

### 5. Intercept transactions

When you interact with any dApp and trigger a wallet action:

1. The **tx-interceptor** (injected before page scripts) captures the request
2. A pre-flight popup appears: *Simulate & Analyze* / *Proceed to Wallet* / *Cancel*
3. If you choose **Analyze**, the transaction is sent to `POST /api/v1/extension/analyze`
4. The agent simulates the TX on 0G Galileo, runs AI risk analysis, and uploads evidence to 0G Storage
5. A risk modal shows the full analysis — risk level, score, AI explanation, detected threats, and 0G Storage proof
6. You decide: **proceed** to MetaMask or **block** the transaction

---

## Troubleshooting

### Agent build fails

```bash
cd sifix-agent
rm -rf node_modules dist
pnpm install
pnpm build
```

### dApp won't start

- Ensure `DATABASE_URL` is set in `.env`
- Run `pnpm db:push` to create the database
- Check that `AI_API_KEY` is set (required for the analysis pipeline)

### Extension shows "Disconnected"

- Make sure the dApp is running at `http://localhost:3000`
- Check the **dApp API URL** in the extension settings
- Re-authenticate by clicking **Activate via dApp** again

### MetaMask wrong network

- Switch to **0G Galileo Testnet** (Chain ID: 16602)
- If the network isn't added, see [Add 0G Galileo to MetaMask](#add-0g-galileo-to-metamask) above

### 0G Storage uploads failing

- Set `STORAGE_MOCK_MODE="true"` for local development
- For real uploads, ensure `STORAGE_PRIVATE_KEY` is set and funded with testnet A0GI

---

## Next Steps

- **[Architecture Deep Dive](/architecture)** — Understand every component, data flow, and API route
- **[API Reference](/api)** — Complete SDK and REST API documentation
- **[Contributing](/contributing)** — How to contribute to the SIFIX project
