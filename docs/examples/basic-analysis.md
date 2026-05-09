---
title: "Basic Transaction Analysis"
description: "Step-by-step examples for analyzing ETH transfers, ERC-20 approvals, NFT transfers, and interpreting risk scores with the SIFIX SDK on 0G Galileo Testnet."
---

# Basic Transaction Analysis

Learn how to use the SIFIX SDK to analyze common Web3 transaction types — from simple ETH transfers to ERC-20 approvals and NFT transfers. Each example includes the full code, expected output, and a breakdown of how to interpret the results.

**All examples run on the 0G Galileo Testnet (Chain ID: 16602).**

---

## Setup

Every example below starts with the same initialization. Create a reusable setup file:

```typescript
// setup.ts
import { SecurityAgent } from "@sifix/agent";

export async function createAgent() {
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
  return agent;
}
```

```bash
# Set your API key before running any example
export AI_API_KEY="sk-your-api-key-here"
```

---

## Example 1 — ETH Transfer

Analyze a plain native-token transfer on 0G Galileo. This is the simplest transaction type — no calldata, just a value transfer between two addresses.

```typescript
// eth-transfer.ts
import { createAgent } from "./setup";

async function analyzeEthTransfer() {
  const agent = await createAgent();

  const result = await agent.analyzeTransaction({
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    value: "1000000000000000000", // 1 ETH in wei
  });

  console.log("Risk Score:", result.analysis.riskScore);
  console.log("Recommendation:", result.analysis.recommendation);
  console.log("Confidence:", result.analysis.confidence);
  console.log("Reasoning:", result.analysis.reasoning);
  console.log("Provider:", result.analysis.provider);

  return result;
}

analyzeEthTransfer().catch(console.error);
```

**Expected output:**

```json
{
  "analysis": {
    "riskScore": 8,
    "confidence": 0.96,
    "recommendation": "allow",
    "reasoning": "Simple native ETH transfer of 1.0 0G to a known address on 0G Galileo. No calldata present, no contract interaction. The recipient has a clean transaction history with no scam associations.",
    "threats": [],
    "provider": "galileo"
  },
  "simulation": {
    "success": true,
    "gasUsed": 21000,
    "gasEstimate": 21000,
    "logs": [],
    "stateChanges": [
      {
        "type": "balance",
        "address": "0x742d...",
        "change": "-1.0 0G"
      },
      {
        "type": "balance",
        "address": "0xd8dA...",
        "change": "+1.0 0G"
      }
    ]
  },
  "threatIntel": {
    "fromAddress": { "riskScore": 5, "labels": [] },
    "toAddress": { "riskScore": 3, "labels": [] },
    "relatedScamDomains": [],
    "knownExploitSignatures": []
  },
  "timestamp": "2026-05-09T18:30:00Z"
}
```

**Key observations:**
- Risk score of **8** — well within the SAFE tier (0–20)
- Gas usage is exactly **21,000** — the standard cost for a plain ETH transfer
- No state changes beyond simple balance adjustments
- No threat intelligence flags on either address

---

## Example 2 — ERC-20 Token Approval

Token approvals are one of the most exploited transaction types in Web3. This example shows how SIFIX detects a dangerous unlimited approval.

```typescript
// erc20-approval.ts
import { createAgent } from "./setup";

async function analyzeTokenApproval() {
  const agent = await createAgent();

  // ERC-20 approve(address spender, uint256 amount)
  // approve spender = 0xA0b8... for uint256.max (unlimited)
  const result = await agent.analyzeTransaction({
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    data: "0x095ea7b9000000000000000000000000881d40237659c251811cec9c364ef91dc08d300c000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    value: "0",
  });

  console.log("Risk Score:", result.analysis.riskScore);
  console.log("Recommendation:", result.analysis.recommendation);
  console.log("Threats:", result.analysis.threats.length);

  for (const threat of result.analysis.threats) {
    console.log(`  [${threat.severity.toUpperCase()}] ${threat.type}`);
    console.log(`    → ${threat.description}`);
  }

  return result;
}

analyzeTokenApproval().catch(console.error);
```

**Expected output:**

```json
{
  "analysis": {
    "riskScore": 88,
    "confidence": 0.95,
    "recommendation": "block",
    "reasoning": "CRITICAL: This transaction grants UNLIMITED ERC-20 approval (uint256.max) to address 0x881d...300c. This address is flagged in threat intelligence as a known token drainer with 47 prior victim reports. The spender can drain the victim's entire token balance at any time without further interaction. This matches the classic approval drain attack pattern.",
    "threats": [
      {
        "type": "unlimited_approval",
        "severity": "critical",
        "description": "Unlimited ERC-20 approval (uint256.max) granted to spender",
        "confidence": 0.99,
        "source": "SimulationDecoder"
      },
      {
        "type": "known_drain_contract",
        "severity": "critical",
        "description": "Spender 0x881d...300c is a confirmed drain contract (47 reports)",
        "confidence": 0.97,
        "source": "PrismaThreatIntel"
      },
      {
        "type": "phishing_pattern",
        "severity": "high",
        "description": "Approval pattern matches known phishing campaign 'fake-airdrop-v3'",
        "confidence": 0.88,
        "source": "PrismaThreatIntel"
      }
    ],
    "provider": "galileo"
  },
  "simulation": {
    "success": true,
    "gasUsed": 46213,
    "gasEstimate": 55500,
    "logs": [
      {
        "event": "Approval",
        "owner": "0x742d...",
        "spender": "0x881d...",
        "value": "uint256.max"
      }
    ],
    "stateChanges": [
      {
        "type": "approval",
        "owner": "0x742d...",
        "spender": "0x881d...",
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
  "timestamp": "2026-05-09T18:35:00Z"
}
```

**Key observations:**
- Risk score of **88** — deep in the CRITICAL tier (81–100), triggers a hard block
- Three distinct threats detected with severity ratings
- The simulation decoded the `approve` call and flagged `uint256.max` as unlimited
- Threat intelligence linked the spender to a known drain contract with 47 victim reports
- Related scam domains are surfaced for context

### Comparing a Safe Approval

For contrast, here's a limited approval to a verified contract:

```typescript
// Safe approval — only approve 100 USDC to a trusted DEX router
const safeResult = await agent.analyzeTransaction({
  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  data: "0x095ea7b900000000000000000000000068b3465833fb72A70ecDF485E0e4C7bD8665Fc4500000000000000000000000000000000000000000000000000000000000f4240",
  // approve(0x68b3...c45, 1000000) — exactly 1.0 USDC
  value: "0",
});

// safeResult.analysis.riskScore → 18 (SAFE tier)
// safeResult.analysis.recommendation → "allow"
```

---

## Example 3 — NFT Transfer

Analyze an ERC-721 or ERC-1155 NFT transfer. These transactions involve unique assets, and the analysis evaluates both the token contract and the recipient.

```typescript
// nft-transfer.ts
import { createAgent } from "./setup";

async function analyzeNftTransfer() {
  const agent = await createAgent();

  // ERC-721 transferFrom(address from, address to, uint256 tokenId)
  const result = await agent.analyzeTransaction({
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    to: "0x4E1fA6631E6D354B4E0A6B1D3B49D55E3F87cC4F", // NFT contract
    data: "0x42842e0e000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f2bd18000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000002a7",
    // transferFrom(0x742d..., 0xd8dA..., 679)
    value: "0",
  });

  console.log("Risk Score:", result.analysis.riskScore);
  console.log("Recommendation:", result.analysis.recommendation);
  console.log("Confidence:", result.analysis.confidence);
  console.log("Reasoning:", result.analysis.reasoning);

  // Check simulation for decoded NFT transfer event
  if (result.simulation.success) {
    const transferLog = result.simulation.logs.find(
      (log) => log.eventName === "Transfer"
    );
    if (transferLog) {
      console.log("NFT Transfer:", JSON.stringify(transferLog, null, 2));
    }
  }

  return result;
}

analyzeNftTransfer().catch(console.error);
```

**Expected output:**

```json
{
  "analysis": {
    "riskScore": 15,
    "confidence": 0.92,
    "recommendation": "allow",
    "reasoning": "ERC-721 NFT transfer of token #679 from a known collection to a clean address. The NFT contract is a verified collection with no reported exploits. The recipient address has prior NFT receiving history and no scam associations. Standard transfer pattern.",
    "threats": [],
    "provider": "galileo"
  },
  "simulation": {
    "success": true,
    "gasUsed": 68241,
    "gasEstimate": 82000,
    "logs": [
      {
        "address": "0x4E1f...cC4F",
        "event": "Transfer",
        "from": "0x742d...",
        "to": "0xd8dA...",
        "tokenId": "679"
      }
    ],
    "stateChanges": [
      {
        "type": "tokenTransfer",
        "from": "0x742d...",
        "to": "0xd8dA...",
        "amount": "1",
        "token": "ERC-721 #679"
      }
    ]
  },
  "threatIntel": {
    "fromAddress": { "riskScore": 5, "labels": [] },
    "toAddress": { "riskScore": 8, "labels": [] },
    "relatedScamDomains": [],
    "knownExploitSignatures": []
  },
  "timestamp": "2026-05-09T18:40:00Z"
}
```

### Suspicious NFT Transfer (Wash Trading Detection)

```typescript
// wash-trade-nft.ts — SIFIX detects suspicious NFT patterns
const suspiciousResult = await agent.analyzeTransaction({
  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  to: "0x4E1fA6631E6D354B4E0A6B1D3B49D55E3F87cC4F",
  data: "0x42842e0e000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f2bd18000000000000000000000000f75e0a3e64b9c6c1f8e8f7c8d2b9a5e6c7d8f9a0b0000000000000000000000000000000000000000000000000000000000000042",
  value: "0",
});

// suspiciousResult.analysis.riskScore → 72 (HIGH tier)
// suspiciousResult.analysis.recommendation → "block"
// suspiciousResult.analysis.threats → [
//   { type: "wash_trading", severity: "high",
//     description: "Recipient is a newly created address funded by the sender 2 blocks ago" },
//   { type: "unverified_collection", severity: "medium",
//     description: "NFT contract has no verified source code and was deployed 1 hour ago" }
// ]
```

---

## Example 4 — Interpreting Risk Scores & Recommendations

Every `analyzeTransaction` call returns a structured `AnalysisResult`. Here's how to build decision logic around the risk score and recommendation.

### Risk Score Tiers Reference

- **0–20 (Tier 0) ✅ SAFE** — No threat indicators. Auto-approve.
- **21–40 (Tier 1) 🟢 LOW** — Minor flags, informational. Approve with logging.
- **41–60 (Tier 2) 🟡 MEDIUM** — Suspicious patterns present. Warn the user.
- **61–80 (Tier 3) 🟠 HIGH** — Likely malicious. Block TX, require explicit override.
- **81–100 (Tier 4) 🔴 CRITICAL** — Confirmed exploit or attack. Hard block.

### Decision Logic

```typescript
// decision-logic.ts
import { createAgent } from "./setup";
import type { AnalysisResult } from "@sifix/agent";

function getRiskTier(score: number): string {
  if (score <= 20) return "SAFE";
  if (score <= 40) return "LOW";
  if (score <= 60) return "MEDIUM";
  if (score <= 80) return "HIGH";
  return "CRITICAL";
}

function handleResult(result: AnalysisResult): {
  action: "approve" | "warn" | "block";
  message: string;
} {
  const { riskScore, recommendation, reasoning, threats, confidence } =
    result.analysis;
  const tier = getRiskTier(riskScore);

  console.log(`[${tier}] Score: ${riskScore}/100 (confidence: ${(confidence * 100).toFixed(1)}%)`);

  // Log all detected threats
  for (const threat of threats) {
    console.log(`  ⚠ ${threat.severity.toUpperCase()}: ${threat.type}`);
    console.log(`    ${threat.description}`);
  }

  switch (recommendation) {
    case "allow":
      return {
        action: "approve",
        message: `✅ ${tier}: ${reasoning}`,
      };

    case "warn":
      return {
        action: "warn",
        message: `⚠️ ${tier}: ${reasoning}`,
      };

    case "block":
      return {
        action: "block",
        message: `🚨 ${tier}: ${reasoning}`,
      };

    default:
      return {
        action: "block",
        message: `Unknown recommendation: ${recommendation}`,
      };
  }
}

// Usage
async function main() {
  const agent = await createAgent();

  const result = await agent.analyzeTransaction({
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    data: "0xa9059cbb000000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA960450000000000000000000000000000000000000000000000000de0b6b3a7640000",
    value: "0",
  });

  const decision = handleResult(result);
  console.log("\nDecision:", decision.action.toUpperCase());
  console.log("Message:", decision.message);

  if (result.storageRootHash) {
    console.log(`\nEvidence stored on 0G: ${result.storageRootHash}`);
    console.log(`Explorer: ${result.storageExplorer}`);
  }
}

main().catch(console.error);
```

### Building a Custom Scoring Threshold

For applications that need different blocking thresholds:

```typescript
// Custom policy: block anything above LOW tier
const BLOCK_THRESHOLD = 40;

function applyCustomPolicy(result: AnalysisResult): boolean {
  // Always respect CRITICAL hard blocks
  if (result.analysis.riskScore > 80) return false; // hard block

  // For MEDIUM and HIGH, apply custom threshold
  if (result.analysis.riskScore > BLOCK_THRESHOLD) {
    console.warn(`Blocked by policy (score ${result.analysis.riskScore} > ${BLOCK_THRESHOLD})`);
    return false;
  }

  // Check specific threat types regardless of score
  const hasApprovalThreat = result.analysis.threats.some(
    (t) => t.type === "unlimited_approval" || t.type === "known_drain_contract"
  );
  if (hasApprovalThreat) {
    console.warn("Blocked: approval-related threat detected");
    return false;
  }

  return true; // allow
}
```

### Inspecting Simulation State Changes

The simulation results provide a detailed preview of exactly what will happen if the transaction is executed. Use this to show users a human-readable diff:

```typescript
function explainStateChanges(result: AnalysisResult): string[] {
  const explanations: string[] = [];

  for (const change of result.simulation.stateChanges) {
    switch (change.type) {
      case "balance":
        explanations.push(
          `💰 Balance: ${change.address} → ${change.amount.startsWith("-") ? "loses" : "gains"} ${change.amount}`
        );
        break;
      case "approval":
        explanations.push(
          `🔓 Approval: ${change.owner} grants ${change.spender} access to ${change.amount} tokens`
        );
        break;
      case "tokenTransfer":
        explanations.push(
          `🖼️ NFT: ${change.token} transferred from ${change.from} to ${change.to}`
        );
        break;
    }
  }

  // If simulation failed, report the error
  if (!result.simulation.success && result.simulation.error) {
    explanations.push(`❌ Simulation reverted: ${result.simulation.error}`);
  }

  return explanations;
}

// Usage:
const explanations = explainStateChanges(result);
explanations.forEach((line) => console.log(line));
// 💰 Balance: 0x742d... → loses -1.0 0G
// 💰 Balance: 0xd8dA... → gains +1.0 0G
```

---

## Quick Reference — Transaction Types

| Calldata Prefix | Function | Risk Focus |
|-----------------|----------|------------|
| `0xa9059cbb` | `transfer(address,uint256)` | ERC-20 token transfer — check recipient reputation |
| `0x095ea7b9` | `approve(address,uint256)` | ERC-20 approval — flag unlimited, check spender |
| `0x42842e0e` | `transferFrom(address,address,uint256)` | ERC-721 NFT transfer — verify ownership, collection |
| `0xf242432a` | `safeTransferFrom(address,address,uint256,uint256,bytes)` | ERC-1155 transfer — batch token movement |
| `0x38ed1739` | `swapExactTokensForTokens(...)` | DEX swap — slippage, honeypot, rug pull checks |
| `(empty)` | ETH transfer | Native transfer — recipient reputation only |

---

## Related

- **[AI Providers](./ai-providers.md)** — Configure different AI backends for analysis
- **[Storage](./storage.md)** — Store and retrieve analysis results on 0G Storage
- **[Advanced Patterns](./advanced.md)** — Batch analysis, webhooks, and custom providers
- **[Quick Start](../guides/quick-start.md)** — Full setup walkthrough
- **[Agent SDK](../api-reference/agent-sdk.md)** — Complete API reference
