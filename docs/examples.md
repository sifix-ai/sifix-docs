---
title: Examples
description: Complete code examples for the @sifix/agent SDK v1.5.0 — from basic transaction analysis to custom providers, multi-model AI routing, extension integration, and dashboard API calls.
---

# Examples

Practical, copy-paste-ready examples for every major feature of the **@sifix/agent SDK (v1.5.0)** and the **SIFIX dApp REST API**. All examples target the **0G Galileo Testnet** (Chain ID 16602).

---

## SDK Examples

### 1. Basic Transaction Analysis — ETH Transfer

The simplest usage: initialize a `SecurityAgent`, call `init()`, then analyze a plain ETH transfer.

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: {
    primary: "galileo",
    apiKey: process.env.SIFIX_AI_API_KEY,
    model: "sifix-security-v1",
  },
});

await agent.init();

const result = await agent.analyzeTransaction({
  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  to: "0x1234567890123456789012345678901234567890",
  data: "0x",
  value: "100000000000000000", // 0.1 ETH in wei
});

console.log(`Risk Score : ${result.analysis.riskScore}/100`);
console.log(`Recommendation: ${result.analysis.recommendation}`);
console.log(`Reasoning  : ${result.analysis.reasoning}`);
console.log(`Provider   : ${result.computeProvider}`);
```

**Expected output for a simple transfer:**

```
Risk Score : 5/100
Recommendation: allow
Reasoning  : Standard ETH transfer with no calldata. No threats detected.
Provider   : galileo
```

---

### 2. Token Approval Check — ERC20 `approve()`

Detect dangerous unlimited token approvals before they reach the chain.

```typescript
const result = await agent.analyzeTransaction({
  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC contract
  data:
    "0x095ea7b3" + // approve(address,uint256) selector
    "000000000000000000000000" +
    "1234567890123456789012345678901234567890" + // spender
    "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // unlimited
  value: "0x0",
});

if (
  result.analysis.recommendation === "block" ||
  result.analysis.recommendation === "warn"
) {
  console.warn("⚠️ Dangerous approval detected!");
  console.warn(result.analysis.reasoning);

  for (const threat of result.analysis.threats) {
    console.log(`  [${threat.severity}] ${threat.type}: ${threat.description}`);
  }
}
```

**Key fields to inspect:**

- `result.analysis.riskScore` — typically 70–90 for unlimited approvals
- `result.analysis.threats` — array of `ThreatMatch` objects with severity and type
- `result.analysis.recommendation` — `"block"` for unlimited approvals to unknown addresses

---

### 3. Full 0G Stack Setup — Compute + Storage

Configure the agent with both **0G Compute** (decentralized AI inference) and **0G Storage** (on-chain evidence persistence).

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },

  // 0G Compute — decentralized AI inference via Galileo
  compute: {
    enabled: true,
    brokerUrl: "https://indexer-storage-testnet-turbo.0g.ai",
  },

  // 0G Storage — persist analysis results on-chain
  storage: {
    enabled: true,
    indexerUrl: "https://indexer-storage-testnet-turbo.0g.ai",
    mockMode: false,
  },

  // Fallback AI provider if 0G Compute is unavailable
  aiProvider: {
    primary: "galileo",
    fallback: "openai",
    apiKey: process.env.SIFIX_AI_API_KEY,
    model: "sifix-security-v1",
  },

  // Threat intelligence caching
  threatIntel: {
    enabled: true,
    cacheTtl: 300, // 5 minutes
  },
});

await agent.init();

const result = await agent.analyzeTransaction({
  from: "0xSender...",
  to: "0xRecipient...",
  data: "0x",
  value: "1000000000000000000",
});

// 0G Storage proof is automatically generated
if (result.storageRootHash) {
  console.log(`Analysis stored on-chain: ${result.storageRootHash}`);
  console.log(`Explorer: ${result.storageExplorer}`);
}
```

**AI provider priority:**

1. **0G Compute** — if `compute` config is provided (fully decentralized)
2. **aiProvider** — if `aiProvider` config is set (OpenAI-compatible fallback)
3. **Legacy** — if `openaiApiKey` is set directly (deprecated)

---

### 4. OpenAI Fallback Provider

Use OpenAI as the primary AI provider. Any OpenAI-compatible endpoint works — Azure OpenAI, Together AI, etc.

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: {
    primary: "openai",
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o",
    baseUrl: "https://api.openai.com/v1", // optional — defaults to OpenAI
  },
});

await agent.init();

const result = await agent.analyzeTransaction({
  from: "0xSender...",
  to: "0xRecipient...",
  data: "0xa9059cbb...",
  value: "0",
});

console.log(`Provider: ${result.computeProvider}`); // "openai"
```

---

### 5. Groq Fast Provider

Groq offers ultra-low-latency inference — ideal for real-time transaction screening where speed matters.

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: {
    primary: "openai", // Groq is OpenAI-compatible
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    baseUrl: "https://api.groq.com/openai/v1",
  },
});

await agent.init();

const result = await agent.analyzeTransaction({
  from: "0xSender...",
  to: "0xRecipient...",
  data: "0x",
  value: "500000000000000000",
});

console.log(`Analysis in <500ms via Groq`);
console.log(`Risk: ${result.analysis.riskScore}/100`);
```

---

### 6. OpenRouter Multi-Model

OpenRouter gives you access to hundreds of models through a single API key. Route to the best model for your use case.

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: {
    primary: "openai", // OpenRouter is OpenAI-compatible
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "anthropic/claude-sonnet-4", // or any OpenRouter model ID
    baseUrl: "https://openrouter.ai/api/v1",
  },
});

await agent.init();

const result = await agent.analyzeTransaction({
  from: "0xSender...",
  to: "0xRecipient...",
  data: "0x38ed1739...",
  value: "0",
});

console.log(`Model used: anthropic/claude-sonnet-4 via OpenRouter`);
console.log(`Confidence: ${result.analysis.confidence}`);
```

---

### 7. Local Ollama

Run analysis entirely on your own hardware — no API keys, no external calls. Requires [Ollama](https://ollama.ai) running locally.

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: {
    primary: "openai", // Ollama exposes an OpenAI-compatible API
    apiKey: "ollama", // Ollama ignores the key but it must be non-empty
    model: "llama3.1:70b", // or any model you've pulled
    baseUrl: "http://localhost:11434/v1",
  },
});

await agent.init();

const result = await agent.analyzeTransaction({
  from: "0xSender...",
  to: "0xRecipient...",
  data: "0x",
  value: "1000000000000000000",
});

console.log(`Fully local analysis via Ollama`);
console.log(`Risk: ${result.analysis.riskScore}/100 — ${result.analysis.reasoning}`);
```

**Requirements:**

```bash
# Pull the model first
ollama pull llama3.1:70b

# Verify it's running
curl http://localhost:11434/v1/models
```

---

### 8. Custom ThreatIntelProvider Implementation

The SDK is database-agnostic. Implement the `ThreatIntelProvider` interface to integrate your own threat intelligence source — PostgreSQL, Redis, a third-party API, or anything else.

```typescript
import {
  SecurityAgent,
  ThreatIntelProvider,
  AddressIntel,
} from "@sifix/agent";

// ─── Custom provider backed by a REST API ─────────────
class MyThreatProvider implements ThreatIntelProvider {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getAddressIntel(address: string): Promise<AddressIntel | null> {
    try {
      const resp = await fetch(
        `${this.baseUrl}/intel/${address.toLowerCase()}`
      );
      if (!resp.ok) return null;

      const data = await resp.json();
      return {
        address: data.address,
        riskScore: data.risk_score,
        labels: data.labels ?? [],
        firstSeen: data.first_seen,
        lastSeen: data.last_seen,
        transactionCount: data.tx_count ?? 0,
        associatedEntities: data.entities ?? [],
      };
    } catch {
      return null;
    }
  }

  async saveScanResult(
    address: string,
    result: AddressIntel
  ): Promise<void> {
    await fetch(`${this.baseUrl}/scans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, result }),
    });
  }
}

// ─── Usage ─────────────────────────────────────────────
const threatProvider = new MyThreatProvider("https://my-threat-db.internal");

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: {
    primary: "galileo",
    apiKey: process.env.SIFIX_AI_API_KEY,
  },
  threatIntel: {
    enabled: true,
    provider: threatProvider, // inject your custom provider
    cacheTtl: 300,
  },
});

await agent.init();
```

**`AddressIntel` fields you must provide:**

- `address` — The queried address
- `riskScore` — 0–100 risk score
- `labels` — String tags like `"phishing"`, `"mixer"`, `"drainer"`
- `firstSeen` / `lastSeen` — ISO 8601 timestamps
- `transactionCount` — Number of associated transactions
- `associatedEntities` — Related addresses or entity names

---

### 9. Batch Analysis

Analyze multiple transactions in parallel with controlled concurrency.

```typescript
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: {
    primary: "galileo",
    apiKey: process.env.SIFIX_AI_API_KEY,
  },
});

await agent.init();

// ─── Transactions to screen ────────────────────────────
const pendingTransactions = [
  {
    from: "0xUser...",
    to: "0xUniswapRouter...",
    data: "0x38ed1739...",
    value: "0",
  },
  {
    from: "0xUser...",
    to: "0xUnknownContract...",
    data: "0x12345678...",
    value: "5000000000000000000",
  },
  {
    from: "0xUser...",
    to: "0xPhishingDrainer...",
    data: "0xabcd...",
    value: "0",
  },
];

// ─── Analyze in parallel ───────────────────────────────
const results = await Promise.all(
  pendingTransactions.map((tx) => agent.analyzeTransaction(tx))
);

// ─── Filter and report ─────────────────────────────────
const dangerous = results.filter(
  (r) => r.analysis.recommendation === "block"
);

console.log(`${dangerous.length} dangerous transactions detected`);

for (const result of dangerous) {
  console.log(`  Score: ${result.analysis.riskScore}/100`);
  console.log(`  Reason: ${result.analysis.reasoning}`);
  for (const threat of result.analysis.threats) {
    console.log(`    - [${threat.severity}] ${threat.type}`);
  }
}

// ─── Controlled concurrency (for large batches) ────────
async function analyzeBatch(
  agent: SecurityAgent,
  transactions: any[],
  concurrency = 3
) {
  const results: any[] = [];

  for (let i = 0; i < transactions.length; i += concurrency) {
    const chunk = transactions.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((tx) => agent.analyzeTransaction(tx))
    );
    results.push(...chunkResults);
  }

  return results;
}
```

---

### 10. Error Handling with Retry

Production-grade error handling with typed catches, exponential backoff, and graceful degradation.

```typescript
import {
  SecurityAgent,
  SimulationError,
  AIAnalysisError,
  RateLimitError,
  StorageError,
} from "@sifix/agent";

const agent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: {
    primary: "galileo",
    apiKey: process.env.SIFIX_AI_API_KEY,
  },
});

await agent.init();

async function analyzeWithRetry(
  tx: {
    from: string;
    to: string;
    data?: string;
    value?: string;
  },
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await agent.analyzeTransaction(tx);
    } catch (error) {
      // ─── Simulation failed (TX would revert) ──────────
      if (error instanceof SimulationError) {
        console.warn(`Transaction would revert: ${error.message}`);
        return {
          simulation: { success: false, gasUsed: 0, gasEstimate: 0, logs: [], stateChanges: [] },
          threatIntel: { fromAddress: null, toAddress: null, relatedScamDomains: [], knownExploitSignatures: [] },
          analysis: {
            riskScore: 0,
            confidence: 1.0,
            reasoning: "Transaction would revert — simulation failed.",
            threats: [],
            recommendation: "block" as const,
            provider: "fallback" as const,
          },
          timestamp: new Date().toISOString(),
          computeProvider: "galileo" as const,
        };
      }

      // ─── Rate limited — wait and retry ─────────────────
      if (error instanceof RateLimitError) {
        const waitSeconds = error.retryAfter ?? Math.pow(2, attempt);
        console.warn(
          `Rate limited. Retrying in ${waitSeconds}s (attempt ${attempt}/${maxRetries})`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, waitSeconds * 1000)
        );
        continue;
      }

      // ─── AI analysis failed — use heuristic fallback ───
      if (error instanceof AIAnalysisError) {
        console.warn(`AI analysis failed: ${error.message}`);
        return heuristicFallback(tx);
      }

      // ─── Storage failed (non-blocking) ─────────────────
      if (error instanceof StorageError) {
        console.warn(`Storage upload failed: ${error.message}`);
        // Continue — storage failure should not block the response
      }

      // ─── Unknown error ─────────────────────────────────
      throw error;
    }
  }

  throw new Error(
    `Max retries (${maxRetries}) exceeded for transaction analysis`
  );
}

// ─── Basic heuristic fallback when AI is unavailable ────
function heuristicFallback(tx: {
  from: string;
  to: string;
  data?: string;
  value?: string;
}) {
  const hasCalldata = tx.data && tx.data !== "0x" && tx.data.length > 10;
  const valueWei = BigInt(tx.value || "0");
  const hasHighValue = valueWei > BigInt("10000000000000000000"); // > 10 ETH

  let riskScore = 0;
  if (hasCalldata) riskScore += 20;
  if (hasHighValue) riskScore += 30;

  return {
    simulation: { success: true, gasUsed: 21000, gasEstimate: 21000, logs: [], stateChanges: [] },
    threatIntel: { fromAddress: null, toAddress: null, relatedScamDomains: [], knownExploitSignatures: [] },
    analysis: {
      riskScore,
      confidence: 0.3,
      reasoning: "Heuristic analysis — AI provider was unavailable.",
      threats: [],
      recommendation: (riskScore >= 40 ? "warn" : "allow") as "warn" | "allow",
      provider: "fallback" as const,
    },
    timestamp: new Date().toISOString(),
    computeProvider: "galileo" as const,
  };
}
```

---

### 11. Storage Mock Mode for Development

Use `mockMode: true` to develop and test without writing to 0G Storage. Returns deterministic mock hashes — no on-chain transactions are created.

```typescript
import { SecurityAgent, StorageClient } from "@sifix/agent";

// ─── Option A: Mock storage via SecurityAgent config ─────
const agent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: {
    primary: "galileo",
    apiKey: process.env.SIFIX_AI_API_KEY,
  },
  storage: {
    enabled: true,
    mockMode: true, // ← deterministic keccak256 hash, no on-chain write
  },
});

await agent.init();

const result = await agent.analyzeTransaction({
  from: "0xTest...",
  to: "0xTest...",
  data: "0x",
  value: "0",
});

// Mock hash — deterministic, never touches the chain
console.log(result.storageRootHash); // "0xabc123..." (mock)

// ─── Option B: Use StorageClient directly in tests ───────
const storage = new StorageClient({ mockMode: true });

const mockHash = await storage.storeAnalysis({
  analysisResult: result,
  metadata: {
    analyzedBy: "0xTestDeveloper...",
    version: "1.5.0",
  },
});

console.log(`Mock hash: ${mockHash}`); // Deterministic keccak256

// Retrieve always returns the stored object in mock mode
const retrieved = await storage.retrieveAnalysis(mockHash);
console.log(retrieved.analysis.riskScore);
```

**When to use mock mode:**

- Unit tests and CI pipelines
- Local development without 0G Storage connectivity
- Benchmarking analysis performance without storage latency
- Demo and staging environments

---

## Extension Integration

### 12. Content Script — TX Interception

The SIFIX extension intercepts `window.ethereum.request()` via a `Proxy` in the MAIN world. This example shows a simplified version of the pattern used in `sifix-extension`.

```typescript
// ─── Content script (runs in MAIN world, before page scripts) ──

// Methods that involve sending transactions
const TX_METHODS = [
  "eth_sendTransaction",
  "eth_signTransaction",
  "eth_sendRawTransaction",
  "wallet_sendCalls",
];

// Methods that request signatures
const SIGN_METHODS = [
  "personal_sign",
  "eth_sign",
  "eth_signTypedData",
  "eth_signTypedData_v3",
  "eth_signTypedData_v4",
];

interface AnalysisResult {
  success: boolean;
  riskScore: number;
  riskLevel: string;
  recommendation: string;
  explanation: string;
  detectedThreats: string[];
  provider?: string;
  storageHash?: string | null;
}

// ─── Send TX to background → dApp API for analysis ─────
function analyzeViaBridge(tx: {
  from?: string;
  to?: string;
  data?: string;
  value?: string;
}): Promise<AnalysisResult> {
  const requestId = "sifix_" + Date.now() + "_" + Math.random().toString(36).slice(2);

  return new Promise((resolve) => {
    const handler = (event: MessageEvent) => {
      if (
        event.data?.type === "SIFIX_ANALYSIS_RESULT" &&
        event.data?.requestId === requestId
      ) {
        window.removeEventListener("message", handler);
        resolve(event.data.result);
      }
    };

    window.addEventListener("message", handler);
    window.postMessage(
      { type: "SIFIX_ANALYZE_TX", requestId, tx },
      "*"
    );

    // 30-second timeout
    setTimeout(() => {
      window.removeEventListener("message", handler);
      resolve({
        success: false,
        riskScore: 0,
        riskLevel: "UNKNOWN",
        recommendation: "PROCEED",
        explanation: "Analysis timed out",
        detectedThreats: [],
      });
    }, 30_000);
  });
}

// ─── Inject Proxy around window.ethereum ────────────────
function injectProxy(original: any) {
  const proxied = new Proxy(original, {
    get(target: any, prop: string | symbol) {
      if (prop === "request") {
        return async function (args: {
          method: string;
          params?: any[];
        }) {
          const { method, params = [] } = args;
          const isTx = TX_METHODS.includes(method);
          const isSign = SIGN_METHODS.includes(method);

          if (isTx || isSign) {
            console.log("[SIFIX] Intercepted:", method);

            const tx = isTx ? params[0] || {} : {};
            const analysis = await analyzeViaBridge(tx);

            // Block dangerous transactions
            if (analysis.riskScore >= 60) {
              const proceed = confirm(
                `[SIFIX] ${analysis.riskLevel} risk (${analysis.riskScore}/100)\n\n` +
                  analysis.explanation +
                  "\n\nProceed anyway?"
              );
              if (!proceed) {
                const err = new Error("Transaction blocked by SIFIX Security Agent");
                (err as any).code = 4001;
                throw err;
              }
            }
          }

          return target.request(args);
        };
      }
      const value = target[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  Object.defineProperty(window, "ethereum", {
    get() {
      return proxied;
    },
    set(newProvider: any) {
      injectProxy(newProvider); // Re-wrap if MetaMask re-injects
    },
    configurable: true,
    enumerable: true,
  });
}

// ─── Wait for window.ethereum to be injected by MetaMask ──
if (window.ethereum) {
  injectProxy(window.ethereum);
} else {
  window.addEventListener(
    "ethereum#initialized",
    () => {
      if (window.ethereum) injectProxy(window.ethereum);
    },
    { once: true }
  );
}
```

**Production notes:**

- The real extension injects via `chrome.scripting.executeScript` at `webNavigation.onBeforeNavigate` with `injectImmediately: true`
- Communication goes through an `api-bridge` content script (ISOLATED world) → dApp API
- The production UI uses custom modals, not `confirm()`

---

## Dashboard REST API Examples

All examples use the production base URL `https://api.sifix.io/v1` and require a SIWE JWT token.

```typescript
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
```

### 13. Scan an Address

```typescript
// ─── Quick scan — cached result or fresh analysis ──────
const response = await fetch(
  "https://api.sifix.io/v1/scan/0x1234567890abcdef1234567890abcdef12345678",
  { headers }
);

const { data } = await response.json();
console.log(data);
// {
//   address: "0x1234567890abcdef...",
//   inputType: "address",
//   riskScore: 82,
//   riskLevel: "CRITICAL",
//   isVerified: true,
//   reportCount: 14,
//   tags: [
//     { tag: "drainer", score: 33, createdAt: "..." },
//     { tag: "phishing", score: 28, createdAt: "..." }
//   ],
//   lastScanned: "2026-05-09T10:00:00Z"
// }
```

```typescript
// ─── Scan a domain ─────────────────────────────────────
const domainResp = await fetch(
  "https://api.sifix.io/v1/scan/evil-phishing.com",
  { headers }
);

const { data: domainData } = await domainResp.json();
console.log(domainData);
// {
//   domain: "evil-phishing.com",
//   inputType: "domain",
//   isScam: true,
//   riskScore: 95,
//   riskLevel: "CRITICAL",
//   category: "PHISHING",
//   checkedAt: "2026-05-09T12:00:00Z"
// }
```

### 14. Community Tags

```typescript
// ─── List top tags ─────────────────────────────────────
const tagsResp = await fetch(
  "https://api.sifix.io/v1/tags?limit=10",
  { headers }
);

const { data: tags } = await tagsResp.json();
console.log(tags);
// [
//   { tag: "drainer", count: 230, upvotes: 1890, downvotes: 12, score: 1878 },
//   { tag: "phishing", count: 180, upvotes: 1520, downvotes: 8, score: 1512 },
//   ...
// ]
```

```typescript
// ─── Tag an address ─────────────────────────────────────
const createTagResp = await fetch("https://api.sifix.io/v1/tags", {
  method: "POST",
  headers,
  body: JSON.stringify({
    address: "0xBadActor...",
    tag: "drainer",
    taggedBy: "0xMyWallet...",
  }),
});

const { data: newTag } = await createTagResp.json();
console.log(newTag);
// { tag: { id: "tag_abc123", tag: "drainer", upvotes: 1, downvotes: 0, ... } }
```

```typescript
// ─── Vote on a tag ─────────────────────────────────────
const voteResp = await fetch(
  "https://api.sifix.io/v1/address/0xBadActor.../tags/tag_abc123/vote",
  {
    method: "POST",
    headers,
    body: JSON.stringify({ direction: "up" }),
  }
);

const { data: voteResult } = await voteResp.json();
console.log(voteResult);
// { tag: "drainer", votes: { up: 35, down: 2 } }
```

### 15. Watchlist

```typescript
// ─── Get your watchlist ────────────────────────────────
const watchlistResp = await fetch(
  "https://api.sifix.io/v1/watchlist?userAddress=0xMyWallet...",
  { headers }
);

const { data: watchlist } = await watchlistResp.json();
console.log(watchlist);
// [
//   {
//     id: "...",
//     userAddress: "0xmywallet...",
//     watchedAddress: "0xsuspicious...",
//     label: "Suspicious whale",
//     lastScore: 72,
//     prevScore: 45,
//     alertOnChange: true,
//     createdAt: "2026-04-15T08:30:00Z"
//   },
//   ...
// ]
```

```typescript
// ─── Add to watchlist ──────────────────────────────────
const addResp = await fetch("https://api.sifix.io/v1/watchlist", {
  method: "POST",
  headers,
  body: JSON.stringify({
    userAddress: "0xMyWallet...",
    watchedAddress: "0xAddressToWatch...",
    label: "Suspicious whale",
  }),
});

const { data: newEntry } = await addResp.json();
console.log(newEntry);
// { id: "...", watchedAddress: "0xaddresstowatch...", label: "Suspicious whale", ... }
```

```typescript
// ─── Remove from watchlist ─────────────────────────────
const removeResp = await fetch(
  "https://api.sifix.io/v1/watchlist/0xAddressToWatch...",
  {
    method: "DELETE",
    headers,
  }
);

const { data } = await removeResp.json();
console.log(data); // { deleted: true, address: "0xaddresstowatch..." }
```

---

## Next Steps

- **[API Reference](./api)** — Complete SDK and REST API documentation
- **[Architecture](./architecture)** — Technical deep dive into the analysis pipeline
- **[Contributing](./contributing)** — How to contribute to SIFIX
