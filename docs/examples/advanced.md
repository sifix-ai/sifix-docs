---
title: "Advanced Patterns"
description: "Advanced SIFIX SDK patterns — batch analysis with concurrency, custom ThreatIntelProvider, retry with exponential backoff, webhooks, Dashboard API integration, and Chrome Extension content script patterns on 0G Galileo Testnet."
---

# Advanced Patterns

This guide covers advanced integration patterns for production SIFIX deployments — batch analysis with concurrency control, custom threat intelligence providers, resilient error handling, webhook integrations, Dashboard API calls, and Chrome Extension content script patterns.

All examples target the **0G Galileo Testnet** (Chain ID: 16602).

---

## Batch Analysis with Concurrency Control

When scanning multiple addresses or transactions (e.g., a wallet's full history or a monitoring batch), use concurrency-limited batch analysis to balance throughput with API rate limits.

### Basic Batch Analysis

```typescript
// batch-analysis.ts
import { SecurityAgent } from "@sifix/agent";
import type { AnalysisResult } from "@sifix/agent";

interface TxInput {
  from: string;
  to: string;
  data?: string;
  value?: string;
  label?: string; // Optional label for logging
}

async function batchAnalyze(
  agent: SecurityAgent,
  transactions: TxInput[],
  concurrency: number = 3
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  const queue = [...transactions];
  let completed = 0;

  async function worker(workerId: number): Promise<void> {
    while (queue.length > 0) {
      const tx = queue.shift();
      if (!tx) break;

      try {
        const result = await agent.analyzeTransaction({
          from: tx.from,
          to: tx.to,
          data: tx.data,
          value: tx.value,
        });

        results.push(result);
        completed++;

        const label = tx.label || tx.to.slice(0, 10);
        console.log(
          `✅ [${completed}/${transactions.length}] worker-${workerId} ` +
          `${label} → score: ${result.analysis.riskScore} ` +
          `(${result.analysis.recommendation})`
        );
      } catch (error: any) {
        completed++;
        console.error(
          `❌ [${completed}/${transactions.length}] worker-${workerId} ` +
          `Failed: ${error.message}`
        );
      }
    }
  }

  // Spin up N concurrent workers
  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  // Summary
  const safe = results.filter((r) => r.analysis.riskScore <= 20).length;
  const warned = results.filter(
    (r) => r.analysis.riskScore > 20 && r.analysis.riskScore <= 60
  ).length;
  const blocked = results.filter((r) => r.analysis.riskScore > 60).length;

  console.log("\n📊 Batch Summary:");
  console.log(`   Total: ${results.length}`);
  console.log(`   ✅ Safe: ${safe}`);
  console.log(`   ⚠️ Warned: ${warned}`);
  console.log(`   🚨 Blocked: ${blocked}`);

  return results;
}
```

### Usage

```typescript
const agent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: { apiKey: process.env.AI_API_KEY!, model: "gpt-4o" },
  storage: { mockMode: true },
  identity: {
    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
    tokenId: 99,
  },
});
await agent.init();

const transactions: TxInput[] = [
  { from: "0x742d...", to: "0xd8dA...", value: "1000000000000000000", label: "ETH transfer" },
  { from: "0x742d...", to: "0xA0b8...", data: "0x095ea7b9...", value: "0", label: "USDC approve" },
  { from: "0x742d...", to: "0x4E1f...", data: "0x42842e0e...", value: "0", label: "NFT transfer" },
  { from: "0x742d...", to: "0x881d...", data: "0xa9059cbb...", value: "0", label: "Token transfer" },
  { from: "0x742d...", to: "0x68b3...", data: "0x38ed1739...", value: "0", label: "DEX swap" },
];

// Analyze with 3 concurrent workers
const results = await batchAnalyze(agent, transactions, 3);
```

### Rate-Limited Batch (Controlled Throughput)

For external AI providers with rate limits, add inter-request delays:

```typescript
// rate-limited-batch.ts
async function rateLimitedBatch(
  agent: SecurityAgent,
  transactions: TxInput[],
  options: {
    concurrency?: number;
    delayBetweenMs?: number;
    maxRequestsPerMinute?: number;
  } = {}
): Promise<AnalysisResult[]> {
  const { concurrency = 2, delayBetweenMs = 1000, maxRequestsPerMinute = 30 } = options;

  const results: AnalysisResult[] = [];
  const queue = [...transactions];
  const minuteWindow: number[] = []; // Timestamps of requests in current minute

  async function canMakeRequest(): Promise<boolean> {
    const now = Date.now();

    // Remove timestamps older than 1 minute
    while (minuteWindow.length > 0 && now - minuteWindow[0] > 60_000) {
      minuteWindow.shift();
    }

    if (minuteWindow.length >= maxRequestsPerMinute) {
      const waitTime = 60_000 - (now - minuteWindow[0]);
      console.log(`🚦 Rate limit — waiting ${Math.round(waitTime / 1000)}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return canMakeRequest(); // Re-check after waiting
    }

    minuteWindow.push(now);
    return true;
  }

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const tx = queue.shift();
      if (!tx) break;

      await canMakeRequest();

      try {
        const result = await agent.analyzeTransaction(tx);
        results.push(result);
      } catch (error: any) {
        console.error(`Failed: ${error.message}`);
      }

      // Inter-request delay
      if (delayBetweenMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

// Usage: max 20 requests/minute with 2-second delays
const results = await rateLimitedBatch(agent, transactions, {
  concurrency: 2,
  delayBetweenMs: 2000,
  maxRequestsPerMinute: 20,
});
```

---

## Custom ThreatIntelProvider

The `ThreatIntelProvider` interface defines the contract for threat intelligence data sources. Implement it to integrate custom feeds, proprietary databases, or specialized APIs into the SIFIX analysis pipeline.

### Interface

```typescript
interface ThreatIntelProvider {
  getAddressIntel(address: string): Promise<AddressIntel | null>;
  saveScanResult(address: string, result: AddressIntel): Promise<void>;
}

interface AddressIntel {
  address: string;
  riskScore: number;           // 0–100
  labels: string[];            // e.g. ["phishing", "drainer"]
  firstSeen: string;           // ISO 8601
  lastSeen: string;            // ISO 8601
  transactionCount: number;
  associatedEntities: string[];
}
```

### Example: Chainalysis-Style Provider

```typescript
// custom-threat-provider.ts
import { ThreatIntelProvider, AddressIntel } from "@sifix/agent";

class ChainalysisThreatProvider implements ThreatIntelProvider {
  private apiUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: AddressIntel; expires: number }>;
  private cacheTtl: number;

  constructor(apiUrl: string, apiKey: string, cacheTtl: number = 300) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.cache = new Map();
    this.cacheTtl = cacheTtl * 1000; // Convert to ms
  }

  async getAddressIntel(address: string): Promise<AddressIntel | null> {
    // Check cache first
    const cached = this.cache.get(address);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/v1/address/${address}/risk`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5_000), // 5s timeout
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null; // No data available
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      const intel: AddressIntel = {
        address,
        riskScore: data.risk_score ?? 50,
        labels: data.tags ?? [],
        firstSeen: data.first_seen ?? new Date().toISOString(),
        lastSeen: data.last_seen ?? new Date().toISOString(),
        transactionCount: data.tx_count ?? 0,
        associatedEntities: data.related_addresses ?? [],
      };

      // Cache the result
      this.cache.set(address, {
        data: intel,
        expires: Date.now() + this.cacheTtl,
      });

      return intel;
    } catch (error: any) {
      console.error(`ThreatIntel lookup failed for ${address}:`, error.message);
      return null; // Graceful degradation
    }
  }

  async saveScanResult(address: string, result: AddressIntel): Promise<void> {
    // Persist to the external API for future lookups
    try {
      await fetch(`${this.apiUrl}/v1/scans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address, result }),
      });
    } catch (error: any) {
      console.error(`Failed to save scan result:`, error.message);
      // Non-critical — don't throw
    }
  }
}
```

### Example: Multi-Source Aggregator

Combine multiple threat intelligence sources with weighted scoring:

```typescript
// multi-source-intel.ts
import { ThreatIntelProvider, AddressIntel } from "@sifix/agent";

class MultiSourceThreatProvider implements ThreatIntelProvider {
  private sources: { provider: ThreatIntelProvider; weight: number }[];

  constructor(sources: { provider: ThreatIntelProvider; weight: number }[]) {
    // Validate weights sum to 1.0
    const total = sources.reduce((sum, s) => sum + s.weight, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error(`Weights must sum to 1.0, got ${total}`);
    }
    this.sources = sources;
  }

  async getAddressIntel(address: string): Promise<AddressIntel | null> {
    // Query all sources concurrently
    const results = await Promise.allSettled(
      this.sources.map((source) => source.provider.getAddressIntel(address))
    );

    // Collect successful results
    const intelResults: { intel: AddressIntel; weight: number }[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled" && result.value) {
        intelResults.push({ intel: result.value, weight: this.sources[i].weight });
      }
    }

    if (intelResults.length === 0) return null;

    // Aggregate: weighted risk score
    const weightedScore = intelResults.reduce(
      (sum, { intel, weight }) => sum + intel.riskScore * weight,
      0
    );

    // Merge labels (deduplicated)
    const allLabels = [...new Set(intelResults.flatMap(({ intel }) => intel.labels))];

    // Use earliest firstSeen, latest lastSeen
    const firstSeen = intelResults
      .map(({ intel }) => intel.firstSeen)
      .sort()[0];
    const lastSeen = intelResults
      .map(({ intel }) => intel.lastSeen)
      .sort()
      .reverse()[0];

    return {
      address,
      riskScore: Math.round(weightedScore),
      labels: allLabels,
      firstSeen,
      lastSeen,
      transactionCount: Math.max(...intelResults.map(({ intel }) => intel.transactionCount)),
      associatedEntities: [
        ...new Set(intelResults.flatMap(({ intel }) => intel.associatedEntities)),
      ],
    };
  }

  async saveScanResult(address: string, result: AddressIntel): Promise<void> {
    // Save to all sources
    await Promise.allSettled(
      this.sources.map((source) => source.provider.saveScanResult(address, result))
    );
  }
}
```

### Registering a Custom Provider

```typescript
// register-provider.ts
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: { apiKey: process.env.AI_API_KEY!, model: "gpt-4o" },
  storage: { mockMode: true },
  threatIntel: {
    enabled: true,
    provider: new ChainalysisThreatProvider(
      "https://threat-api.example.com",
      process.env.THREAT_API_KEY!,
      300 // 5-minute cache TTL
    ),
  },
  identity: {
    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
    tokenId: 99,
  },
});
```

---

## Error Handling with Retry and Exponential Backoff

### Generic Retry Utility

```typescript
// retry.ts
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;  // Base delay in ms
  maxDelay: number;   // Maximum delay cap in ms
  jitter: boolean;    // Add randomness to prevent thundering herd
  shouldRetry: (error: any) => boolean; // Predicate to decide if retryable
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30_000,
  jitter: true,
  shouldRetry: () => true,
};

async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt > opts.maxRetries;

      if (isLastAttempt || !opts.shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, ...
      let delay = opts.baseDelay * Math.pow(2, attempt - 1);

      // Cap at maxDelay
      delay = Math.min(delay, opts.maxDelay);

      // Add jitter (random 0–50% of delay)
      if (opts.jitter) {
        delay += Math.random() * delay * 0.5;
      }

      console.warn(
        `⚠️ Attempt ${attempt}/${opts.maxRetries} failed: ${error.message}. ` +
        `Retrying in ${Math.round(delay / 1000)}s...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Unreachable");
}
```

### Using Retry with SIFIX Agent

```typescript
// retry-analysis.ts
import { SecurityAgent } from "@sifix/agent";

const agent: SecurityAgent = /* ... */;

// Retry analysis with custom logic
const result = await withRetry(
  () =>
    agent.analyzeTransaction({
      from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
      to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      value: "1000000000000000000",
    }),
  {
    maxRetries: 5,
    baseDelay: 2000,
    shouldRetry: (error) => {
      // Don't retry on configuration errors
      if (error.name === "ConfigurationError") return false;
      // Don't retry on blocked transactions (they'll still be blocked)
      if (error.message?.includes("blocked")) return false;
      // Retry on network, timeout, and AI provider errors
      return (
        error.message?.includes("timeout") ||
        error.message?.includes("network") ||
        error.message?.includes("ECONNRESET") ||
        error.message?.includes("rate limit") ||
        error.message?.includes("503")
      );
    },
  }
);

console.log("Analysis complete:", result.analysis.riskScore);
```

### Circuit Breaker Pattern

For long-running services, implement a circuit breaker to avoid hammering a failing provider:

```typescript
// circuit-breaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private threshold: number = 5,      // Failures before opening
    private resetTimeout: number = 60_000, // Time before trying again
    private halfOpenAttempts: number = 1   // Requests to try in half-open
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure < this.resetTimeout) {
        throw new Error(
          `Circuit breaker is OPEN — retry after ${Math.round(
            (this.resetTimeout - timeSinceFailure) / 1000
          )}s`
        );
      }
      // Transition to half-open
      this.state = "half-open";
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = "open";
      console.error(
        `🔴 Circuit breaker OPEN after ${this.failures} failures. ` +
        `Will retry in ${this.resetTimeout / 1000}s.`
      );
    }
  }

  getState(): string {
    return this.state;
  }
}

// Usage
const breaker = new CircuitBreaker(5, 60_000);

async function resilientAnalyze(tx: any) {
  return breaker.execute(() =>
    withRetry(
      () => agent.analyzeTransaction(tx),
      { maxRetries: 3, baseDelay: 1000 }
    )
  );
}
```

---

## Webhook Integration

SIFIX can send real-time notifications when analysis completes, enabling integration with alerting systems, Slack bots, or custom backends.

### Webhook Server

```typescript
// webhook-server.ts
import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

// Webhook secret for signature verification
const WEBHOOK_SECRET = process.env.SIFIX_WEBHOOK_SECRET!;

// Verify webhook signature
function verifySignature(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Webhook endpoint
app.post("/webhooks/sifix", (req, res) => {
  const signature = req.headers["x-sifix-signature"] as string;
  const payload = JSON.stringify(req.body);

  if (!verifySignature(payload, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { analysis, simulation, threatIntel, storageRootHash, timestamp } = req.body;

  console.log(`[${timestamp}] Risk: ${analysis.riskScore} — ${analysis.recommendation}`);

  // Route based on risk level
  switch (analysis.recommendation) {
    case "block":
      sendCriticalAlert(analysis, threatIntel);
      break;
    case "warn":
      sendWarningNotification(analysis);
      break;
    case "allow":
      logSafeTransaction(analysis);
      break;
  }

  // Store evidence reference
  if (storageRootHash) {
    console.log(`Evidence: https://chainscan-galileo.0g.ai/tx/${storageRootHash}`);
  }

  res.json({ received: true });
});

app.listen(3001, () => {
  console.log("📡 Webhook server listening on port 3001");
});
```

### Webhook Sender (Client-Side)

```typescript
// webhook-sender.ts
import crypto from "crypto";

async function sendWebhook(
  url: string,
  secret: string,
  result: any
): Promise<void> {
  const payload = JSON.stringify({
    analysis: result.analysis,
    simulation: {
      success: result.simulation.success,
      gasUsed: result.simulation.gasUsed,
      stateChanges: result.simulation.stateChanges,
    },
    threatIntel: {
      fromRiskScore: result.threatIntel.fromAddress?.riskScore,
      toRiskScore: result.threatIntel.toAddress?.riskScore,
      relatedScamDomains: result.threatIntel.relatedScamDomains,
    },
    storageRootHash: result.storageRootHash,
    timestamp: result.timestamp,
  });

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SIFIX-Signature": signature,
    },
    body: payload,
  });
}

// Usage after analysis
const result = await agent.analyzeTransaction({ /* ... */ });
await sendWebhook(
  "https://your-server.com/webhooks/sifix",
  process.env.SIFIX_WEBHOOK_SECRET!,
  result
);
```

### Slack Integration via Webhook

```typescript
// slack-webhook.ts
async function sendSlackAlert(
  webhookUrl: string,
  result: any
): Promise<void> {
  const { analysis, threatIntel } = result;

  const emoji =
    analysis.riskScore <= 20 ? "✅" :
    analysis.riskScore <= 60 ? "⚠️" :
    "🚨";

  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: `${emoji} SIFIX Security Alert` },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Risk Score:* ${analysis.riskScore}/100` },
        { type: "mrkdwn", text: `*Action:* ${analysis.recommendation.toUpperCase()}` },
        { type: "mrkdwn", text: `*Confidence:* ${(analysis.confidence * 100).toFixed(1)}%` },
        { type: "mrkdwn", text: `*Provider:* ${analysis.provider}` },
      ],
    },
  ];

  if (analysis.threats.length > 0) {
    const threatLines = analysis.threats
      .map((t: any) => `• [${t.severity}] ${t.type}: ${t.description}`)
      .join("\n");

    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Threats:*\n${threatLines}` },
    });
  }

  if (result.storageRootHash) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📦 Evidence: \`${result.storageRootHash.slice(0, 20)}...\` on 0G Galileo`,
        },
      ],
    });
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });
}
```

---

## Dashboard API Integration

The SIFIX Dashboard exposes **35 REST endpoints** for programmatic access to scans, tags, watchlists, and reports.

### Authentication

All dashboard API calls require a JWT token obtained via SIWE (Sign-In with Ethereum):

```typescript
// dashboard-auth.ts
const API_BASE = "https://api.sifix.io/v1";

async function authenticate(
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
): Promise<string> {
  // Step 1: Get nonce
  const nonceRes = await fetch(`${API_BASE}/auth/nonce`);
  const { nonce } = await nonceRes.json();

  // Step 2: Create SIWE message
  const message = `app.sifix.io wants you to sign in with your Ethereum account:\n` +
    `${walletAddress}\n\n` +
    `Sign in to SIFIX Dashboard\n\n` +
    `URI: https://app.sifix.io\n` +
    `Version: 1\n` +
    `Chain ID: 16602\n` +
    `Nonce: ${nonce}\n` +
    `Issued At: ${new Date().toISOString()}`;

  // Step 3: Sign the message
  const signature = await signMessage(message);

  // Step 4: Verify and get JWT
  const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });

  const { token } = await verifyRes.json();
  return token;
}

// Helper for authenticated requests
function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
```

### Scan an Address

```typescript
// dashboard-scan.ts
async function scanAddress(token: string, address: string) {
  const response = await fetch(`${API_BASE}/scan/${address}`, {
    headers: authHeaders(token),
  });

  const data = await response.json();
  console.log("Address:", data.address);
  console.log("Risk Score:", data.riskScore);
  console.log("Labels:", data.labels.join(", "));
  console.log("First Seen:", data.firstSeen);

  return data;
}
```

### Manage Tags

```typescript
// dashboard-tags.ts
// Get all tags for the authenticated user
async function getTags(token: string) {
  const response = await fetch(`${API_BASE}/tags`, {
    headers: authHeaders(token),
  });
  return response.json();
}

// Create a new tag
async function createTag(token: string, name: string, color: string) {
  const response = await fetch(`${API_BASE}/tags`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name, color }),
  });
  return response.json();
}

// Tag an address
async function tagAddress(
  token: string,
  address: string,
  tagId: string
) {
  const response = await fetch(`${API_BASE}/tags/${tagId}/addresses`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ address }),
  });
  return response.json();
}
```

### Watchlist Operations

```typescript
// dashboard-watchlist.ts
// Get watchlist
async function getWatchlist(token: string) {
  const response = await fetch(`${API_BASE}/watchlist`, {
    headers: authHeaders(token),
  });
  return response.json();
}

// Add address to watchlist
async function addToWatchlist(
  token: string,
  address: string,
  alias?: string,
  alertThreshold: number = 60
) {
  const response = await fetch(`${API_BASE}/watchlist`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ address, alias, alertThreshold }),
  });
  return response.json();
}

// Remove from watchlist
async function removeFromWatchlist(token: string, address: string) {
  await fetch(`${API_BASE}/watchlist/${address}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

// Check watchlist status
async function checkWatchlist(token: string, address: string) {
  const response = await fetch(`${API_BASE}/watchlist/${address}`, {
    headers: authHeaders(token),
  });

  if (response.status === 404) return null;
  return response.json();
}
```

### Domain Check (Public — No Auth)

```typescript
// domain-check.ts
async function checkDomain(domain: string) {
  // This endpoint is public — no authentication required
  const response = await fetch(
    `${API_BASE}/check-domain?domain=${encodeURIComponent(domain)}`
  );

  const data = await response.json();
  return {
    domain: data.domain,
    isScam: data.isScam,
    category: data.category,
    reportedCount: data.reportedCount,
    firstReported: data.firstReported,
  };
}

// Usage
const result = await checkDomain("suspicious-dapp.com");
if (result.isScam) {
  console.log(`🚨 ${result.domain} is flagged as ${result.category} (${result.reportedCount} reports)`);
}
```

---

## Extension Content Script Integration

The SIFIX Chrome Extension uses content scripts to intercept wallet transactions in real-time. Here's the pattern for integrating with the extension's message bus.

### Message Types

```typescript
// types.ts — Content script message types
type ExtensionMessage =
  | { type: "ANALYZE_TX"; payload: { from: string; to: string; data?: string; value?: string } }
  | { type: "ANALYSIS_RESULT"; payload: any }
  | { type: "CHECK_DOMAIN"; payload: { domain: string } }
  | { type: "DOMAIN_RESULT"; payload: { domain: string; isScam: boolean; category?: string } }
  | { type: "GET_STATUS"; payload: {} }
  | { type: "STATUS"; payload: { active: boolean; address?: string } };
```

### Content Script — Transaction Interception

```typescript
// content-tx-interceptor.ts
// This runs in MAIN world to access window.ethereum

(function () {
  const originalRequest = window.ethereum?.request;

  if (!originalRequest) return;

  window.ethereum.request = async function (args: any) {
    // Intercept eth_sendTransaction
    if (args.method === "eth_sendTransaction" && args.params?.[0]) {
      const tx = args.params[0];

      // Forward to background service worker for analysis
      const analysis = await chrome.runtime.sendMessage({
        type: "ANALYZE_TX",
        payload: {
          from: tx.from,
          to: tx.to,
          data: tx.data,
          value: tx.value,
        },
      });

      // Check if transaction should be blocked
      if (analysis.analysis.recommendation === "block") {
        const error = new Error(
          `SIFIX: Transaction blocked — risk score ${analysis.analysis.riskScore}/100. ` +
          `${analysis.analysis.reasoning}`
        );
        (error as any).code = 4001; // User rejected
        throw error;
      }

      // Warn but allow user to proceed
      if (analysis.analysis.recommendation === "warn") {
        const proceed = confirm(
          `⚠️ SIFIX Warning (Risk: ${analysis.analysis.riskScore}/100)\n\n` +
          `${analysis.analysis.reasoning}\n\n` +
          `Proceed anyway?`
        );
        if (!proceed) {
          const error = new Error("SIFIX: User declined warned transaction");
          (error as any).code = 4001;
          throw error;
        }
      }
    }

    // Pass through to original provider
    return originalRequest.call(window.ethereum, args);
  };
})();
```

### Background Service Worker — Analysis Handler

```typescript
// background-analysis.ts
// Service worker that receives intercepted transactions and runs analysis

import { SecurityAgent } from "@sifix/agent";

let agent: SecurityAgent | null = null;

async function getAgent(): Promise<SecurityAgent> {
  if (!agent) {
    agent = new SecurityAgent({
      network: {
        chainId: 16602,
        rpcUrl: "https://evmrpc-testnet.0g.ai",
        name: "0G Galileo Testnet",
      },
      aiProvider: {
        apiKey: (await getStoredApiKey()) || "",
        baseUrl: (await getStoredBaseUrl()) || undefined,
        model: (await getStoredModel()) || "gpt-4o",
      },
      storage: { mockMode: true }, // Extension uses mock mode
      identity: {
        contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
        tokenId: 99,
      },
    });
    await agent.init();
  }
  return agent;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_TX") {
    // Use async handler — return true to keep message channel open
    handleAnalysis(message.payload)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (message.type === "CHECK_DOMAIN") {
    handleDomainCheck(message.payload.domain)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true;
  }
});

async function handleAnalysis(tx: any) {
  const agent = await getAgent();
  const result = await agent.analyzeTransaction(tx);

  // Update extension badge with risk level
  const score = result.analysis.riskScore;
  const badgeText = score > 60 ? "!" : score > 20 ? "?" : "";
  const badgeColor =
    score > 80 ? "#FF0000" :
    score > 60 ? "#FF8800" :
    score > 40 ? "#FFCC00" :
    "#00CC00";

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });

  return result;
}

async function handleDomainCheck(domain: string) {
  const response = await fetch(
    `https://api.sifix.io/v1/check-domain?domain=${encodeURIComponent(domain)}`
  );
  return response.json();
}

// Helper: read stored configuration from extension storage
async function getStoredApiKey(): Promise<string | undefined> {
  const result = await chrome.storage.local.get("apiKey");
  return result.apiKey;
}

async function getStoredBaseUrl(): Promise<string | undefined> {
  const result = await chrome.storage.local.get("baseUrl");
  return result.baseUrl;
}

async function getStoredModel(): Promise<string | undefined> {
  const result = await chrome.storage.local.get("model");
  return result.model;
}
```

### Popup — Display Analysis Results

```typescript
// popup-analysis.ts
// Render analysis results in the extension popup (340×440)

function renderAnalysis(result: any, container: HTMLElement) {
  const { riskScore, recommendation, reasoning, threats, confidence } = result.analysis;

  // Risk tier color
  const tier =
    riskScore <= 20 ? { label: "SAFE", color: "#22C55E", icon: "✅" } :
    riskScore <= 40 ? { label: "LOW", color: "#86EFAC", icon: "🟢" } :
    riskScore <= 60 ? { label: "MEDIUM", color: "#FDE047", icon: "🟡" } :
    riskScore <= 80 ? { label: "HIGH", color: "#FB923C", icon: "🟠" } :
    { label: "CRITICAL", color: "#EF4444", icon: "🔴" };

  container.innerHTML = `
    <div style="text-align: center; padding: 16px;">
      <div style="font-size: 48px;">${tier.icon}</div>
      <div style="font-size: 24px; font-weight: bold; color: ${tier.color};">
        ${tier.label}
      </div>
      <div style="font-size: 14px; color: #888;">
        Risk Score: ${riskScore}/100 · Confidence: ${(confidence * 100).toFixed(0)}%
      </div>
    </div>
    <div style="padding: 0 16px;">
      <p style="font-size: 13px; line-height: 1.5;">${reasoning}</p>
      ${
        threats.length > 0
          ? `<div style="margin-top: 12px;">
              <strong>Threats (${threats.length}):</strong>
              ${threats
                .map(
                  (t: any) =>
                    `<div style="margin: 4px 0; padding: 8px; background: #1a1a2e; border-radius: 6px;">
                      <span style="color: ${severityColor(t.severity)}; font-weight: bold;">${t.severity.toUpperCase()}</span>
                      <span style="color: #ccc;"> ${t.type}</span>
                      <div style="font-size: 11px; color: #888;">${t.description}</div>
                    </div>`
                )
                .join("")}
            </div>`
          : ""
      }
      ${
        result.storageRootHash
          ? `<div style="margin-top: 12px; font-size: 11px; color: #888;">
              📦 Evidence: <code>${result.storageRootHash.slice(0, 20)}...</code>
            </div>`
          : ""
      }
    </div>
  `;
}

function severityColor(severity: string): string {
  switch (severity) {
    case "critical": return "#EF4444";
    case "high": return "#FB923C";
    case "medium": return "#FDE047";
    case "low": return "#86EFAC";
    default: return "#888";
  }
}
```

---

## Related

- **[Basic Analysis](./basic-analysis.md)** — Start with simple transaction analysis
- **[AI Providers](./ai-providers.md)** — Configure AI backends
- **[Storage](./storage.md)** — Store and retrieve analysis evidence
- **[REST API](../api-reference/rest-api.md)** — Full Dashboard API reference (35 endpoints)
- **[Extension API](../api-reference/extension-api.md)** — Chrome extension message protocol
- **[Chrome Extension](../product/extension.md)** — Extension architecture and content scripts
- **[Agent SDK](../api-reference/agent-sdk.md)** — Complete SDK reference
