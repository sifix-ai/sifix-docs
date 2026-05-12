---
title: "Storage Integration"
description: "Store, retrieve, and verify SIFIX analysis results on 0G Storage — includes batch operations, mock mode for development, error handling, and the full TypeScript API with code examples."
---

# Storage Integration

SIFIX uses **0G Storage** to immutably persist security analysis results on-chain. Every analysis produces a cryptographic root hash — an unforgeable proof that the analysis existed and hasn't been tampered with. This guide covers storing results, retrieving and verifying evidence, mock mode for development, batch operations, and robust error handling.

All storage operations use the `@0gfoundation/0g-storage-ts-sdk` under the hood, accessed through SIFIX's `StorageClient`.

---

## Basic Setup

```typescript
// storage-setup.ts
import { SecurityAgent, StorageClient } from "@sifix/agent";

// Option 1: Automatic storage via SecurityAgent
const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
    name: "0G Galileo Testnet",
  },
  aiProvider: {
    apiKey: process.env.AI_API_KEY!,
    model: "gpt-4o",
  },
  storage: {
    enabled: true,
    mockMode: false, // Set true to skip on-chain writes
  },
  identity: {
    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
    tokenId: 99,
  },
});

await agent.init();
// Storage is now active — every analyzeTransaction() call stores evidence automatically
```

```typescript
// Option 2: Standalone StorageClient for custom workflows
import { StorageClient } from "@sifix/agent";

const storage = new StorageClient({
  network: "galileo",
  mockMode: false,
});
```

---

## Store Analysis Results

### Automatic Storage (Recommended)

When storage is enabled, `analyzeTransaction()` automatically uploads the full analysis result to 0G Storage:

```typescript
// auto-storage.ts
import { createAgent } from "./setup";

async function analyzeAndStore() {
  const agent = await createAgent(); // storage.enabled = true

  const result = await agent.analyzeTransaction({
    from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    value: "1000000000000000000",
  });

  // The storageRootHash is automatically populated
  if (result.storageRootHash) {
    console.log("📦 Evidence stored on 0G Storage");
    console.log("   Root Hash:", result.storageRootHash);
    console.log("   Explorer:", result.storageExplorer);
    console.log("   Provider:", result.computeProvider);
  }

  return result;
}

analyzeAndStore().catch(console.error);
```

**Output:**

```
📦 Evidence stored on 0G Storage
   Root Hash: 0xabc123def456789...
   Explorer: https://chainscan-galileo.0g.ai/tx/0xabc123def456789...
   Provider: galileo
```

### Manual Storage

For custom workflows where you need to control when and what gets stored:

```typescript
// manual-storage.ts
import { StorageClient } from "@sifix/agent";
import type { AnalysisResult } from "@sifix/agent";

const storage = new StorageClient({ network: "galileo" });

// Store with metadata
const hash = await storage.storeAnalysis({
  analysisResult: result as AnalysisResult,
  metadata: {
    analyzedBy: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    version: "1.5.0",
    environment: "production",
    customField: "any-value", // Optional custom metadata
  },
});

console.log("Stored at:", hash);
// "0xabc123def456789..." — immutable root hash
```

### What Gets Stored

The complete `AnalysisResult` JSON is uploaded to 0G Storage, including:

```typescript
// This is the full structure stored on-chain
const storedData = {
  // AI analysis output
  analysis: {
    riskScore: 12,
    confidence: 0.94,
    recommendation: "allow",
    reasoning: "Standard ERC-20 transfer...",
    threats: [],
    provider: "galileo",
  },

  // Simulation results
  simulation: {
    success: true,
    gasUsed: 52341,
    gasEstimate: 65000,
    logs: [{ event: "Transfer", from: "0x742d...", to: "0xd8dA...", value: "1" }],
    stateChanges: [
      { type: "balance", address: "0x742d...", change: "-1.0 TOKEN" },
      { type: "balance", address: "0xd8dA...", change: "+1.0 TOKEN" },
    ],
  },

  // Threat intelligence
  threatIntel: {
    fromAddress: { riskScore: 5, labels: [] },
    toAddress: { riskScore: 8, labels: [] },
    relatedScamDomains: [],
    knownExploitSignatures: [],
  },

  // Metadata
  timestamp: "2026-05-09T18:30:00Z",
  computeProvider: "galileo",

  // Storage metadata (added by storeAnalysis)
  metadata: {
    analyzedBy: "0x742d...",
    version: "1.5.0",
    storedAt: "2026-05-09T18:30:01Z",
  },
};
```

---

## Retrieve and Verify

### Retrieving Stored Analysis

Download a previously stored analysis using its root hash:

```typescript
// retrieve.ts
import { StorageClient } from "@sifix/agent";

const storage = new StorageClient({ network: "galileo" });

async function retrieveEvidence(rootHash: string) {
  const retrieved = await storage.retrieveAnalysis(rootHash);

  console.log("Timestamp:", retrieved.timestamp);
  console.log("Risk Score:", retrieved.analysis.riskScore);
  console.log("Recommendation:", retrieved.analysis.recommendation);
  console.log("Reasoning:", retrieved.analysis.reasoning);
  console.log("Analyzed By:", retrieved.metadata.analyzedBy);
  console.log("SDK Version:", retrieved.metadata.version);

  // Inspect threats
  if (retrieved.analysis.threats.length > 0) {
    console.log("\nThreats:");
    for (const threat of retrieved.analysis.threats) {
      console.log(`  [${threat.severity}] ${threat.type}: ${threat.description}`);
    }
  }

  // Check simulation state changes
  console.log("\nState Changes:");
  for (const change of retrieved.simulation.stateChanges) {
    console.log(`  ${change.type}: ${JSON.stringify(change)}`);
  }

  return retrieved;
}

// Retrieve by root hash from a previous analysis
retrieveEvidence("0xabc123def456789...").catch(console.error);
```

### Verifying Evidence Integrity

Verify that retrieved data matches the root hash — proving it hasn't been tampered with:

```typescript
// verify.ts
import { StorageClient } from "@sifix/agent";

const storage = new StorageClient({ network: "galileo" });

async function verifyEvidence(rootHash: string) {
  // Step 1: Retrieve the stored data
  const retrieved = await storage.retrieveAnalysis(rootHash);

  // Step 2: The root hash is a cryptographic commitment
  // If the data was altered, the hash would not match
  console.log("Root Hash:", rootHash);
  console.log("Data timestamp:", retrieved.timestamp);
  console.log("Risk Score:", retrieved.analysis.riskScore);

  // Step 3: Cross-reference with the 0G Galileo explorer
  console.log(
    "Explorer URL:",
    `https://chainscan-galileo.0g.ai/tx/${rootHash}`
  );

  // The immutability guarantees:
  // - The data CANNOT be changed after upload (root hash would differ)
  // - The data CANNOT be deleted from 0G Storage
  // - Anyone with the root hash can retrieve and verify independently

  return retrieved;
}

verifyEvidence("0xabc123def456789...").catch(console.error);
```

### Building an Evidence Audit Trail

```typescript
// audit-trail.ts
import { StorageClient } from "@sifix/agent";

const storage = new StorageClient({ network: "galileo" });

interface AuditEntry {
  rootHash: string;
  timestamp: string;
  riskScore: number;
  recommendation: string;
  from: string;
  to: string;
}

async function buildAuditTrail(hashes: string[]): Promise<AuditEntry[]> {
  const trail: AuditEntry[] = [];

  for (const hash of hashes) {
    try {
      const evidence = await storage.retrieveAnalysis(hash);

      trail.push({
        rootHash: hash,
        timestamp: evidence.timestamp,
        riskScore: evidence.analysis.riskScore,
        recommendation: evidence.analysis.recommendation,
        from: evidence.threatIntel.fromAddress?.address ?? "unknown",
        to: evidence.threatIntel.toAddress?.address ?? "unknown",
      });
    } catch (error) {
      console.error(`Failed to retrieve ${hash}:`, error);
    }
  }

  // Sort by timestamp
  trail.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return trail;
}

// Usage
const hashes = [
  "0xabc123...",
  "0xdef456...",
  "0x789abc...",
];

buildAuditTrail(hashes).then((trail) => {
  console.log(`\n📋 Audit Trail (${trail.length} entries):`);
  for (const entry of trail) {
    const score = entry.riskScore.toString().padStart(3);
    const icon =
      entry.riskScore <= 20 ? "✅" : entry.riskScore <= 60 ? "⚠️" : "🚨";
    console.log(
      `${icon} [${score}] ${entry.timestamp} — ${entry.recommendation.toUpperCase()}`
    );
  }
});
```

---

## Mock Mode for Development

Mock mode disables all on-chain storage operations, returning deterministic fake hashes instead. Use it for local development, unit tests, and CI pipelines.

### Enabling Mock Mode

```typescript
// mock-mode.ts
import { SecurityAgent, StorageClient } from "@sifix/agent";

// Option 1: Via SecurityAgent config
const agent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: { apiKey: "test", model: "gpt-4o" },
  storage: { mockMode: true }, // ← Enables mock mode
});

await agent.init();

// Option 2: Standalone StorageClient
const mockStorage = new StorageClient({ mockMode: true });
```

### Mock Mode Behavior

```typescript
// mock-demo.ts
import { StorageClient } from "@sifix/agent";

const storage = new StorageClient({ mockMode: true });

// storeAnalysis returns a deterministic mock hash immediately
const hash = await storage.storeAnalysis({
  analysisResult: {
    analysis: { riskScore: 42, confidence: 0.8, recommendation: "warn", reasoning: "test", threats: [], provider: "galileo" },
    simulation: { success: true, gasUsed: 21000, gasEstimate: 21000, logs: [], stateChanges: [] },
    threatIntel: { fromAddress: null, toAddress: null, relatedScamDomains: [], knownExploitSignatures: [] },
    timestamp: new Date().toISOString(),
    computeProvider: "galileo",
  },
  metadata: { analyzedBy: "0xTest", version: "1.5.0" },
});

console.log(hash);
// "mock_0x1234567890abcdef..." — deterministic, no on-chain TX

// retrieveAnalysis returns the in-memory stored data
const retrieved = await storage.retrieveAnalysis(hash);
console.log(retrieved.analysis.riskScore); // 42
console.log(retrieved.metadata.analyzedBy); // "0xTest"

// Multiple stores work correctly
const hash2 = await storage.storeAnalysis({
  analysisResult: { /* ... */ },
  metadata: { analyzedBy: "0xTest2", version: "1.5.0" },
});
console.log(hash === hash2); // false — each gets a unique mock hash
```

### Testing with Mock Mode

```typescript
// storage.test.ts
import { StorageClient } from "@sifix/agent";

describe("StorageClient (mock mode)", () => {
  let storage: StorageClient;

  beforeEach(() => {
    storage = new StorageClient({ mockMode: true });
  });

  test("stores and retrieves analysis", async () => {
    const result = {
      analysis: {
        riskScore: 15,
        confidence: 0.95,
        recommendation: "allow" as const,
        reasoning: "Safe transaction",
        threats: [],
        provider: "galileo" as const,
      },
      simulation: {
        success: true,
        gasUsed: 21000,
        gasEstimate: 21000,
        logs: [],
        stateChanges: [],
      },
      threatIntel: {
        fromAddress: null,
        toAddress: null,
        relatedScamDomains: [],
        knownExploitSignatures: [],
      },
      timestamp: new Date().toISOString(),
      computeProvider: "galileo" as const,
    };

    const hash = await storage.storeAnalysis({
      analysisResult: result,
      metadata: { analyzedBy: "0xTest", version: "1.5.0" },
    });

    expect(hash).toMatch(/^mock_0x/);

    const retrieved = await storage.retrieveAnalysis(hash);
    expect(retrieved.analysis.riskScore).toBe(15);
    expect(retrieved.metadata.version).toBe("1.5.0");
  });
});
```

---

## Batch Storage Operations

When analyzing multiple transactions (e.g., scanning a wallet's full history), use batch storage with concurrency control to avoid overwhelming the network.

### Basic Batch Store

```typescript
// batch-store.ts
import { StorageClient } from "@sifix/agent";
import type { AnalysisResult } from "@sifix/agent";

const storage = new StorageClient({ network: "galileo" });

async function batchStore(
  results: AnalysisResult[],
  concurrency: number = 3
): Promise<Map<number, string>> {
  const hashMap = new Map<number, string>();
  const queue = [...results.entries()]; // [index, result] pairs

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      const [index, result] = item;
      try {
        const hash = await storage.storeAnalysis({
          analysisResult: result,
          metadata: {
            analyzedBy: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
            version: "1.5.0",
          },
        });
        hashMap.set(index, hash);
        console.log(`✅ [${index + 1}/${results.length}] Stored: ${hash.slice(0, 18)}...`);
      } catch (error) {
        console.error(`❌ [${index + 1}/${results.length}] Failed:`, error);
      }
    }
  }

  // Run N workers concurrently
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log(`\n📦 Batch complete: ${hashMap.size}/${results.length} stored`);
  return hashMap;
}

// Usage: store 50 analysis results with 3 concurrent uploads
const results: AnalysisResult[] = [/* ... array of results ... */];
const hashes = await batchStore(results, 3);
```

### Batch Retrieve

```typescript
// batch-retrieve.ts
import { StorageClient } from "@sifix/agent";

const storage = new StorageClient({ network: "galileo" });

async function batchRetrieve(
  hashes: string[],
  concurrency: number = 5
): Promise<Map<string, any>> {
  const results = new Map<string, any>();
  const queue = [...hashes];

  async function worker() {
    while (queue.length > 0) {
      const hash = queue.shift();
      if (!hash) break;

      try {
        const data = await storage.retrieveAnalysis(hash);
        results.set(hash, data);
      } catch (error) {
        console.error(`Failed to retrieve ${hash}:`, error);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

// Usage
const hashes = ["0xabc...", "0xdef...", "0x789..."];
const evidence = await batchRetrieve(hashes, 5);

for (const [hash, data] of evidence) {
  console.log(`${hash}: score=${data.analysis.riskScore}`);
}
```

### Combining Batch Analysis with Storage

```typescript
// batch-analyze-store.ts
import { SecurityAgent } from "@sifix/agent";
import type { AnalysisResult } from "@sifix/agent";

interface TxInput {
  from: string;
  to: string;
  data?: string;
  value?: string;
}

async function batchAnalyzeAndStore(
  agent: SecurityAgent,
  transactions: TxInput[],
  concurrency: number = 3
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  const queue = [...transactions];

  async function worker() {
    while (queue.length > 0) {
      const tx = queue.shift();
      if (!tx) break;

      try {
        const result = await agent.analyzeTransaction(tx);
        results.push(result);
        console.log(
          `✅ ${tx.to.slice(0, 10)}... → score: ${result.analysis.riskScore} ` +
          `hash: ${result.storageRootHash?.slice(0, 18) || "N/A"}...`
        );
      } catch (error) {
        console.error(`❌ Failed to analyze ${tx.to}:`, error);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

// Usage: analyze 20 transactions concurrently
const agent = await createAgent(); // storage.enabled = true

const transactions: TxInput[] = [
  { from: "0x742d...", to: "0xd8dA...", value: "1000000000000000000" },
  { from: "0x742d...", to: "0xA0b8...", data: "0xa9059cbb...", value: "0" },
  // ... more transactions
];

const results = await batchAnalyzeAndStore(agent, transactions, 3);
console.log(`\n📊 Analyzed ${results.length} transactions`);

const blocked = results.filter((r) => r.analysis.recommendation === "block");
console.log(`🚨 Blocked: ${blocked.length} dangerous transactions`);
```

---

## Error Handling

### Storage-Specific Errors

```typescript
// error-handling.ts
import { StorageClient } from "@sifix/agent";

const storage = new StorageClient({ network: "galileo" });

async function safeStore(result: any): Promise<string | null> {
  try {
    const hash = await storage.storeAnalysis({
      analysisResult: result,
      metadata: { analyzedBy: "0x742d...", version: "1.5.0" },
    });
    return hash;
  } catch (error: any) {
    // Categorize errors
    if (error.message?.includes("timeout")) {
      console.error("⏱️ Storage timeout — 0G Storage node may be overloaded");
    } else if (error.message?.includes("insufficient funds")) {
      console.error("💰 Insufficient 0G tokens for storage transaction");
    } else if (error.message?.includes("network")) {
      console.error("🌐 Network error — check RPC connectivity");
    } else if (error.message?.includes("rate limit")) {
      console.error("🚦 Rate limited — backing off");
    } else {
      console.error("❓ Unknown storage error:", error.message);
    }
    return null;
  }
}
```

### Retry with Exponential Backoff

The built-in `StorageClient` already retries 3 times (1s, 2s, 4s). For custom retry logic:

```typescript
// retry-logic.ts
async function storeWithRetry(
  storage: StorageClient,
  result: any,
  maxRetries: number = 5,
  baseDelay: number = 1000
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const hash = await storage.storeAnalysis({
        analysisResult: result,
        metadata: { analyzedBy: "0x742d...", version: "1.5.0" },
      });
      console.log(`✅ Stored on attempt ${attempt}`);
      return hash;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        console.error(`❌ All ${maxRetries} attempts exhausted`);
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 500;
      const waitTime = delay + jitter;

      console.warn(
        `⚠️ Attempt ${attempt}/${maxRetries} failed: ${error.message}. ` +
        `Retrying in ${Math.round(waitTime)}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error("Unreachable");
}
```

### Graceful Degradation

If storage fails, the analysis result is still valid — it just won't have an on-chain proof:

```typescript
// graceful-degradation.ts
import { SecurityAgent } from "@sifix/agent";

async function analyzeWithOptionalStorage(agent: SecurityAgent, tx: any) {
  let result;

  try {
    // Attempt full analysis with storage
    result = await agent.analyzeTransaction(tx);
  } catch (error: any) {
    if (error.message?.includes("storage")) {
      // Storage failed — retry without storage
      console.warn("⚠️ Storage failed, retrying without on-chain persistence");

      const fallbackAgent = new SecurityAgent({
        ...agent.config,
        storage: { enabled: false },
      });
      await fallbackAgent.init();
      result = await fallbackAgent.analyzeTransaction(tx);

      // Flag that evidence wasn't stored
      console.warn("⚠️ Analysis complete but NOT stored on-chain");
    } else {
      throw error; // Re-throw non-storage errors
    }
  }

  // Analysis is valid regardless of storage status
  console.log("Risk Score:", result.analysis.riskScore);
  console.log("Recommendation:", result.analysis.recommendation);

  if (result.storageRootHash) {
    console.log("✅ Evidence stored:", result.storageRootHash);
  } else {
    console.log("⚠️ No on-chain evidence (storage disabled or failed)");
  }

  return result;
}
```

---

## Quick Reference

- **`new StorageClient({ network: "galileo", mockMode: false })`** — Create a storage client
- **`storage.storeAnalysis({ analysisResult, metadata })`** — Upload evidence → returns root hash
- **`storage.retrieveAnalysis(rootHash)`** — Download evidence by hash
- **`storage.storeAnalysis()` retries** — 3 retries with exponential backoff (1s, 2s, 4s)
- **`mockMode: true`** — Disable on-chain writes, return deterministic hashes
- **Root hash** — Immutable, verifiable, permanent proof of storage

---

## Related

- **[Basic Analysis](./basic-analysis)** — Analyze transactions before storing
- **[AI Providers](./ai-providers)** — Configure AI backends for analysis
- **[Advanced Patterns](./advanced)** — Batch operations and webhook integration
- **[0G Integration](../product/0g-integration)** — Deep dive into 0G Storage architecture
- **[Agent SDK — StorageClient](../api-reference/agent-sdk.md#storageclient)** — Full API reference
- **[0G Storage API](../api-reference/0g-storage-api)** — Low-level storage API reference
