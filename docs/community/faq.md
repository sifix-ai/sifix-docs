---
title: FAQ
description: Frequently asked questions about SIFIX — general, security, technical, and hackathon topics
---

# Frequently Asked Questions

Everything you need to know about SIFIX — organized by category.

---

## General

### What is SIFIX?

SIFIX is an **AI-Powered Wallet Security platform for Web3**. It intercepts, simulates, and analyzes every transaction before it reaches the blockchain — providing real-time risk assessment and protection against phishing, rug pulls, approval scams, and other on-chain exploits. SIFIX acts as an intelligent guardian between you and malicious activity.

Built on the **0G Galileo Testnet** (Chain ID: `16602`), SIFIX combines on-chain simulation with multi-model AI analysis to deliver threat intelligence that traditional wallets cannot match.

---

### Is SIFIX free to use?

Yes. SIFIX is **fully open-source under the MIT License** and free to use during the current testnet phase. All core features — including the Chrome extension, web dashboard, and AI analysis — are available at no cost.

Future mainnet releases may introduce tiered plans for enterprise features, but the core security analysis will remain free and open-source.

---

### What blockchains does SIFIX support?

SIFIX currently operates on the **0G Galileo Testnet** (Chain ID: `16602`). This is where all transaction simulation, AI analysis, and evidence storage take place.

Multi-chain support for Ethereum, Polygon, Arbitrum, Base, and BSC is planned for **v1.6.0**. See the [Changelog](./changelog.md) for roadmap details.

---

### Which wallets are compatible?

SIFIX works with any **Ethereum-compatible wallet** that supports:

- **Sign-In with Ethereum (SIWE)** — For dashboard authentication
- **EIP-1193 provider injection** — For transaction interception via the extension

Tested and supported wallets:

- **MetaMask** — Primary supported wallet
- **Rainbow** — Supported via EIP-1193
- **Coinbase Wallet** — Supported via EIP-1193
- **Browser-injected wallets** — Any wallet that injects `window.ethereum`

Mobile wallet support is planned for a future release.

---

### Who built SIFIX?

SIFIX is developed as an open-source project by the SIFIX AI team, with contributions from the Web3 security community. The project is built on the 0G (ZeroGravity) ecosystem and was initially created for the 0G Galileo hackathon.

---

## Security

### How does SIFIX analyze transactions?

SIFIX uses a **5-step protection pipeline** that runs in under 3 seconds:

1. **Intercept** — Capture the transaction payload from your wallet before signing
2. **Simulate** — Dry-run the transaction against a forked 0G Galileo node to extract state changes
3. **Analyze** — Route the simulation results through multi-model AI (0G Compute, OpenAI, Groq, OpenRouter, Ollama) for threat assessment
4. **Score** — Calculate a 0–100 risk score and assign a tier (SAFE → CRITICAL) with detailed factor breakdown
5. **Act** — Present the verdict to you with recommendations — block high-risk transactions, warn on medium-risk, allow safe ones

No real transactions are ever executed during analysis. SIFIX only simulates and reports.

---

### Is my data safe with SIFIX?

Yes. SIFIX follows a **zero-knowledge approach** to user data:

- **SIFIX never holds your private keys** — Keys stay in your wallet at all times
- **SIFIX never executes transactions** — It only simulates and analyzes
- **SIFIX never stores sensitive data** — Transaction details are analyzed in transit and only evidence hashes are persisted on-chain
- **Analysis evidence is stored on 0G Storage** — Immutable, verifiable, and tamper-proof via root hash verification
- **AI analysis is stateless** — Transaction data is not retained by AI providers beyond the analysis request
- **Authentication uses SIWE** — Your wallet signs a message; no passwords or credentials are stored

---

### What if the AI gets it wrong?

AI analysis is a tool to assist your judgment, not replace it. SIFIX mitigates inaccuracies through:

- **Multi-model verification** — Primary analysis via 0G Compute with fallback to 4 additional providers for cross-referencing
- **Deterministic simulation** — State diffs are calculated deterministically; the AI interprets results but doesn't generate them
- **Historical threat intelligence** — Past analysis results improve future detection accuracy
- **Risk tier system** — Even if the AI misjudges severity, the tier system ensures high-risk transactions get extra scrutiny
- **User override** — You always have final say. SIFIX warns but never blocks you permanently from signing

If you encounter a false positive or false negative, please report it to **security@sifix.ai** to help improve the models.

---

### Can SIFIX steal my funds?

**No.** SIFIX is architecturally incapable of stealing funds:

- **No private key access** — SIFIX never requests, receives, or stores private keys
- **No transaction execution** — SIFIX simulates transactions but never broadcasts them
- **No approval requests** — SIFIX never asks you to approve token transfers or contract interactions
- **Read-only analysis** — The extension intercepts wallet events for reading, not for modifying or signing
- **Open-source code** — Every line of code is auditable in the public repositories

SIFIX is a **read-only security observer**. It watches, analyzes, and reports — nothing more.

---

### How are security reports stored on-chain?

Analysis evidence is stored on **0G Storage** on the 0G Galileo Testnet:

1. The SIFIX agent generates a `SecurityReport` containing the risk score, verdict, risk factors, and AI explanation
2. The report is uploaded to 0G Storage via the Upload API
3. 0G Storage returns a **root hash** — a cryptographic commitment to the data
4. Anyone can retrieve and verify the report using the root hash
5. The data is **immutable** — it cannot be altered after upload

This creates a tamper-proof audit trail of every analysis performed.

---

## Technical

### Which AI provider should I use?

SIFIX supports 5 AI providers with different strengths:

- **0G Compute (Primary)** — Decentralized AI inference native to the 0G ecosystem. Best for production use. Enabled by default
- **OpenAI (GPT-4)** — Highest accuracy for complex DeFi analysis. Best for detailed threat explanations. Requires API key
- **Groq** — Ultra-fast inference with good accuracy. Best when latency is critical. Requires API key
- **OpenRouter** — Aggregates multiple models with flexible routing. Best for experimentation. Requires API key
- **Ollama (Local)** — Runs AI models locally on your machine. Best for privacy-sensitive workflows. No API key needed, but requires local GPU

**Recommendation:** Start with 0G Compute (default). Add OpenAI as a fallback for high-stakes transactions. Use Ollama for offline or privacy-critical analysis.

---

### How do I add a custom chain?

Currently, SIFIX supports the 0G Galileo Testnet natively. Adding custom chains is planned for v1.6.0. In the meantime, you can configure a custom RPC endpoint:

```typescript
import { SecurityAgent } from 'sifix-agent';

const agent = new SecurityAgent({
  network: {
    chainId: 16602,
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    name: '0G Galileo Testnet',
  },
  ai: {
    provider: '0g-compute',
    fallbackProvider: 'openai',
  },
});
```

For multi-chain support updates, follow the [Changelog](./changelog.md).

---

### How do I run SIFIX locally?

You can run the entire SIFIX stack locally for development or self-hosted analysis:

**1. Agent SDK (standalone)**

```bash
git clone https://github.com/sifix-ai/sifix-agent.git
cd sifix-agent
pnpm install
cp .env.example .env
# Configure AI provider keys in .env
pnpm build
pnpm test
```

**2. Dashboard + API**

```bash
git clone https://github.com/sifix-ai/sifix-dapp.git
cd sifix-dapp
pnpm install
cp .env.example .env
pnpm db:push
pnpm dev
# Dashboard runs at http://localhost:3000
```

**3. Chrome Extension**

```bash
git clone https://github.com/sifix-ai/sifix-extension.git
cd sifix-extension
pnpm install
cp .env.example .env
pnpm dev
# Extension auto-loads in Chrome
```

For detailed setup instructions, see the [Contributing](./contributing.md) guide.

---

### The extension is not working — what should I check?

Common issues and solutions:

- **Extension not detecting wallet** — Ensure MetaMask or a compatible wallet is installed and unlocked. SIFIX requires `window.ethereum` to be injected by the wallet
- **No security badge appearing** — Refresh the page after installing the extension. Content scripts inject on page load
- **Analysis returning errors** — Check that the extension has a valid API URL configured (Settings → API Endpoint). Verify the SIFIX API is reachable
- **"Network not supported" error** — Ensure your wallet is connected to 0G Galileo Testnet (Chain ID: 16602). Switch networks in your wallet
- **Popup shows "Not authenticated"** — Click "Connect Wallet" in the popup to sign a SIWE message. If it fails, disconnect and reconnect your wallet
- **Stale risk scores** — Clear the extension cache: Settings → Clear Cache → Reload. The badge data refreshes on each page navigation
- **Extension crashes on specific dApps** — Some dApps override `window.ethereum` in ways that conflict with interception. Report the dApp URL to our GitHub Issues

If your issue persists, open a bug report at [GitHub Issues](https://github.com/sifix-ai/sifix-extension/issues) with your browser version, extension version, wallet version, and steps to reproduce.

---

### How does the risk scoring work?

Every analyzed transaction receives a **0–100 risk score** mapped to 5 tiers:

- **0–20: SAFE** (✅) — Transaction appears benign. No risks detected
- **20–40: LOW** (🟢) — Minor concerns. Proceed with normal caution
- **40–60: MEDIUM** (🟡) — Notable risks identified. Review carefully before signing
- **60–80: HIGH** (🟠) — Significant danger. Transaction is blocked with a warning. Override at your own risk
- **80–100: CRITICAL** (🔴) — Severe threat detected (likely scam/exploit). Transaction is blocked with a strong alert

The score is calculated from multiple factors:

- Token transfer patterns (unusual amounts, unknown tokens)
- Contract interaction analysis (proxy contracts, delegate calls)
- Address reputation (known scam addresses, newly created contracts)
- Approval behavior (unlimited approvals, suspicious spenders)
- State diff analysis (unexpected balance changes, ownership transfers)

Each factor is weighted based on its historical correlation with malicious activity.

---

### Can I use SIFIX programmatically?

Yes. The `sifix-agent` SDK is designed for programmatic use:

```typescript
import { SecurityAgent } from 'sifix-agent';

const agent = new SecurityAgent({
  ai: { provider: 'openai', apiKey: process.env.OPENAI_API_KEY },
  storage: { enabled: true },
});

// Analyze a single transaction
const report = await agent.analyzeTransaction({
  from: '0x1234...5678',
  to: '0xABCDef...1234',
  value: BigInt('1000000000000000000'), // 1 ETH
  data: '0x...',
});

console.log(report.riskScore);    // 85
console.log(report.riskTier);     // 'CRITICAL'
console.log(report.explanation);  // AI-generated explanation
console.log(report.evidenceHash); // 0G Storage root hash

// Batch analyze multiple transactions
const reports = await agent.analyzeBatch([
  { from: '0x...', to: '0x...', data: '0x...' },
  { from: '0x...', to: '0x...', data: '0x...' },
]);
```

See the [Agent SDK Reference](../api-reference/agent-sdk.md) for the full API.

---

## Hackathon

### Why 0G Chain?

SIFIX is built on 0G (ZeroGravity) because it uniquely provides all three infrastructure layers that a decentralized security platform needs:

- **0G EVM** — A fully EVM-compatible execution environment on Galileo Testnet (Chain ID: 16602) for deploying smart contracts and running SIWE authentication
- **0G Storage** — A decentralized data availability layer for storing immutable, tamper-proof analysis evidence with cryptographic verification via root hashes
- **0G Compute** — Decentralized AI inference that powers the security analysis engine without relying on centralized AI providers

No other chain offers all three — storage, compute, and EVM — in a unified ecosystem. This eliminates the need to stitch together separate providers (like IPFS for storage + AWS for compute + Ethereum for contracts) and keeps the entire security pipeline decentralized.

---

### How does 0G Storage work for evidence?

0G Storage provides the immutable evidence layer for SIFIX's security reports:

**Upload Flow:**
1. SIFIX agent completes a security analysis and generates a `SecurityReport`
2. The report is serialized and uploaded to 0G Storage via the Upload API
3. 0G Storage returns a **root hash** — a Merkle-based cryptographic commitment
4. The root hash serves as a permanent, verifiable reference to the report

**Retrieval and Verification:**
1. Any party can retrieve the report using its root hash via the Retrieval API
2. The retrieved data is verified against the root hash to confirm integrity
3. If the data was tampered with, the hash verification fails

This means every security analysis SIFIX performs creates an **immutable, auditable, and publicly verifiable** record on 0G Storage — without relying on centralized databases or trust assumptions.

---

### What is Agentic Identity?

**Agentic Identity** is SIFIX's implementation of **ERC-7857** — an experimental standard that gives AI agents a cryptographically provable on-chain identity.

**Key details:**

- **Contract:** `0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F` on 0G Galileo Testnet
- **Token ID:** `99`
- **Owner:** `0x3b7D569a…` (verified deployer address)

**Why it matters:**

Traditional security tools operate as faceless services — users have no way to verify *who* or *what* produced a security analysis. ERC-7857 changes this by giving the SIFIX AI agent:

- **Signable analysis results** — Every security report can be cryptographically verified as originating from the SIFIX agent
- **Verifiable ownership** — The identity is controlled by a known Ethereum address, establishing accountability
- **On-chain persistence** — The identity exists permanently and cannot be forged
- **Trust chains** — Other agents and smart contracts can verify the SIFIX agent's identity before accepting its analysis
- **Revocation capability** — If the agent is ever compromised, the owner can revoke the identity

In practice, when SIFIX flags a contract as malicious or verifies a domain as safe, these verdicts carry the weight of a **cryptographically signed, on-chain identity** — not just an anonymous API response.

See [Agentic Identity](../product/agentic-identity.md) for the full technical deep-dive.

---

### What is the SIFIX contract address?

The SIFIX ERC-7857 Agentic Identity contract is deployed at:

- **Contract:** `0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F`
- **Token ID:** `99`
- **Network:** 0G Galileo Testnet (Chain ID: `16602`)
- **Explorer:** [View on 0G Chainscan](https://chainscan-galileo.0g.ai)

---

### Where can I find the source code?

All SIFIX repositories are open-source on GitHub:

- **[sifix-agent](https://github.com/sifix-ai/sifix-agent)** — AI Security Agent SDK
- **[sifix-dapp](https://github.com/sifix-ai/sifix-dapp)** — Web Dashboard + API Backend
- **[sifix-extension](https://github.com/sifix-ai/sifix-extension)** — Chrome Extension (MV3)
- **[sifix-docs](https://github.com/sifix-ai/sifix-docs)** — Documentation Site

All repositories are licensed under the **MIT License**. See [Contributing](./contributing.md) for how to get started.
