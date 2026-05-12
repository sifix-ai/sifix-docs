---
title: "AI Providers"
description: "Configure and compare AI providers for SIFIX transaction analysis — 0G Compute (primary), OpenAI, Groq, OpenRouter, and local Ollama with fallback configuration and code examples."
---

# AI Providers

SIFIX uses a **dual-provider AI architecture** with automatic fallback. The primary provider is **0G Compute** on Galileo; if it's unavailable, the system seamlessly falls back to an OpenAI-compatible endpoint. This guide covers setting up each supported provider, comparing their characteristics, and configuring intelligent fallback chains.

All providers connect through the `aiProvider` field in the `SecurityAgent` configuration.

---

## Provider Comparison

- **0G Compute** — Primary · Decentralized · Native Galileo integration · Latency: 3–8s · Cost: Free (testnet) · Quality: High
- **OpenAI** — Fallback · gpt-4o · Industry standard · Latency: 1–3s · Cost: ~$0.005/analysis · Quality: High
- **Groq** — Fast inference · LPU hardware · Ultra-low latency · Latency: 0.2–0.5s · Cost: Free tier / ~$0.001 · Quality: Good
- **OpenRouter** — Multi-model gateway · 200+ models · Flexible routing · Latency: 1–5s · Cost: Varies by model · Quality: Model-dependent
- **Ollama** — Self-hosted · Full privacy · No API key needed · Latency: 2–15s (hardware-dependent) · Cost: Infrastructure only · Quality: Model-dependent

---

## Provider 1 — 0G Compute (Primary)

0G Compute is the default and recommended primary provider. It runs decentralized AI inference directly on the 0G Galileo network, providing native integration with SIFIX's storage and identity layer.

```typescript
// 0g-compute.ts
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
    apiKey: process.env.OPENAI_API_KEY!, // Fallback key
    model: "sifix-security-v1",
    timeout: 30_000,
  },
  storage: { enabled: true, mockMode: false },
  identity: {
    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
    tokenId: 99,
  },
});

await agent.init();
```

### How It Works

The 0G Compute pipeline operates in two stages:

**Stage 1 — Feed Submission:** The analysis payload is submitted as a structured blob to the 0G Compute feed endpoint.

```typescript
// Internal flow — shown for understanding
const payload = {
  type: "security-analysis",
  version: "1.5.0",
  input: {
    transaction: { from, to, data, value },
    simulation: simulationResults,
    threatIntel: aggregatedThreats,
  },
  options: { temperature: 0.1, max_tokens: 2048 },
};

// Submitted to 0G Compute feed API
const feedResult = await zeroGCompute.submitFeed({
  model: "sifix-security-v1",
  blob: JSON.stringify(payload),
});
// feedResult.feedId → used to poll for inference
```

**Stage 2 — Inference Retrieval:** After processing, the inference endpoint is polled for results with a configurable timeout.

```typescript
// Internal flow — shown for understanding
const inference = await zeroGCompute.getInference({
  feedId: feedResult.feedId,
  timeout: 10_000, // 10-second timeout before fallback
});

if (inference.status === "completed") {
  const analysis = JSON.parse(inference.output);
  // analysis: { riskScore, threats, reasoning, confidence, recommendation }
}
```

### When Fallback Triggers

- 0G Compute endpoint is unreachable
- Inference timeout exceeded (default: 10 seconds)
- Malformed or invalid inference response
- Network connectivity issues between the agent and Galileo

---

## Provider 2 — OpenAI

OpenAI serves as the default fallback provider. It uses the standard OpenAI API with a custom system prompt tailored for Web3 security analysis.

```typescript
// openai-provider.ts
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: {
    primary: "0g-compute",
    fallback: "openai",
    apiKey: process.env.OPENAI_API_KEY!,
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o",
    timeout: 30_000,
  },
  storage: { mockMode: true },
  identity: {
    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
    tokenId: 99,
  },
});

await agent.init();
```

**Environment setup:**

```bash
export OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxx"
```

### Using OpenAI as Primary (Skip 0G Compute)

For development or when 0G Compute is under maintenance, you can set OpenAI as the sole provider:

```typescript
const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: {
    apiKey: process.env.OPENAI_API_KEY!,
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o",
  },
  storage: { mockMode: true },
});

await agent.init();
// All analysis will use OpenAI directly — no 0G Compute attempt
```

### Model Selection Guide

- **`gpt-4o`** — Recommended. Best quality for security analysis, good speed.
- **`gpt-4o-mini`** — Faster, cheaper. Good for bulk scanning where precision is less critical.
- **`gpt-4-turbo`** — Alternative. Similar quality, slightly slower than gpt-4o.

```typescript
// Cost-optimized for batch scanning
const agent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: "gpt-4o-mini", // 60x cheaper than gpt-4o
  },
  storage: { mockMode: true },
});
```

---

## Provider 3 — Groq (Fast Inference)

Groq uses custom LPU (Language Processing Unit) hardware for ultra-fast inference. It's ideal when latency is critical — for example, real-time transaction interception in the browser extension.

```typescript
// groq-provider.ts
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: {
    apiKey: process.env.GROQ_API_KEY!,
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.1-70b-versatile",
    timeout: 15_000, // Lower timeout — Groq is fast
  },
  storage: { mockMode: true },
  identity: {
    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
    tokenId: 99,
  },
});

await agent.init();
```

**Environment setup:**

```bash
export GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxx"
export AI_BASE_URL="https://api.groq.com/openai/v1"
export AI_MODEL="llama-3.1-70b-versatile"
```

### Recommended Groq Models

- **`llama-3.1-70b-versatile`** — Best balance of quality and speed for security analysis
- **`llama-3.1-8b-instant`** — Fastest response, suitable for quick risk screening
- **`mixtral-8x7b-32768`** — Larger context window, good for complex multi-step analysis

```typescript
// Ultra-fast screening mode
const screeningAgent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: {
    apiKey: process.env.GROQ_API_KEY!,
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.1-8b-instant", // ~200ms response time
  },
  storage: { mockMode: true },
});
```

---

## Provider 4 — OpenRouter (Multi-Model Gateway)

OpenRouter provides access to 200+ models through a single API endpoint. This is useful for A/B testing different models or routing specific transaction types to specialized models.

```typescript
// openrouter-provider.ts
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: {
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseUrl: "https://openrouter.ai/api/v1",
    model: "anthropic/claude-3.5-sonnet", // Any model from openrouter.ai/models
    timeout: 30_000,
  },
  storage: { mockMode: true },
  identity: {
    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
    tokenId: 99,
  },
});

await agent.init();
```

**Environment setup:**

```bash
export OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxxxxxx"
export AI_BASE_URL="https://openrouter.ai/api/v1"
export AI_MODEL="anthropic/claude-3.5-sonnet"
```

### Recommended OpenRouter Models for Security Analysis

```typescript
// High-quality analysis with Claude
const claudeAgent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: {
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseUrl: "https://openrouter.ai/api/v1",
    model: "anthropic/claude-3.5-sonnet",
  },
  storage: { mockMode: true },
});

// Cost-effective with Llama
const llamaAgent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: {
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseUrl: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.1-70b-instruct",
  },
  storage: { mockMode: true },
});

// Deep analysis with GPT-4 (via OpenRouter)
const deepAgent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: {
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o",
  },
  storage: { mockMode: true },
});
```

---

## Provider 5 — Local Ollama (Self-Hosted)

Ollama lets you run AI models locally for complete privacy and zero API costs. Ideal for development, air-gapped environments, or when handling sensitive analysis at scale.

### Prerequisites

1. Install Ollama: [https://ollama.com/download](https://ollama.com/download)
2. Pull a model:

```bash
# Pull a recommended model
ollama pull llama3.1:70b

# Or a smaller model for constrained hardware
ollama pull llama3.1:8b
```

3. Start the Ollama server (runs on `http://localhost:11434` by default):

```bash
ollama serve
```

### Configuration

```typescript
// ollama-provider.ts
import { SecurityAgent } from "@sifix/agent";

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: {
    apiKey: "ollama", // Ollama doesn't require a real key, but the field must be non-empty
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.1:70b",
    timeout: 60_000, // Local inference can be slower — increase timeout
  },
  storage: { mockMode: true },
  identity: {
    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
    tokenId: 99,
  },
});

await agent.init();
```

### Recommended Local Models

- **`llama3.1:70b`** — Best quality for security analysis. Requires ~40GB RAM or GPU VRAM.
- **`llama3.1:8b`** — Good balance. Runs on consumer hardware (8GB+ RAM).
- **`codellama:34b`** — Strong at calldata decoding and pattern recognition.
- **`qwen2.5:72b`** — Excellent reasoning capabilities for threat classification.

```typescript
// Lightweight setup for development machines
const devAgent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: {
    apiKey: "ollama",
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.1:8b", // Runs on 8GB RAM
    timeout: 45_000,
  },
  storage: { mockMode: true },
});
```

---

## Fallback Configuration

SIFIX's fallback system ensures analysis never fails due to a single provider outage. Configure a chain of providers that are tried in order.

### Basic Fallback (0G Compute → OpenAI)

This is the default configuration. No extra setup needed — just provide an OpenAI key alongside the 0G Compute primary:

```typescript
const agent = new SecurityAgent({
  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
  aiProvider: {
    primary: "0g-compute",
    fallback: "openai",
    apiKey: process.env.OPENAI_API_KEY!,
    model: "gpt-4o",
    timeout: 30_000,
  },
  storage: { mockMode: true },
});
```

### Multi-Provider Fallback Chain

For maximum reliability, chain multiple providers. The SDK tries each in order until one succeeds:

```typescript
// multi-fallback.ts
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
  timeout: 30_000,
});

// The analyzer automatically:
// 1. Tries 0G Compute (primary)
// 2. On failure/timeout → falls back to OpenAI
// 3. Returns which provider was used in result.provider
```

### Checking Which Provider Was Used

Every analysis result includes a `provider` field indicating which backend fulfilled the request:

```typescript
const result = await agent.analyzeTransaction({
  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  value: "1000000000000000000",
});

// Check who handled the analysis
console.log(result.analysis.provider);
// "galileo" → 0G Compute handled it (primary)
// "openai" → OpenAI handled it (fallback)
// "fallback" → Generic fallback was used

// Confidence is adjusted when fallback is used
if (result.analysis.provider !== "galileo") {
  console.log("⚠️ Analysis used fallback provider — confidence may be lower");
}

console.log(result.computeProvider);
// "galileo" or "openai" — indicates the compute backend
```

### Environment-Based Provider Selection

Use environment variables to dynamically select providers across environments:

```typescript
// dynamic-provider.ts
import { SecurityAgent } from "@sifix/agent";

function getProviderConfig() {
  const env = process.env.NODE_ENV || "development";

  switch (env) {
    case "production":
      // Production: 0G Compute primary, OpenAI fallback
      return {
        primary: "0g-compute" as const,
        fallback: "openai" as const,
        apiKey: process.env.OPENAI_API_KEY!,
        model: "gpt-4o",
        timeout: 30_000,
      };

    case "staging":
      // Staging: Groq for fast iteration
      return {
        apiKey: process.env.GROQ_API_KEY!,
        baseUrl: "https://api.groq.com/openai/v1",
        model: "llama-3.1-70b-versatile",
        timeout: 15_000,
      };

    case "development":
      // Dev: Local Ollama, no API costs
      return {
        apiKey: "ollama",
        baseUrl: "http://localhost:11434/v1",
        model: "llama3.1:8b",
        timeout: 60_000,
      };

    case "test":
      // Tests: Mock mode, no real AI calls
      return {
        apiKey: "test-key",
        baseUrl: "http://localhost:11434/v1",
        model: "test-model",
        timeout: 5_000,
      };

    default:
      throw new Error(`Unknown NODE_ENV: ${env}`);
  }
}

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
  },
  aiProvider: getProviderConfig(),
  storage: { mockMode: process.env.NODE_ENV !== "production" },
  identity: {
    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
    tokenId: 99,
  },
});
```

---

## Related

- **[Basic Analysis](./basic-analysis)** — Use providers to analyze common transaction types
- **[Storage](./storage)** — Store analysis results on 0G Storage
- **[Advanced Patterns](./advanced)** — Batch analysis with concurrent provider calls
- **[Agent SDK — AIAnalyzer](../api-reference/agent-sdk.md#aianalyzer)** — Full API reference
- **[0G Integration](../product/0g-integration)** — Deep dive into 0G Compute architecture
