---
title: Quick Start
description: Get SIFIX running and analyze your first transaction in 5 minutes — install the SDK, initialize the agent, run an analysis, interpret results, and connect the Chrome extension.
---

# Quick Start

> **TL;DR** — `pnpm add @sifix/agent`, create a `SecurityAgent` with your API key, call `agent.analyzeTransaction()` with transaction params, and read the risk score + recommendation from the result.

Get from zero to your first AI-powered transaction analysis in **5 minutes**. This guide walks you through installing the SDK, initializing the agent, analyzing a transaction, and understanding the results.

---

> **📋 Prerequisites**
>
> Before you begin, make sure you have:
>
> - **Node.js** ≥ 18 installed — [Download](https://nodejs.org/)
> - **pnpm** package manager — `npm install -g pnpm`
> - **An AI API key** from any OpenAI-compatible provider (OpenAI, Groq, OpenRouter, or local Ollama)

---

## Step 1 — Install the SDK

```bash
pnpm add @sifix/agent
```

Or with npm:

```bash
npm install @sifix/agent
```

Or with yarn:

```bash
yarn add @sifix/agent
```

---

## Step 2 — Initialize the Agent

Create a new file (e.g., `analyze.ts`) and initialize the SIFIX Security Agent:

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  // 0G Galileo Testnet configuration
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
    name: "0G Galileo Testnet",
  },

  // AI provider — use your preferred OpenAI-compatible endpoint
  aiProvider: {
    apiKey: process.env.AI_API_KEY!,
    baseUrl: process.env.AI_BASE_URL || undefined,
    model: process.env.AI_MODEL || "gpt-4o",
  },

  // Storage — mock mode for quick start (no funded wallet needed)
  storage: {
    mockMode: true,
  },

  // Agentic Identity on 0G Galileo
  identity: {
    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
    tokenId: 99,
  },
});

// Initialize the agent (validates config, establishes connections)
await agent.init();
console.log("✅ SIFIX Agent initialized");
```

**Required environment variables:**

```bash
export AI_API_KEY="sk-your-api-key-here"
```

Optional for other providers:

```bash
export AI_BASE_URL="https://api.groq.com/openai/v1"   # For Groq
export AI_MODEL="llama-3.1-70b-versatile"               # Model name
```

---

## Step 3 — Analyze Your First Transaction

Analyze a suspicious token transfer:

```typescript
const result = await agent.analyzeTransaction({
  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  data: "0xa9059cbb000000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA960450000000000000000000000000000000000000000000000000de0b6b3a7640000",
  value: "0",
});
```

This example analyzes an ERC-20 `transfer` call moving 1 ETH worth of tokens to an address. The agent will:

1. **Simulate** the transaction against a forked 0G Galileo node
2. **Decode** the calldata to identify the function call and parameters
3. **Look up** threat intelligence for both addresses
4. **Run AI analysis** to classify risk
5. **Score** the transaction on a 0–100 risk scale

---

## Step 4 — Interpret the Results

The `analyzeTransaction` method returns an `AnalysisResult` object:

```typescript
console.log(result.analysis.riskScore);       // 0–100 (0 = safe, 100 = critical)
console.log(result.analysis.confidence);      // 0.0–1.0 (AI confidence level)
console.log(result.analysis.recommendation);  // "allow" | "warn" | "block"
console.log(result.analysis.reasoning);       // Human-readable explanation
console.log(result.analysis.provider);        // "galileo" | "openai" | "fallback"
```

### Risk Score Tiers

| Score | Tier | Label | Action |
|-------|------|-------|--------|
| 0–20 | 0 | ✅ **SAFE** | Auto-approve — no threat indicators |
| 21–40 | 1 | 🟢 **LOW** | Approve with minor flags — informational |
| 41–60 | 2 | 🟡 **MEDIUM** | Warn user — suspicious patterns present |
| 61–80 | 3 | 🟠 **HIGH** | Block TX — likely malicious, require override |
| 81–100 | 4 | 🔴 **CRITICAL** | Hard block — confirmed exploit or attack |

### Example Output — Safe Transaction

```json
{
  "analysis": {
    "riskScore": 12,
    "confidence": 0.94,
    "recommendation": "allow",
    "reasoning": "Standard ERC-20 token transfer to a known address. No suspicious patterns detected. The recipient has a clean transaction history with no scam associations.",
    "threats": [],
    "provider": "galileo"
  },
  "simulation": {
    "success": true,
    "gasUsed": 52341,
    "gasEstimate": 65000,
    "logs": [
      { "event": "Transfer", "from": "0x742d...", "to": "0xd8dA...", "value": "1000000000000000000" }
    ],
    "stateChanges": [
      { "type": "balance", "address": "0x742d...", "change": "-1.0 TOKEN" },
      { "type": "balance", "address": "0xd8dA...", "change": "+1.0 TOKEN" }
    ]
  },
  "threatIntel": {
    "fromAddress": { "riskScore": 5, "labels": [] },
    "toAddress": { "riskScore": 8, "labels": [] },
    "relatedScamDomains": [],
    "knownExploitSignatures": []
  },
  "timestamp": "2026-05-09T20:15:00Z",
  "storageRootHash": "0xabc123...",
  "computeProvider": "galileo"
}
```

### Example Output — Dangerous Transaction

```json
{
  "analysis": {
    "riskScore": 92,
    "confidence": 0.97,
    "recommendation": "block",
    "reasoning": "CRITICAL: This transaction calls an unlimited approval function (approve) granting the recipient address full control over the sender's token balance. The recipient is flagged in threat intelligence as a known drain contract with 47 prior victim reports. This is a classic approval drain scam.",
    "threats": [
      {
        "type": "unlimited_approval",
        "severity": "critical",
        "description": "Unlimited ERC-20 approval to a flagged address"
      },
      {
        "type": "known_drain_contract",
        "severity": "critical",
        "description": "Recipient is a confirmed drain contract (47 reports)"
      }
    ],
    "provider": "galileo"
  },
  "simulation": {
    "success": true,
    "gasUsed": 46213,
    "stateChanges": [
      {
        "type": "approval",
        "owner": "0x742d...",
        "spender": "0xA0b8...",
        "amount": "UNLIMITED (type(uint256).max)"
      }
    ]
  },
  "threatIntel": {
    "fromAddress": { "riskScore": 5, "labels": [] },
    "toAddress": { "riskScore": 95, "labels": ["drain", "phishing", "approval-scam"] },
    "relatedScamDomains": ["evil-phishing-dapp.com", "fake-airdrop.io"],
    "knownExploitSignatures": ["ERC20_APPROVAL_DRAIN", "UNLIMITED_SPENDER"]
  },
  "timestamp": "2026-05-09T20:16:30Z",
  "storageRootHash": "0xdef456...",
  "computeProvider": "openai"
}
```

---

## Step 5 — Connect the Chrome Extension

For real-time wallet protection, connect the Chrome extension:

### 5.1 Build and load the extension

```bash
git clone https://github.com/sifix-xyz/sifix-extension.git
cd sifix-extension
pnpm install
pnpm build
```

Load in Chrome:
1. Open **`chrome://extensions/`**
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `build/chrome-mv3-prod/`

### 5.2 Activate the extension

1. Open the SIFIX dashboard at **http://localhost:3000** (requires the dApp to be running)
2. Click the **SIFIX shield icon** in Chrome's toolbar
3. Click **"Activate via dApp"**
4. Sign the SIWE message in MetaMask
5. The extension now shows **ACTIVE** status

### 5.3 Browse with protection

After activation, the extension automatically:
- Scans every domain you visit
- Shows a shield badge indicating safety status (✅ SAFE / ⚠️ WARN / 🚨 RISK)
- Displays warning banners on dangerous dApp pages
- Intercepts and analyzes wallet transactions before signing

---

## Complete Working Example

Here's a full script you can run right now:

```typescript
// analyze-tx.ts
import { SecurityAgent } from "@sifix/agent";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // Initialize the agent
  const agent = new SecurityAgent({
    network: {
      chainId: 16602,
      rpcUrl: "https://evmrpc-testnet.0g.ai",
      name: "0G Galileo Testnet",
    },
    aiProvider: {
      apiKey: process.env.AI_API_KEY!,
      model: process.env.AI_MODEL || "gpt-4o",
    },
    storage: { mockMode: true },
    identity: {
      contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
      tokenId: 99,
    },
  });

  await agent.init();
  console.log("✅ Agent initialized\n");

  // Analyze a transaction
  const result = await agent.analyzeTransaction({
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    data: "0xa9059cbb000000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA960450000000000000000000000000000000000000000000000000de0b6b3a7640000",
    value: "0",
  });

  // Print results
  console.log("📊 Risk Score:", result.analysis.riskScore, "/ 100");
  console.log("🎯 Confidence:", `${(result.analysis.confidence * 100).toFixed(1)}%`);
  console.log("📋 Recommendation:", result.analysis.recommendation.toUpperCase());
  console.log("🤖 Provider:", result.analysis.provider);
  console.log("\n📝 Reasoning:\n", result.analysis.reasoning);

  if (result.analysis.threats.length > 0) {
    console.log("\n⚠️  Threats detected:");
    for (const threat of result.analysis.threats) {
      console.log(`   [${threat.severity}] ${threat.type}: ${threat.description}`);
    }
  }

  if (result.storageRootHash) {
    console.log("\n🗄️  Storage proof:", result.storageRootHash);
  }

  console.log("\n✅ Analysis complete");
}

main().catch(console.error);
```

**Run it:**

```bash
# Set your API key
export AI_API_KEY="sk-your-key"

# Run the analysis
npx tsx analyze-tx.ts
```

**Expected output:**

```
✅ Agent initialized

📊 Risk Score: 12 / 100
🎯 Confidence: 94.0%
📋 Recommendation: ALLOW
🤖 Provider: galileo

📝 Reasoning:
Standard ERC-20 token transfer to a known address. No suspicious patterns detected.

🗄️  Storage proof: 0xabc123def456...

✅ Analysis complete
```

---

## What's Next?

- **[Configuration](./configuration)** — Set up 0G Compute, real storage, and advanced AI providers
- **[Installation](./installation)** — Full platform installation with all three components
- **[Extension Setup](./extension-setup)** — Detailed extension configuration guide
- **[API Reference](/api)** — Complete SDK and REST API documentation
- **[System Architecture](/architecture/system-overview)** — Understand the simulation and analysis pipeline
