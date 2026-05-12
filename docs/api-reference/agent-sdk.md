---
title: "@sifix/agent SDK"
description: "Complete API reference for @sifix/agent SDK v1.5.0 — SecurityAgent, AIAnalyzer, TransactionSimulator, StorageClient, and ThreatIntelProvider classes with full TypeScript interfaces."
---

# @sifix/agent SDK v1.5.0

The **@sifix/agent** SDK is the core TypeScript library for programmatic access to SIFIX's AI-powered security analysis engine. It provides modular classes for transaction simulation, dual-provider AI analysis, immutable evidence storage, and threat intelligence integration — all connected to the **0G Galileo Testnet** (Chain ID: 16602).

---

## Installation

```bash
npm install @sifix/agent
```

```bash
yarn add @sifix/agent
```

```bash
pnpm add @sifix/agent
```

**Requirements:** Node.js 20+ · TypeScript 5.x · 0G Galileo Testnet access

---

## AgentConfig

All SDK modules are configured through the `AgentConfig` interface passed to the `SecurityAgent` constructor.

```typescript
interface AgentConfig {
  /** 0G Galileo network configuration — required */
  network: {
    chainId: number;           // 16602 for 0G Galileo Testnet
    rpcUrl: string;            // https://evmrpc-testnet.0g.ai
    name?: string;             // e.g. "0G Galileo Testnet"
  };

  /** AI provider configuration — optional, defaults shown */
  aiProvider?: {
    primary: "0g-compute";     // 0G Compute via Galileo
    fallback: "openai";        // OpenAI-compatible endpoint
    apiKey?: string;           // API key for fallback provider
    model?: string;            // Default: "sifix-security-v1"
    timeout?: number;          // Request timeout in ms (default: 30000)
  };

  /** Storage configuration — optional */
  storage?: {
    enabled?: boolean;         // Default: true
    mockMode?: boolean;        // Set true for local development
  };

  /** Threat intelligence configuration — optional */
  threatIntel?: {
    enabled?: boolean;         // Default: true
    cacheTtl?: number;         // Cache TTL in seconds (default: 300)
  };
}
```

---

## SecurityAgent

The `SecurityAgent` is the primary entry point for the SDK. It orchestrates transaction simulation, threat intelligence lookups, and AI-powered risk analysis into a unified pipeline.

### Constructor

Creates a new `SecurityAgent` instance with the specified configuration.

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
    name: "0G Galileo Testnet",
  },
  aiProvider: {
    primary: "0g-compute",
    fallback: "openai",
    apiKey: process.env.SIFIX_AI_API_KEY,
    model: "sifix-security-v1",
  },
  storage: {
    enabled: true,
    mockMode: false,
  },
  threatIntel: {
    enabled: true,
    cacheTtl: 300,
  },
});
```

**Parameters:**

- `config` **`AgentConfig`** — Full SDK configuration (required)

### `init()`

Initializes the agent, validates configuration, and establishes connections to all providers (0G Galileo RPC, 0G Storage, AI providers, threat intel database). Must be called before any analysis.

```typescript
const agent = new SecurityAgent(config);

await agent.init();
// => void — throws on configuration or connection errors
```

**Returns:** `Promise<void>`

**Throws:**
- `ConfigurationError` — Invalid or missing configuration
- `ConnectionError` — Unable to reach 0G Galileo RPC or AI provider

### `analyzeTransaction(params)`

Performs a full security analysis on a proposed transaction. The pipeline runs simulation, gathers threat intelligence, invokes AI analysis, and stores evidence on-chain.

**Parameters — `Transaction` interface:**

```typescript
interface Transaction {
  /** Sender address (required) */
  from: string;
  /** Recipient address (required) */
  to: string;
  /** Calldata hex string (optional) */
  data?: string;
  /** ETH value in wei (optional) */
  value?: string;
}
```

```typescript
const result: AnalysisResult = await agent.analyzeTransaction({
  from: "0x1234567890abcdef1234567890abcdef12345678",
  to: "0x5678abcdef12345678abcdef12345678abcdef12",
  data: "0xa9059cbb000000000000000000000000abcdef...",
  value: "1000000000000000000", // 1 ETH in wei
});

console.log(result.analysis.riskScore);       // 0–100
console.log(result.analysis.recommendation);  // "block" | "warn" | "allow"
console.log(result.analysis.reasoning);       // Human-readable explanation
console.log(result.storageRootHash);          // 0G Storage root hash
```

**Returns:** `Promise<AnalysisResult>` — See full interface below

---

## AnalysisResult

The `AnalysisResult` is returned by `analyzeTransaction()` and contains the complete output of the security analysis pipeline — simulation, threat intelligence, AI analysis, and on-chain evidence metadata.

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
    riskScore: number;                     // 0 (safe) – 100 (dangerous)
    confidence: number;                    // 0.0 – 1.0
    reasoning: string;                     // Human-readable explanation
    threats: ThreatMatch[];                // Matched threat indicators
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

**Supporting interfaces:**

```typescript
interface SimulationLog {
  address: string;
  topics: string[];
  data: string;
  eventName?: string;
}

interface StateChange {
  type: "balance" | "approval" | "tokenTransfer";
  from: string;
  to: string;
  amount: string;
  token?: string;
}

interface ThreatMatch {
  type: string;             // e.g. "phishing", "honeypot", "rug-pull"
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  confidence: number;       // 0.0 – 1.0
  source: string;           // e.g. "PrismaThreatIntel"
}

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
  console.log(`Evidence stored: ${result.storageExplorer}`);
  console.log(`Compute provider: ${result.computeProvider}`);
}
```

---

## AIAnalyzer

The `AIAnalyzer` module provides **dual-provider AI analysis** with automatic failover. The primary provider is **0G Compute** on the Galileo network; if unavailable, the system falls back to an **OpenAI-compatible** endpoint.

### Constructor

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
```

### `analyze(params)`

Runs AI-powered risk assessment on transaction data combined with simulation results and threat intelligence.

**Parameters:**

- `from` **`string`** — Sender address
- `to` **`string`** — Recipient address
- `data` **`string`** — Transaction calldata
- `value` **`string`** — ETH value in wei
- `simulationResult` **`object`** — Output from `TransactionSimulator.simulate()`
- `threatIntel` **`object`** — Output from `ThreatIntelProvider.getAddressIntel()`

```typescript
const analysis = await analyzer.analyze({
  from: "0xSender...",
  to: "0xRecipient...",
  data: "0xa9059cbb...",
  value: "1000000000000000000",
  simulationResult: { success: true, gasUsed: 52341, /* ... */ },
  threatIntel: {
    fromAddress: null,
    toAddress: { riskScore: 72, labels: ["drainer"] },
    relatedScamDomains: [],
    knownExploitSignatures: [],
  },
});

console.log(analysis.provider);     // "galileo" | "openai"
console.log(analysis.riskScore);    // 0–100
console.log(analysis.confidence);   // 0.0–1.0
console.log(analysis.reasoning);    // Human-readable explanation
console.log(analysis.recommendation); // "block" | "warn" | "allow"
```

**Dual Provider Strategy:**

1. **Primary (0G Compute)** — Submits analysis payload as a structured blob via the 0G Compute feed endpoint, then polls for inference results
2. **Fallback (OpenAI)** — If 0G Compute is unreachable, times out (10s threshold), or returns malformed data, the OpenAI-compatible endpoint is used automatically

The `provider` field in the result indicates which provider fulfilled the request, and confidence scores are adjusted downward when the fallback is used.

---

## TransactionSimulator

Simulates transactions against the **0G Galileo Testnet** to preview state changes, gas usage, and potential failures without broadcasting anything on-chain. Powered by **viem**.

### Constructor

```typescript
import { TransactionSimulator } from "@sifix/agent";

const simulator = new TransactionSimulator({
  rpcUrl: "https://evmrpc-testnet.0g.ai",
  chainId: 16602,
});
```

### `simulate(params)`

Runs a full transaction simulation using `eth_call` against the current chain state.

**Parameters:**

- `from` **`string`** — Sender address
- `to` **`string`** — Recipient address
- `data` **`string`** — Transaction calldata hex
- `value` **`string`** — ETH value in wei

```typescript
const simulation = await simulator.simulate({
  from: "0xSender...",
  to: "0xRecipient...",
  data: "0xa9059cbb...",
  value: "1000000000000000000",
});

console.log(simulation.success);        // true | false
console.log(simulation.gasUsed);        // e.g. 52341
console.log(simulation.gasEstimate);    // e.g. 62810 (with safety margin)
console.log(simulation.logs);           // Decoded event logs
console.log(simulation.stateChanges);   // Balance/token/approval changes
console.log(simulation.error);          // Revert reason if failed
```

**Returns:**

```typescript
interface SimulationResult {
  success: boolean;
  gasUsed: number;
  gasEstimate: number;
  logs: SimulationLog[];
  error?: string;
  stateChanges: StateChange[];
}
```

### `estimateGas(params)`

A lighter-weight call that returns only the gas estimate without full simulation.

**Parameters:** Same as `simulate()`

```typescript
const gasEstimate = await simulator.estimateGas({
  from: "0xSender...",
  to: "0xRecipient...",
  data: "0xa9059cbb...",
  value: "1000000000000000000",
});

console.log(gasEstimate); // e.g. 52341n (BigInt)
```

**Returns:** `Promise<bigint>` — Estimated gas units

---

## StorageClient

Persists analysis results immutably on **0G Storage** using the `@0gfoundation/0g-storage-ts-sdk`. Includes automatic retry logic (3 retries with exponential backoff) and an optional mock mode for local development.

### Constructor

```typescript
import { StorageClient } from "@sifix/agent";

const storage = new StorageClient({
  network: "galileo",
  mockMode: false, // Set true to skip on-chain storage
});
```

### `storeAnalysis(params)`

Uploads an analysis result as a JSON blob to 0G Storage. Retries up to **3 times** with exponential backoff on failure.

**Parameters:**

- `analysisResult` **`AnalysisResult`** — The full analysis output to store
- `metadata` **`object`** — Optional metadata
  - `analyzedBy` **`string`** — Operator address
  - `version` **`string`** — SDK version

```typescript
const hash = await storage.storeAnalysis({
  analysisResult: result,
  metadata: {
    analyzedBy: "0xOperator...",
    version: "1.5.0",
  },
});

console.log(hash); // "0xabc123..." — on-chain storage root hash
```

**Returns:** `Promise<string>` — The storage root hash (immutable proof of storage)

**Retry behavior:**
- Up to 3 retries with exponential backoff (1s, 2s, 4s)
- Retries on network timeouts, RPC errors, and storage submission failures
- Throws after all retries are exhausted

### `retrieveAnalysis(rootHash)`

Downloads a previously stored analysis by its root hash.

**Parameters:**

- `rootHash` **`string`** — The storage root hash returned by `storeAnalysis()`

```typescript
const retrieved = await storage.retrieveAnalysis("0xabc123...");

console.log(retrieved.timestamp);            // ISO 8601
console.log(retrieved.analysis.riskScore);   // 0–100
console.log(retrieved.metadata.analyzedBy);  // Operator address
```

**Returns:** `Promise<StoredAnalysis>` — The full stored analysis with metadata

### Mock Mode

For local development and testing without on-chain writes:

```typescript
const storage = new StorageClient({ mockMode: true });

const hash = await storage.storeAnalysis({
  analysisResult: result,
  metadata: { analyzedBy: "0xTest...", version: "1.5.0" },
});
// Returns a deterministic mock hash — no on-chain transaction created
```

**Mock mode behavior:**
- `storeAnalysis()` returns a deterministic mock hash immediately
- `retrieveAnalysis()` returns the in-memory stored data
- No RPC calls or on-chain transactions are made
- Useful for integration tests and local development

---

## ThreatIntelProvider

The `ThreatIntelProvider` interface defines the contract for threat intelligence data sources. Implement this interface to integrate custom threat feeds into the SIFIX analysis pipeline.

### Interface Definition

```typescript
interface ThreatIntelProvider {
  /**
   * Retrieve threat intelligence for a given address.
   * Returns null if no data is available.
   */
  getAddressIntel(address: string): Promise<AddressIntel | null>;

  /**
   * Persist a scan result for future historical lookups.
   */
  saveScanResult(address: string, result: AddressIntel): Promise<void>;
}
```

### `getAddressIntel(address)`

Retrieves aggregated threat intelligence for a given EVM address, including risk scores, labels, historical activity, and associated entities.

**Parameters:**

- `address` **`string`** — EVM address to look up

```typescript
const intel = await provider.getAddressIntel("0xSuspicious...");

if (intel) {
  console.log(intel.riskScore);            // 0–100
  console.log(intel.labels);               // ["phishing", "drainer"]
  console.log(intel.firstSeen);            // ISO 8601
  console.log(intel.lastSeen);             // ISO 8601
  console.log(intel.transactionCount);     // e.g. 342
  console.log(intel.associatedEntities);   // ["0xRelatedAddr..."]
}
```

**Returns:** `Promise<AddressIntel | null>`

### `saveScanResult(address, result)`

Persists a scan result to the threat intelligence database for future historical lookups and adaptive learning.

**Parameters:**

- `address` **`string`** — The scanned address
- `result` **`AddressIntel`** — The scan result to store

```typescript
await provider.saveScanResult("0xScannedAddr...", {
  address: "0xScannedAddr...",
  riskScore: 35,
  labels: ["unverified"],
  firstSeen: new Date().toISOString(),
  lastSeen: new Date().toISOString(),
  transactionCount: 10,
  associatedEntities: [],
});
```

**Returns:** `Promise<void>`

### Custom Provider Example

Implement the interface to integrate your own threat intelligence source:

```typescript
import { ThreatIntelProvider, AddressIntel } from "@sifix/agent";

class CustomThreatProvider implements ThreatIntelProvider {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async getAddressIntel(address: string): Promise<AddressIntel | null> {
    const response = await fetch(
      `${this.apiUrl}/address/${address}`
    );
    if (!response.ok) return null;
    return response.json();
  }

  async saveScanResult(
    address: string,
    result: AddressIntel
  ): Promise<void> {
    await fetch(`${this.apiUrl}/scans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, result }),
    });
  }
}

// Register with the agent
const agent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  threatIntel: {
    provider: new CustomThreatProvider("https://my-threat-api.example.com"),
  },
});
```

**Built-in implementation:** The SDK ships with `PrismaThreatIntel` — a Prisma ORM-backed provider that queries a local database of aggregated threat intelligence for fast lookups without external API dependencies. It aggregates the last **50 scan results** per address for historical learning.

---

## Network Configuration

All SDK modules connect to the **0G Galileo Testnet**:

- **Network:** 0G Galileo Testnet
- **Chain ID:** `16602`
- **RPC URL:** `https://evmrpc-testnet.0g.ai`
- **Explorer:** [https://chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai)
- **Storage SDK:** `@0gfoundation/0g-storage-ts-sdk`

---

## Related

- [REST API](./rest-api) — The 35 HTTP endpoints powering the SIFIX dApp
- [Extension API](./extension-api) — Chrome extension message API
- [0G Storage API](./0g-storage-api) — Deep dive into 0G Storage integration
