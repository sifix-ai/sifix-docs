---
title: Configuration
description: Complete configuration reference for SIFIX — all 14 environment variables, AI provider setup, storage options, and network settings for the 0G Galileo Testnet.
---

# Configuration

> **TL;DR** — Copy `.env.example` to `.env`, set your `AI_API_KEY` and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, and you're ready for local development. Everything else has sensible defaults.

This guide covers every configuration option in the SIFIX platform. The dApp reads all settings from environment variables — there are **14 variables** controlling database connections, AI providers, 0G Storage, 0G Compute, network endpoints, and agentic identity.

---

## Quick Config — Minimum Viable `.env`

To get started locally, you only need **three required values**:

```bash
# Minimum viable configuration for local development
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-id"
AI_API_KEY="your-ai-api-key"

# Everything below uses sensible defaults for local development:
# NEXT_PUBLIC_ZG_RPC_URL → https://evmrpc-testnet.0g.ai
# NEXT_PUBLIC_ZG_CHAIN_ID → 16602
# AI_MODEL → glm/glm-5.1
# STORAGE_MOCK_MODE → true (no funded wallet needed)
# ZG_INDEXER_URL → https://indexer-storage-testnet-turbo.0g.ai
# NEXT_PUBLIC_AGENTIC_ID_CONTRACT_ADDRESS → 0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F
```

See the [full reference below](#environment-variables-reference) for all 14 variables and their options.

---

## Environment Variables Reference

All variables are defined in the `.env` file at the root of `sifix-dapp`.

### Database

**`DATABASE_URL`**
- **Description:** SQLite connection string for Prisma ORM
- **Default:** `"file:./dev.db"`
- **Required:** Yes
- **Example:** `"file:./dev.db"` or `"file:./production.db"`
- **Notes:** The database file is created relative to the `prisma/` directory. Prisma manages schema migrations automatically via `pnpm db:push`.

---

### WalletConnect

**`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`**
- **Description:** Your WalletConnect Cloud project ID for wallet connection in the dApp
- **Default:** None
- **Required:** Yes
- **Example:** `"a1b2c3d4e5f6..."`
- **How to get one:** Register at [cloud.walletconnect.com](https://cloud.walletconnect.com) and create a new project
- **Notes:** The `NEXT_PUBLIC_` prefix makes this variable available in the browser. Required for the wagmi connector to function.

---

### 0G Network

**`NEXT_PUBLIC_ZG_RPC_URL`**
- **Description:** JSON-RPC endpoint for the 0G Galileo Testnet
- **Default:** `"https://evmrpc-testnet.0g.ai"`
- **Required:** No (has sensible default)
- **Example:** `"https://evmrpc-testnet.0g.ai"`
- **Notes:** Used by viem's `publicClient` for transaction simulation, gas estimation, and state queries. The `NEXT_PUBLIC_` prefix exposes this to the browser extension.

**`NEXT_PUBLIC_ZG_CHAIN_ID`**
- **Description:** Chain ID for the 0G Galileo Testnet
- **Default:** `"16602"`
- **Required:** No
- **Example:** `"16602"`
- **Notes:** Must match the chain ID configured in MetaMask. Used by wagmi for chain switching and transaction routing.

---

### AI Provider

**`AI_API_KEY`**
- **Description:** API key for the OpenAI-compatible AI provider (fallback when 0G Compute is unavailable)
- **Default:** None
- **Required:** Yes (for AI analysis when 0G Compute is not configured)
- **Example:** `"sk-proj-abc123..."` (OpenAI) or `"gsk_xxx..."` (Groq)
- **Notes:** This key is **server-side only** — never exposed to the browser. Works with any OpenAI-compatible provider.

**`AI_BASE_URL`**
- **Description:** Base URL for the OpenAI-compatible API endpoint
- **Default:** `""` (uses OpenAI defaults)
- **Required:** No
- **Examples:**
  - OpenAI: `""` or `"https://api.openai.com/v1"`
  - Groq: `"https://api.groq.com/openai/v1"`
  - OpenRouter: `"https://openrouter.ai/api/v1"`
  - Ollama (local): `"http://localhost:11434/v1"`
  - Together AI: `"https://api.together.xyz/v1"`
- **Notes:** The SIFIX SDK uses the OpenAI SDK as a universal client. Any provider implementing the `/chat/completions` endpoint is compatible.

**`AI_MODEL`**
- **Description:** Model identifier for the AI provider
- **Default:** `"glm/glm-5.1"`
- **Required:** No
- **Examples:**
  - OpenAI: `"gpt-4o"`, `"gpt-4o-mini"`, `"gpt-4-turbo"`
  - Groq: `"llama-3.1-70b-versatile"`, `"mixtral-8x7b-32768"`
  - OpenRouter: `"anthropic/claude-3.5-sonnet"`, `"meta-llama/llama-3.1-70b-instruct"`
  - Ollama: `"llama3.1:70b"`, `"codellama:34b"`
- **Notes:** Larger models provide deeper analysis but with higher latency and cost. For production, `gpt-4o` or `llama-3.1-70b-versatile` are recommended.

---

### 0G Storage

**`ZG_INDEXER_URL`**
- **Description:** URL for the 0G Storage indexer service
- **Default:** `"https://indexer-storage-testnet-turbo.0g.ai"`
- **Required:** No (has sensible default)
- **Example:** `"https://indexer-storage-testnet-turbo.0g.ai"`
- **Notes:** The indexer is used to upload and retrieve analysis reports stored on 0G Storage. The turbo indexer provides faster upload confirmation.

**`STORAGE_PRIVATE_KEY`**
- **Description:** Private key of the wallet used for 0G Storage uploads (server-side only)
- **Default:** None
- **Required:** Only if `STORAGE_MOCK_MODE` is `"false"`
- **Example:** `"0xabcdef1234567890..."`
- **Notes:** This wallet must be funded with testnet A0GI tokens to pay for storage operations. **Never commit this value to git.** The `.env` file is excluded via `.gitignore`.

**`STORAGE_MOCK_MODE`**
- **Description:** Toggle between real 0G Storage uploads and mock mode
- **Default:** `"true"`
- **Required:** No
- **Values:** `"true"` (mock — uses deterministic keccak256 hashes, no on-chain writes) | `"false"` (real uploads to 0G Storage)
- **Notes:** Use `"true"` for local development and testing. Set to `"false"` only when you have a funded wallet in `STORAGE_PRIVATE_KEY`.

---

### 0G Compute

**`COMPUTE_PRIVATE_KEY`**
- **Description:** Private key for 0G Compute broker interactions (decentralized AI inference)
- **Default:** None
- **Required:** Only if using 0G Compute as the primary AI provider
- **Example:** `"0x1234567890abcdef..."`
- **Notes:** Must be funded with testnet A0GI and have deposits transferred to the compute provider. This is separate from `STORAGE_PRIVATE_KEY`.

**`COMPUTE_PROVIDER_ADDRESS`**
- **Description:** Address of the 0G Compute provider to use for AI inference
- **Default:** None
- **Required:** Only if using 0G Compute
- **Example:** `"0xProviderAddress..."`
- **How to find providers:** Run `0g-compute-cli inference list-providers`

**Setting up 0G Compute (optional, for decentralized AI):**

```bash
# Step 1: List available compute providers
0g-compute-cli inference list-providers

# Step 2: Deposit funds to the compute broker
0g-compute-cli deposit --amount 10

# Step 3: Transfer funds to your chosen provider
0g-compute-cli transfer-fund --provider <ADDRESS> --amount 5

# Step 4: Set COMPUTE_PROVIDER_ADDRESS in .env
```

---

### Agentic Identity (ERC-7857)

**`NEXT_PUBLIC_AGENTIC_ID_CONTRACT_ADDRESS`**
- **Description:** Address of the ERC-7857 Agentic ID contract on 0G Galileo
- **Default:** `"0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F"`
- **Required:** No (has sensible default)
- **Notes:** This is the on-chain contract that mints and manages SIFIX's verifiable agent identity. The default value points to the deployed contract on 0G Galileo.

**`NEXT_PUBLIC_AGENTIC_ID_TOKEN_ID`**
- **Description:** Token ID of the minted agent identity NFT
- **Default:** `""` (disabled)
- **Required:** No
- **Example:** `"99"`
- **Notes:** Set this after minting an Agentic ID NFT. When empty, the Agentic Identity guard is disabled. When set to `"99"`, SIFIX uses the minted on-chain identity for verifiable security decisions.

---

## `.env.example` Template

Copy this template to `.env` and fill in your values:

```bash
# ===========================================
# SIFIX dApp — Environment Configuration
# ===========================================

# Database (Prisma + PostgreSQL)
DATABASE_URL="postgresql://user:password@127.0.0.1:5432/sifix"

# WalletConnect (required for wallet connection)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-id"

# 0G Galileo Network
NEXT_PUBLIC_ZG_RPC_URL="https://evmrpc-testnet.0g.ai"
NEXT_PUBLIC_ZG_CHAIN_ID="16602"

# AI Provider (OpenAI-compatible endpoint)
AI_API_KEY="your-ai-api-key"
AI_BASE_URL=""
AI_MODEL="glm/glm-5.1"

# 0G Storage
ZG_INDEXER_URL="https://indexer-storage-testnet-turbo.0g.ai"
STORAGE_PRIVATE_KEY=""
STORAGE_MOCK_MODE="true"

# 0G Compute (optional — decentralized AI inference)
COMPUTE_PRIVATE_KEY=""
COMPUTE_PROVIDER_ADDRESS=""

# Agentic Identity (ERC-7857)
NEXT_PUBLIC_AGENTIC_ID_CONTRACT_ADDRESS="0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F"
NEXT_PUBLIC_AGENTIC_ID_TOKEN_ID=""
```

---

## AI Provider Configuration

SIFIX supports five AI providers through the OpenAI-compatible SDK interface. The `AI_BASE_URL` and `AI_MODEL` variables control which provider is used.

### 0G Compute (Primary — Recommended)

0G Compute provides decentralized AI inference directly on the 0G infrastructure. This is the primary provider for production use.

```bash
# No AI_BASE_URL needed — 0G Compute is accessed via COMPUTE_* variables
AI_API_KEY=""                        # Not used for 0G Compute
COMPUTE_PRIVATE_KEY="0xYourKey..."   # Funded wallet for compute
COMPUTE_PROVIDER_ADDRESS="0xProvider..."
```

**When to use:** Production deployments on 0G Galileo. Lowest latency, no external API dependency.

### OpenAI

```bash
AI_API_KEY="sk-proj-abc123..."
AI_BASE_URL=""                       # Uses default OpenAI endpoint
AI_MODEL="gpt-4o"
```

**When to use:** Reliable fallback. Best reasoning quality for complex DeFi transaction analysis.

### Groq

```bash
AI_API_KEY="gsk_abc123..."
AI_BASE_URL="https://api.groq.com/openai/v1"
AI_MODEL="llama-3.1-70b-versatile"
```

**When to use:** Ultra-low latency (under 200ms). Ideal for simple transfers and real-time scoring.

### OpenRouter

```bash
AI_API_KEY="sk-or-abc123..."
AI_BASE_URL="https://openrouter.ai/api/v1"
AI_MODEL="anthropic/claude-3.5-sonnet"
```

**When to use:** Access to multiple models through a single API. Useful for A/B testing different models.

### Ollama (Local)

```bash
AI_API_KEY="ollama"                  # Any non-empty value
AI_BASE_URL="http://localhost:11434/v1"
AI_MODEL="llama3.1:70b"
```

**When to use:** Privacy-sensitive scenarios where no transaction data should leave your machine. Requires [Ollama](https://ollama.ai) installed locally with the model pulled.

**Model routing logic:** The SIFIX SDK automatically selects the optimal provider based on:
1. Transaction complexity (calldata depth, number of internal calls)
2. User privacy preferences
3. Provider availability (fallback chain if primary is down)
4. Latency requirements (timeout budget per analysis step)

---

## Storage Configuration

### Real 0G Storage

For production use, SIFIX stores analysis reports immutably on 0G Storage:

```bash
STORAGE_MOCK_MODE="false"
STORAGE_PRIVATE_KEY="0xYourFundedWalletKey..."
ZG_INDEXER_URL="https://indexer-storage-testnet-turbo.0g.ai"
```

**Requirements:**
- The wallet must be funded with testnet A0GI tokens
- Use the 0G faucet or community channels to obtain testnet tokens
- Each storage upload consumes a small amount of A0GI for gas

**What gets stored:**
- Full analysis results (risk score, threats, AI reasoning)
- Simulation state changes
- Threat intelligence matches
- Timestamp and metadata

**Retrieval:** Stored analyses can be retrieved via the indexer URL and verified against the on-chain root hash.

### Mock Mode

For local development and testing:

```bash
STORAGE_MOCK_MODE="true"
STORAGE_PRIVATE_KEY=""               # Not needed in mock mode
```

Mock mode skips all on-chain operations and returns deterministic keccak256 hashes. The analysis pipeline runs normally — only the final storage step is mocked.

---

## Network Configuration

SIFIX is configured for the **0G Galileo Testnet**:

| Property | Value |
|----------|-------|
| Network Name | 0G Galileo Testnet |
| Chain ID | `16602` |
| RPC URL | `https://evmrpc-testnet.0g.ai` |
| Block Explorer | `https://chainscan-galileo.0g.ai` |
| Currency | A0GI (18 decimals) |
| Agentic ID Contract | `0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F` |
| Token ID | `99` |

These values are set via `NEXT_PUBLIC_ZG_RPC_URL` and `NEXT_PUBLIC_ZG_CHAIN_ID`. Changing these is not recommended — SIFIX is purpose-built for the 0G Galileo Testnet.

---

## Tips and Common Pitfalls

### Do's

- **Copy `.env.example` to `.env`** — Never edit `.env.example` directly
- **Use `STORAGE_MOCK_MODE="true"`** for local development — avoids needing funded wallets
- **Set `AI_API_KEY`** even if you plan to use 0G Compute — it serves as the fallback provider
- **Keep private keys out of git** — The `.env` file is in `.gitignore` by default
- **Fund your compute wallet** before setting `COMPUTE_PROVIDER_ADDRESS`

### Don'ts

- **Don't commit `.env` to git** — Use `.env.example` for sharing configuration templates
- **Don't use production private keys** on testnet — Generate separate keys for development
- **Don't mix up storage and compute keys** — `STORAGE_PRIVATE_KEY` and `COMPUTE_PRIVATE_KEY` serve different purposes
- **Don't change `NEXT_PUBLIC_ZG_CHAIN_ID`** — SIFIX only operates on 0G Galileo (Chain ID: 16602)

### Common Issues

**"AI analysis timeout"**
- Check that `AI_API_KEY` is valid and the provider is reachable
- If using Ollama, ensure the service is running: `ollama serve`
- Increase timeout in the agent configuration if analyzing complex transactions

**"Storage upload failed"**
- Set `STORAGE_MOCK_MODE="true"` to bypass on-chain uploads
- If using real storage, verify `STORAGE_PRIVATE_KEY` wallet has A0GI balance
- Check `ZG_INDEXER_URL` is accessible: `curl https://indexer-storage-testnet-turbo.0g.ai/health`

**"WalletConnect not connecting"**
- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
- Create a project at [cloud.walletconnect.com](https://cloud.walletconnect.com)
- Remember that `NEXT_PUBLIC_` variables require a server restart to take effect

**"Wrong chain" errors in MetaMask**
- Ensure MetaMask is switched to 0G Galileo (Chain ID: 16602)
- Verify `NEXT_PUBLIC_ZG_CHAIN_ID="16602"` in `.env`

---

## Next Steps

- **[Quick Start](./quick-start)** — Analyze your first transaction in 5 minutes
- **[Installation](./installation)** — Full platform setup guide
- **[Extension Setup](./extension-setup)** — Detailed Chrome extension configuration
- **[Deployment](./deployment)** — Production deployment guide
