---
title: API Reference
description: Complete API reference for the SIFIX platform — @sifix/agent SDK (v1.5.0) and the dApp REST API (35 endpoints). All code examples are written in TypeScript.
---

# API Reference

This document provides the complete API reference for the SIFIX platform. It covers two major interfaces:

- **@sifix/agent SDK (v1.5.0)** — a TypeScript/Node.js SDK for programmatic access to SIFIX's security analysis engine.
- **dApp REST API** — a set of 35 HTTP endpoints powering the SIFIX decentralized application.

---

## Table of Contents

- [@sifix/agent SDK (v1.5.0)](#sifixagent-sdk-v150)
  - [Installation](#installation)
  - [SecurityAgent](#securityagent)
  - [AnalysisResult](#analysisresult)
  - [AIAnalyzer](#aianalyzer)
  - [TransactionSimulator](#transactionsimulator)
  - [StorageClient](#storageclient)
  - [ThreatIntelProvider](#threatintelprovider)
- [dApp REST API](#dapp-rest-api)
  - [Base URL & Authentication](#base-url--authentication)
  - [Scanning](#scanning)
  - [Analysis](#analysis)
  - [Threats](#threats)
  - [Reports](#reports)
  - [Tags](#tags)
  - [Watchlist](#watchlist)
  - [Scam Domains](#scam-domains)
  - [Auth](#auth)
  - [System](#system)
  - [Settings](#settings)
  - [Storage](#storage)
  - [Identity](#identity)
  - [Health](#health)

---

## @sifix/agent SDK (v1.5.0)

### Installation

```bash
npm install @sifix/agent
```

```bash
yarn add @sifix/agent
```

```bash
pnpm add @sifix/agent
```

### SecurityAgent

The `SecurityAgent` is the primary entry point for the SDK. It orchestrates transaction simulation, threat intelligence lookups, and AI-powered risk analysis.

#### Constructor

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  // Required — Galileo network configuration
  network: {
    chainId: 1,
    rpcUrl: "https://galileo.onfinality.io/public",
  },

  // AI provider configuration (optional — defaults shown)
  aiProvider: {
    primary: "galileo",       // 0G Compute via Galileo
    fallback: "openai",       // OpenAI-compatible endpoint
    apiKey: process.env.SIFIX_AI_API_KEY,
    model: "sifix-security-v1",
  },

  // Storage configuration (optional)
  storage: {
    enabled: true,
    mockMode: false,          // Set true for local development
  },

  // Threat intelligence (optional)
  threatIntel: {
    enabled: true,
    cacheTtl: 300,            // seconds
  },
});
```

#### `init()`

Initializes the agent, validates configuration, and establishes connections to all providers. Must be called before any analysis.

```typescript
const agent = new SecurityAgent(config);

await agent.init();
// => void — throws on configuration or connection errors
```

#### `analyzeTransaction(params)`

Performs a full security analysis on a proposed transaction. Returns an `AnalysisResult`.

**Parameters:**

- `from` **`string`** — Sender address (required)
- `to` **`string`** — Recipient address (required)
- `data` **`string | undefined`** — Calldata hex string (optional)
- `value` **`string | undefined`** — ETH value in wei (optional)

```typescript
const result = await agent.analyzeTransaction({
  from: "0x1234...abcd",
  to: "0x5678...ef01",
  data: "0xa9059cbb000000000000000000000000...",
  value: "1000000000000000000", // 1 ETH
});

console.log(result.analysis.riskScore);   // 0–100
console.log(result.analysis.recommendation); // "block" | "warn" | "allow"
```

### AnalysisResult

The `AnalysisResult` object is returned by `analyzeTransaction()` and contains the complete output of the security analysis pipeline.

```typescript
interface AnalysisResult {
  /** On-chain simulation results */
  simulation: {
    success: boolean;
    gasUsed: number;
    gasEstimate: number;
    logs: SimulationLog[];
    error?: string;
    stateChanges: StateChange[];
  };

  /** Threat intelligence data */
  threatIntel: {
    fromAddress: AddressIntel | null;
    toAddress: AddressIntel | null;
    relatedScamDomains: string[];
    knownExploitSignatures: string[];
  };

  /** Core AI analysis */
  analysis: {
    riskScore: number;        // 0 (safe) – 100 (dangerous)
    confidence: number;       // 0.0 – 1.0
    reasoning: string;        // Human-readable explanation
    threats: ThreatMatch[];   // Matched threat indicators
    recommendation: "block" | "warn" | "allow";
    provider: "galileo" | "openai" | "fallback";
  };

  /** ISO 8601 timestamp */
  timestamp: string;

  /** On-chain storage root hash (when storage enabled) */
  storageRootHash?: string;

  /** Explorer URL for stored analysis */
  storageExplorer?: string;

  /** Which compute provider fulfilled the request */
  computeProvider: "galileo" | "openai";
}
```

**Usage example:**

```typescript
const result: AnalysisResult = await agent.analyzeTransaction({
  from: "0xSender...",
  to: "0xRecipient...",
});

// Check recommendation
if (result.analysis.recommendation === "block") {
  throw new Error(`Transaction blocked: ${result.analysis.reasoning}`);
}

// Inspect individual threats
for (const threat of result.analysis.threats) {
  console.log(`[${threat.severity}] ${threat.type}: ${threat.description}`);
}

// Verify on-chain storage
if (result.storageRootHash) {
  console.log(`Analysis stored on-chain: ${result.storageExplorer}`);
}
```

### AIAnalyzer

The `AIAnalyzer` module provides dual-provider AI analysis with automatic failover. The primary provider is **0G Compute via the Galileo network**; if it is unavailable, the system falls back to an OpenAI-compatible endpoint.

```typescript
import { AIAnalyzer } from "@sifix/agent";

const analyzer = new AIAnalyzer({
  primary: {
    provider: "galileo",
    endpoint: "https://galileo-compute.0g.ai/v1",
    model: "sifix-security-v1",
  },
  fallback: {
    provider: "openai",
    endpoint: "https://api.openai.com/v1",
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
  },
  timeout: 30_000, // ms
});

// Analyze raw transaction data
const analysis = await analyzer.analyze({
  from: "0xSender...",
  to: "0xRecipient...",
  data: "0x...",
  value: "1000000000000000000",
  simulationResult: { /* ... */ },
  threatIntel: { /* ... */ },
});

console.log(analysis.provider); // "galileo" | "openai"
console.log(analysis.riskScore); // 0–100
```

### TransactionSimulator

Simulates a transaction against the blockchain to preview state changes, gas usage, and potential failures without actually submitting it on-chain.

```typescript
import { TransactionSimulator } from "@sifix/agent";

const simulator = new TransactionSimulator({
  rpcUrl: "https://galileo.onfinality.io/public",
  chainId: 1,
});

// Run a full simulation
const simulation = await simulator.simulate({
  from: "0xSender...",
  to: "0xRecipient...",
  data: "0xa9059cbb...",
  value: "1000000000000000000",
});

console.log(simulation.success);   // true | false
console.log(simulation.gasUsed);   // e.g. 52341
console.log(simulation.logs);      // decoded event logs
console.log(simulation.stateChanges); // balance/token changes

// Estimate gas only (lighter-weight call)
const gasEstimate = await simulator.estimateGas({
  from: "0xSender...",
  to: "0xRecipient...",
  data: "0xa9059cbb...",
  value: "1000000000000000000",
});

console.log(gasEstimate); // e.g. 52341n (BigInt)
```

### StorageClient

Persists analysis results on-chain via the Galileo network. Includes automatic retry logic (3 retries with exponential backoff) and an optional mock mode for local development.

```typescript
import { StorageClient } from "@sifix/agent";

const storage = new StorageClient({
  network: "galileo",
  mockMode: false, // Set true to skip on-chain storage
});

// Store an analysis result (retries up to 3 times on failure)
const hash = await storage.storeAnalysis({
  analysisResult: result,
  metadata: {
    analyzedBy: "0xOperator...",
    version: "1.5.0",
  },
});

console.log(hash); // "0xabc123..." — on-chain storage root hash

// Retrieve a previously stored analysis
const retrieved = await storage.retrieveAnalysis(hash);

console.log(retrieved.timestamp);     // ISO 8601
console.log(retrieved.analysis.riskScore);
```

**Mock mode** — for local development and testing without on-chain writes:

```typescript
const storage = new StorageClient({ mockMode: true });

const hash = await storage.storeAnalysis({
  analysisResult: result,
  metadata: { analyzedBy: "0xTest...", version: "1.5.0" },
});
// Returns a deterministic mock hash — no on-chain transaction created
```

### ThreatIntelProvider

The `ThreatIntelProvider` interface defines the contract for threat intelligence data sources. Implement this interface to integrate custom threat feeds.

```typescript
import { ThreatIntelProvider, AddressIntel } from "@sifix/agent";

// Define a custom provider
class MyThreatProvider implements ThreatIntelProvider {
  async getAddressIntel(address: string): Promise<AddressIntel | null> {
    const response = await fetch(
      `https://my-threat-api.example.com/address/${address}`
    );
    if (!response.ok) return null;
    return response.json();
  }

  async saveScanResult(
    address: string,
    result: AddressIntel
  ): Promise<void> {
    await fetch("https://my-threat-api.example.com/scans", {
      method: "POST",
      body: JSON.stringify({ address, result }),
    });
  }
}
```

**`AddressIntel` structure:**

```typescript
interface AddressIntel {
  address: string;
  riskScore: number;           // 0–100
  labels: string[];            // e.g. ["phishing", "mixer"]
  firstSeen: string;           // ISO 8601
  lastSeen: string;            // ISO 8601
  transactionCount: number;
  associatedEntities: string[];
}
```

---

## dApp REST API

The SIFIX dApp exposes **35 REST endpoints** for scanning, analysis, threat intelligence, reporting, and user management.

### Base URL & Authentication

**Base URL:**

```
https://api.sifix.io/v1
```

**Authentication:**

Most endpoints require a JWT token obtained via the [Auth](#auth) flow. Include it in the `Authorization` header:

```typescript
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
```

---

### Scanning

#### `GET /check-domain`

Check whether a domain is flagged as a known scam.

**Query Parameters:**

- `domain` **`string`** — The domain to check (required)

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/check-domain?domain=evil-phishing.com",
  { headers }
);

const data = await response.json();
// {
//   domain: "evil-phishing.com",
//   isScam: true,
//   category: "phishing",
//   reportedCount: 47,
//   firstReported: "2025-11-02T14:30:00Z"
// }
```

---

#### `GET /scan/:address`

Retrieve a cached scan result for an address. If no cached result exists, triggers a new scan.

**Path Parameters:**

- `address` **`string`** — EVM address to scan

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/scan/0x1234567890abcdef1234567890abcdef12345678",
  { headers }
);

const data = await response.json();
// {
//   address: "0x1234567890abcdef...",
//   riskScore: 82,
//   labels: ["phishing", "drainer"],
//   scannedAt: "2026-05-09T10:00:00Z",
//   threats: [...]
// }
```

---

#### `POST /scan`

Submit a new scan request for one or more addresses.

**Request Body:**

- `addresses` **`string[]`** — Array of EVM addresses to scan
- `options` **`object`** *(optional)*
  - `deepScan` **`boolean`** — Enable extended analysis (default: `false`)
  - `includeStorage` **`boolean`** — Persist result on-chain (default: `false`)

```typescript
const response = await fetch("https://api.sifix.io/v1/scan", {
  method: "POST",
  headers,
  body: JSON.stringify({
    addresses: [
      "0x1234567890abcdef1234567890abcdef12345678",
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    ],
    options: {
      deepScan: true,
      includeStorage: true,
    },
  }),
});

const data = await response.json();
// {
//   scanId: "scan_abc123",
//   status: "processing",
//   results: [...],
//   estimatedTime: "30s"
// }
```

---

### Analysis

#### `POST /analyze`

Perform a full AI-powered security analysis on a transaction or contract interaction.

**Request Body:**

- `from` **`string`** — Sender address
- `to` **`string`** — Target address
- `data` **`string | null`** — Transaction calldata
- `value` **`string | null`** — ETH value in wei
- `options` **`object`** *(optional)*
  - `provider` **`"galileo" | "openai"`** — Preferred AI provider
  - `simulate` **`boolean`** — Run simulation (default: `true`)

```typescript
const response = await fetch("https://api.sifix.io/v1/analyze", {
  method: "POST",
  headers,
  body: JSON.stringify({
    from: "0xSender...",
    to: "0xRecipient...",
    data: "0xa9059cbb...",
    value: "1000000000000000000",
    options: {
      provider: "galileo",
      simulate: true,
    },
  }),
});

const data = await response.json();
// {
//   simulation: { success: true, gasUsed: 52341, ... },
//   threatIntel: { ... },
//   analysis: {
//     riskScore: 15,
//     confidence: 0.92,
//     reasoning: "Standard ERC-20 transfer...",
//     threats: [],
//     recommendation: "allow",
//     provider: "galileo"
//   },
//   timestamp: "2026-05-09T12:00:00Z",
//   storageRootHash: "0xdef456..."
// }
```

---

#### `POST /extension/analyze`

Analysis endpoint optimized for the browser extension. Accepts a lighter payload and returns a streamlined response suitable for popup/overlay UIs.

**Request Body:**

- `url` **`string`** — The page URL where the interaction originates
- `transaction` **`object`** — Transaction parameters (`from`, `to`, `data`, `value`)
- `userAddress` **`string`** — The connected wallet address

```typescript
const response = await fetch("https://api.sifix.io/v1/extension/analyze", {
  method: "POST",
  headers,
  body: JSON.stringify({
    url: "https://app.uniswap.org",
    transaction: {
      from: "0xUser...",
      to: "0xRouter...",
      data: "0x38ed1739...",
      value: "0",
    },
    userAddress: "0xUser...",
  }),
});

const data = await response.json();
// {
//   riskScore: 5,
//   recommendation: "allow",
//   summary: "Uniswap V3 token swap — no threats detected.",
//   details: { ... }
// }
```

---

### Threats

#### `GET /threats`

Retrieve a paginated list of known threats.

**Query Parameters:**

- `page` **`number`** — Page number (default: `1`)
- `limit` **`number`** — Results per page (default: `20`, max: `100`)
- `category` **`string`** *(optional)* — Filter by category (e.g. `phishing`, `drainer`, `mixer`)
- `severity` **`string`** *(optional)* — Filter by severity (`low`, `medium`, `high`, `critical`)

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/threats?category=phishing&limit=10",
  { headers }
);

const data = await response.json();
// {
//   threats: [
//     { id: "threat_001", type: "phishing", severity: "high", ... },
//     ...
//   ],
//   pagination: { page: 1, limit: 10, total: 1423 }
// }
```

---

#### `POST /threats/report`

Submit a new threat report.

**Request Body:**

- `address` **`string`** — The malicious address
- `category` **`string`** — Threat category
- `description` **`string`** — Human-readable description
- `evidence` **`string[]`** *(optional)* — URLs or transaction hashes as evidence
- `domain` **`string | null`** *(optional)* — Associated scam domain

```typescript
const response = await fetch("https://api.sifix.io/v1/threats/report", {
  method: "POST",
  headers,
  body: JSON.stringify({
    address: "0xBadActor...",
    category: "drainer",
    description: "Wallet drainer contract targeting NFT holders",
    evidence: [
      "https://etherscan.io/tx/0xAbCd...",
    ],
    domain: "nft-claim-now.xyz",
  }),
});

const data = await response.json();
// { reportId: "rpt_xyz789", status: "submitted" }
```

---

### Reports

#### `GET /reports`

List all reports created by the authenticated user.

**Query Parameters:**

- `status` **`string`** *(optional)* — Filter by status (`pending`, `confirmed`, `rejected`)
- `page` **`number`** — Page number (default: `1`)
- `limit` **`number`** — Results per page (default: `20`)

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/reports?status=confirmed&limit=10",
  { headers }
);

const data = await response.json();
// {
//   reports: [
//     { id: "rpt_001", address: "0x...", status: "confirmed", ... },
//     ...
//   ],
//   pagination: { page: 1, limit: 10, total: 56 }
// }
```

---

#### `POST /reports`

Create a new report for a suspicious address or contract.

**Request Body:**

- `address` **`string`** — Target address
- `title` **`string`** — Report title
- `description` **`string`** — Detailed description
- `tags` **`string[]`** *(optional)* — Tags for categorization
- `severity` **`string`** — Severity level (`low`, `medium`, `high`, `critical`)

```typescript
const response = await fetch("https://api.sifix.io/v1/reports", {
  method: "POST",
  headers,
  body: JSON.stringify({
    address: "0xSuspicious...",
    title: "Ponzi scheme contract",
    description: "This contract exhibits characteristics of a Ponzi scheme...",
    tags: ["ponzi", "fraud"],
    severity: "critical",
  }),
});

const data = await response.json();
// { id: "rpt_abc456", status: "pending", createdAt: "2026-05-09T..." }
```

---

#### `POST /reports/:id/vote`

Vote on a report's validity. Requires authentication.

**Path Parameters:**

- `id` **`string`** — Report ID

**Request Body:**

- `vote` **`"up" | "down"`** — Vote direction
- `reason` **`string`** *(optional)* — Justification for the vote

```typescript
const response = await fetch("https://api.sifix.io/v1/reports/rpt_abc456/vote", {
  method: "POST",
  headers,
  body: JSON.stringify({
    vote: "up",
    reason: "Confirmed — this contract drained my wallet.",
  }),
});

const data = await response.json();
// { reportId: "rpt_abc456", votes: { up: 12, down: 1 }, userVote: "up" }
```

---

### Tags

#### `GET /address-tags`

Retrieve a paginated list of address tags.

**Query Parameters:**

- `page` **`number`** — Page number (default: `1`)
- `limit` **`number`** — Results per page (default: `20`)
- `tag` **`string`** *(optional)* — Filter by tag name

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/address-tags?tag=drainer&limit=50",
  { headers }
);

const data = await response.json();
// {
//   tags: [
//     { address: "0x...", tag: "drainer", addedBy: "0x...", ... },
//     ...
//   ],
//   pagination: { page: 1, limit: 50, total: 230 }
// }
```

---

#### `POST /address-tags`

Tag an address with a label.

**Request Body:**

- `address` **`string`** — EVM address to tag
- `tag` **`string`** — Label to apply
- `description` **`string`** *(optional)* — Reason for the tag

```typescript
const response = await fetch("https://api.sifix.io/v1/address-tags", {
  method: "POST",
  headers,
  body: JSON.stringify({
    address: "0xBadAddr...",
    tag: "phishing",
    description: "Known phishing operator — targets DeFi users",
  }),
});

const data = await response.json();
// { id: "tag_001", address: "0xBadAddr...", tag: "phishing", createdAt: "..." }
```

---

#### `GET /address/:address/tags`

Retrieve all tags for a specific address.

**Path Parameters:**

- `address` **`string`** — EVM address

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/address/0xBadAddr.../tags",
  { headers }
);

const data = await response.json();
// {
//   address: "0xBadAddr...",
//   tags: [
//     { tag: "phishing", votes: { up: 34, down: 2 }, status: "confirmed" },
//     { tag: "drainer", votes: { up: 18, down: 1 }, status: "confirmed" }
//   ]
// }
```

---

#### `POST /address/:address/tags/vote`

Vote on a tag's validity for an address.

**Path Parameters:**

- `address` **`string`** — EVM address

**Request Body:**

- `tag` **`string`** — The tag to vote on
- `vote` **`"up" | "down"`** — Vote direction

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/address/0xBadAddr.../tags/vote",
  {
    method: "POST",
    headers,
    body: JSON.stringify({
      tag: "phishing",
      vote: "up",
    }),
  }
);

const data = await response.json();
// { tag: "phishing", votes: { up: 35, down: 2 } }
```

---

### Watchlist

#### `GET /watchlist`

Retrieve the authenticated user's watchlist of monitored addresses.

```typescript
const response = await fetch("https://api.sifix.io/v1/watchlist", {
  headers,
});

const data = await response.json();
// {
//   watchlist: [
//     {
//       address: "0xMonitored...",
//       label: "Suspicious whale",
//       addedAt: "2026-04-15T08:30:00Z",
//       lastActivity: "2026-05-09T14:22:00Z"
//     },
//     ...
//   ]
// }
```

---

#### `POST /watchlist`

Add an address to the authenticated user's watchlist.

**Request Body:**

- `address` **`string`** — EVM address to monitor
- `label` **`string`** *(optional)* — A human-readable label

```typescript
const response = await fetch("https://api.sifix.io/v1/watchlist", {
  method: "POST",
  headers,
  body: JSON.stringify({
    address: "0xMonitored...",
    label: "Suspicious whale",
  }),
});

const data = await response.json();
// { id: "wl_001", address: "0xMonitored...", label: "Suspicious whale", addedAt: "..." }
```

---

#### `DELETE /watchlist/:address`

Remove an address from the authenticated user's watchlist.

**Path Parameters:**

- `address` **`string`** — EVM address to remove

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/watchlist/0xMonitored...",
  {
    method: "DELETE",
    headers,
  }
);

const data = await response.json();
// { deleted: true, address: "0xMonitored..." }
```

---

### Scam Domains

#### `GET /scam-domains`

Retrieve a paginated list of known scam domains.

**Query Parameters:**

- `page` **`number`** — Page number (default: `1`)
- `limit` **`number`** — Results per page (default: `20`)
- `category` **`string`** *(optional)* — Filter by category

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/scam-domains?category=phishing&limit=50",
  { headers }
);

const data = await response.json();
// {
//   domains: [
//     { domain: "evil-phishing.com", category: "phishing", reports: 47, ... },
//     ...
//   ],
//   pagination: { page: 1, limit: 50, total: 8901 }
// }
```

---

#### `GET /scam-domains/check`

Quickly check whether a specific domain is flagged.

**Query Parameters:**

- `domain` **`string`** — Domain to check (required)

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/scam-domains/check?domain=suspicious-site.xyz",
  { headers }
);

const data = await response.json();
// { domain: "suspicious-site.xyz", isScam: true, category: "drainer", reports: 12 }
```

---

#### `GET /scam-domains/:domain`

Retrieve detailed information about a specific scam domain.

**Path Parameters:**

- `domain` **`string`** — The domain name

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/scam-domains/suspicious-site.xyz",
  { headers }
);

const data = await response.json();
// {
//   domain: "suspicious-site.xyz",
//   category: "drainer",
//   status: "active",
//   firstReported: "2025-12-01T...",
//   lastReported: "2026-05-09T...",
//   reports: 12,
//   associatedAddresses: ["0x...", "0x..."],
//   targetChains: ["ethereum", "polygon"]
// }
```

---

### Auth

SIFIX uses a **SIWE (Sign-In with Ethereum)** flow for authentication. The client requests a nonce, signs it with their wallet, and verifies the signature to obtain a JWT.

#### `POST /auth/nonce`

Request a unique nonce for wallet signing.

**Request Body:**

- `address` **`string`** — EVM address of the wallet

```typescript
const nonceResponse = await fetch("https://api.sifix.io/v1/auth/nonce", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ address: "0xYourWallet..." }),
});

const { nonce, message } = await nonceResponse.json();
// {
//   nonce: "a1b2c3d4e5f6",
//   message: "sifix.io wants you to sign in with your Ethereum account:\n0xYourWallet...\n\nNonce: a1b2c3d4e5f6"
// }
```

---

#### `POST /auth/verify`

Verify a signed SIWE message and obtain a JWT token.

**Request Body:**

- `message` **`string`** — The SIWE message received from `/auth/nonce`
- `signature` **`string`** — The signature produced by the wallet

```typescript
// Sign the message with ethers.js
import { ethers } from "ethers";

const signer = await wallet.getSigner();
const signature = await signer.signMessage(message);

const verifyResponse = await fetch("https://api.sifix.io/v1/auth/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message, signature }),
});

const { token, expiresAt } = await verifyResponse.json();
// { token: "eyJhbGciOiJIUzI1NiIs...", expiresAt: "2026-05-10T12:00:00Z" }
```

---

#### `GET /auth/verify-token`

Validate an existing JWT token. Useful for checking token validity on app startup.

```typescript
const response = await fetch("https://api.sifix.io/v1/auth/verify-token", {
  headers: { Authorization: `Bearer ${token}` },
});

const data = await response.json();
// { valid: true, address: "0xYourWallet...", expiresAt: "2026-05-10T12:00:00Z" }
```

---

### System

#### `GET /stats`

Retrieve platform-wide statistics.

```typescript
const response = await fetch("https://api.sifix.io/v1/stats", { headers });

const data = await response.json();
// {
//   totalScans: 1250342,
//   totalThreats: 45231,
//   totalReports: 8921,
//   activeUsers: 12450,
//   scamDomainsTracked: 8901,
//   avgResponseTime: "1.2s"
// }
```

---

#### `GET /leaderboard`

Retrieve the contributor leaderboard. Rankings are based on verified reports, community votes, and activity.

**Query Parameters:**

- `period` **`string`** *(optional)* — `"daily"` | `"weekly"` | `"monthly"` | `"all"` (default: `"weekly"`)
- `limit` **`number`** *(optional)* — Results to return (default: `25`)

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/leaderboard?period=monthly&limit=10",
  { headers }
);

const data = await response.json();
// {
//   leaderboard: [
//     { rank: 1, address: "0xTopHunter...", reports: 87, reputation: 4200 },
//     { rank: 2, address: "0xSecExpert...", reports: 64, reputation: 3800 },
//     ...
//   ],
//   period: "monthly",
//   updatedAt: "2026-05-09T18:00:00Z"
// }
```

---

#### `GET /history`

Retrieve the authenticated user's activity history across scans, reports, and votes.

**Query Parameters:**

- `type` **`string`** *(optional)* — `"scan"` | `"report"` | `"vote"` | `"all"` (default: `"all"`)
- `page` **`number`** — Page number (default: `1`)
- `limit` **`number`** — Results per page (default: `20`)

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/history?type=scan&limit=10",
  { headers }
);

const data = await response.json();
// {
//   history: [
//     { id: "scan_abc123", type: "scan", address: "0x...", timestamp: "..." },
//     ...
//   ],
//   pagination: { page: 1, limit: 10, total: 234 }
// }
```

---

#### `GET /scan-history`

Retrieve the authenticated user's scan history specifically (a focused version of `/history`).

**Query Parameters:**

- `page` **`number`** — Page number (default: `1`)
- `limit` **`number`** — Results per page (default: `20`)

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/scan-history?limit=5",
  { headers }
);

const data = await response.json();
// {
//   scans: [
//     {
//       id: "scan_abc123",
//       address: "0xScanned...",
//       riskScore: 72,
//       timestamp: "2026-05-09T12:00:00Z"
//     },
//     ...
//   ],
//   pagination: { page: 1, limit: 5, total: 120 }
// }
```

---

### Settings

#### `GET /settings/ai-provider`

Retrieve the current AI provider configuration for the authenticated user.

```typescript
const response = await fetch("https://api.sifix.io/v1/settings/ai-provider", {
  headers,
});

const data = await response.json();
// {
//   provider: "galileo",
//   fallback: "openai",
//   model: "sifix-security-v1",
//   availableProviders: ["galileo", "openai"]
// }
```

---

### Storage

#### `GET /storage/:hash/download`

Download a previously stored on-chain analysis by its storage root hash.

**Path Parameters:**

- `hash` **`string`** — The storage root hash returned by `analyzeTransaction` or `storeAnalysis`

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/storage/0xdef456.../download",
  { headers }
);

const data = await response.json();
// {
//   hash: "0xdef456...",
//   analysis: { ... },
//   metadata: { analyzedBy: "0x...", version: "1.5.0" },
//   storedAt: "2026-05-08T09:15:00Z"
// }
```

---

### Identity

#### `GET /agentic-id`

Retrieve the agentic identity information for the authenticated user. This includes on-chain identity data, reputation score, and verifiable credentials.

```typescript
const response = await fetch("https://api.sifix.io/v1/agentic-id", {
  headers,
});

const data = await response.json();
// {
//   address: "0xYourWallet...",
//   agenticId: "agent_xyz789",
//   reputation: 4200,
//   reportsSubmitted: 87,
//   reportsConfirmed: 72,
//   joinedAt: "2025-08-15T...",
//   credentials: [
//     { type: "ThreatHunter", level: 3, issuedAt: "2026-01-01T..." }
//   ]
// }
```

---

### Health

#### `GET /health`

Public endpoint to check API health and uptime status. No authentication required.

```typescript
const response = await fetch("https://api.sifix.io/v1/health");

const data = await response.json();
// {
//   status: "ok",
//   version: "1.5.0",
//   uptime: 86400,
//   services: {
//     database: "ok",
//     galileo: "ok",
//     aiProvider: "ok",
//     storage: "ok"
//   },
//   timestamp: "2026-05-09T18:06:00Z"
// }
```

---

## Error Handling

All REST API endpoints follow a consistent error response format:

```typescript
interface ApiError {
  error: {
    code: string;        // e.g. "UNAUTHORIZED", "NOT_FOUND", "VALIDATION_ERROR"
    message: string;     // Human-readable error description
    details?: unknown;   // Additional context (e.g. validation errors)
  };
  statusCode: number;    // HTTP status code
}
```

**Common error codes:**

- **`400`** — Validation error (missing or invalid parameters)
- **`401`** — Unauthorized (missing or invalid JWT)
- **`404`** — Resource not found
- **`429`** — Rate limit exceeded
- **`500`** — Internal server error
- **`503`** — Service unavailable (AI provider or network issue)

```typescript
const response = await fetch("https://api.sifix.io/v1/scan/invalid-address", {
  headers,
});

if (!response.ok) {
  const error: ApiError = await response.json();
  console.error(`[${error.statusCode}] ${error.error.code}: ${error.error.message}`);
}
```

---

## Rate Limits

| Tier | Requests/min | Requests/day |
|------|-------------|-------------|
| Free | 30 | 1,000 |
| Pro | 120 | 10,000 |
| Enterprise | Custom | Custom |

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 27
X-RateLimit-Reset: 1715270400
```

```typescript
const response = await fetch("https://api.sifix.io/v1/scan/0x...", { headers });

const limit = response.headers.get("X-RateLimit-Limit");
const remaining = response.headers.get("X-RateLimit-Remaining");
const reset = response.headers.get("X-RateLimit-Reset");

console.log(`${remaining}/${limit} requests remaining (resets at ${reset})`);
```

---

## SDK Version Compatibility

| @sifix/agent | dApp API | Galileo Network | Minimum Node.js |
|---|---|---|---|
| v1.5.0 | v1 | Galileo mainnet | 18.x |
| v1.4.x | v1 | Galileo testnet | 18.x |
| v1.3.x | v1 | Galileo testnet | 16.x |
