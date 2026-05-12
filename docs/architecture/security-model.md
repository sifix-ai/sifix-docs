---
title: Security Model
description: Comprehensive security architecture of SIFIX — extension isolation, agent sandboxing, smart contract access control, privacy protections, and the threat model defining what SIFIX can and cannot protect against.
---

# Security Model

> **🎯 TL;DR**
> SIFIX is a security tool, so it needs to be secure itself. This page explains how SIFIX protects every layer — from the browser extension to the server to the blockchain. Think of it as the **blueprints for a bank vault**: every door, every lock, and every camera is documented here, along with what it can and can't protect against.

## Why Security Matters in Web3

In traditional web applications, if something goes wrong — an unauthorized charge, a hacked account — there's usually a customer support team, a bank, or a legal system that can help you recover your funds. **Web3 is different.** Blockchain transactions are **irreversible by design**. Once you confirm a transaction, there is no "undo" button, no customer service hotline, and often no legal recourse.

This creates a uniquely high-stakes environment:

- **One click can drain your entire wallet.** A malicious "approve" transaction can give a scammer unlimited access to your tokens.
- **Scams are sophisticated.** Modern phishing sites look identical to real dApps — even experienced users get tricked.
- **No safety net.** Unlike a credit card dispute, stolen crypto is gone for good.
- **Anyone can create a smart contract.** There's no app store review process. Malicious contracts go live instantly.

SIFIX exists because **prevention is the only defense** in Web3. If a transaction looks dangerous, SIFIX warns you *before* you sign it — when it still matters. But for SIFIX's warnings to be trustworthy, SIFIX itself must be built with the highest security standards. This document explains how.

---

SIFIX is a security product, and its own security architecture is paramount. This document covers how SIFIX protects each layer — from the browser extension's content script isolation to the agent SDK's simulation sandbox, smart contract access controls, and privacy guarantees.

---

## Extension Security

### Content Script Isolation

The SIFIX extension uses Chrome Manifest V3's world isolation to prevent cross-context attacks:

- **MAIN world (`tx-interceptor`)** — Runs in the page's JavaScript context to proxy `window.ethereum`. This is the only script that shares context with page scripts. It communicates exclusively via `chrome.runtime.sendMessage` and never directly accesses extension APIs.
- **ISOLATED world (`api-bridge`, `auth-bridge`)** — Runs in a separate JavaScript context with access to Chrome extension APIs but isolated from page scripts. Page scripts cannot read, modify, or call into isolated world scripts.
- **Overlay scripts (`sifix-badge`, `dapp-checker`)** — Injected as UI overlays. Shadow DOM encapsulation prevents page CSS from affecting SIFIX UI elements.

**Isolation guarantees:**

- Page scripts **cannot** access `chrome.runtime`, `chrome.storage`, or any extension API
- Extension scripts **cannot** be called directly from page code
- The only cross-context channel is `chrome.runtime.sendMessage` / `onMessage`
- The `auth-bridge` uses `window.postMessage` with strict origin validation to receive the JWT from the dApp page — it only accepts messages from the SIFIX dApp origin

### Message Validation

All messages between content scripts, background worker, and popup are validated:

```typescript
// Every internal message has a typed shape and is validated at the receiver
interface ExtensionMessage {
  type: "ANALYZE_TX" | "SCAN_DOMAIN" | "AUTH_STATUS" | "SETTINGS_UPDATE" | ...;
  payload: unknown;
  requestId: string;
  timestamp: number;
}

// Receivers validate:
// 1. message.type is a known enum value
// 2. message.payload matches the expected shape for that type
// 3. message.timestamp is within acceptable window (±30s)
// 4. message.requestId is unique (replay protection)
```

- All message handlers validate the `type` field against a known enum — unknown types are silently dropped
- Payloads are validated for expected shape before processing
- Timestamps are checked to reject stale or delayed messages
- Request IDs prevent replay attacks within the extension's internal messaging

### API Key Protection

- **AI API keys** (`AI_API_KEY`, `COMPUTE_PRIVATE_KEY`, `STORAGE_PRIVATE_KEY`) are **server-side only** — they exist exclusively in the dApp's `.env` file and are never sent to the browser
- The extension never has access to any API key — it communicates only via the dApp's authenticated REST API
- The extension's `chrome.storage.local` stores only:
  - JWT bearer token (from SIWE auth)
  - User settings (AI provider preference)
  - Wallet connection state
  - Domain scan cache
- The `NEXT_PUBLIC_` prefix is used **only** for non-sensitive values (chain config, contract addresses, WalletConnect project ID)

### Early Injection Integrity

The `tx-interceptor.js` is injected at `webNavigation.onBeforeNavigate` with `injectImmediately: true` and `world: "MAIN"`. This ensures:

- The proxy is installed **before** any page scripts execute
- No dApp can detect the proxy's presence through timing attacks (it's always there first)
- The original `window.ethereum.request` is captured before any page code can wrap or replace it
- The pre-compiled `static/tx-interceptor.js` is bundled at build time and cannot be modified at runtime

---

## Agent Security

### Simulation Sandbox

The `TransactionSimulator` uses viem's `publicClient.call()` which executes an `eth_call` against the 0G Galileo RPC. This is a **read-only simulation** — it:

- Does **not** broadcast any transaction
- Does **not** modify chain state
- Does **not** consume gas or require signatures
- Runs against the current block state (or a specified block tag)
- Cannot be used to execute arbitrary state changes

The simulation result is treated as **untrusted input** — it's validated and normalized before being passed to the AI analyzer. Malformed or unexpected simulation results trigger a conservative WARN recommendation.

### Rate Limiting

- **API routes:** Rate limited per-wallet-address based on the SIWE JWT identity. Prevents abuse of the analysis pipeline.
- **Extension analysis:** The `POST /api/v1/extension/analyze` endpoint enforces per-session limits to prevent a compromised extension from flooding the agent with requests.
- **Domain scanning:** The background worker caches domain check results per session, avoiding redundant API calls for the same domain within a browsing session.

### Input Validation

All API inputs are validated with **Zod schemas** before processing:

```typescript
// Example: Extension analysis request validation
const AnalyzeRequestSchema = z.object({
  method: z.enum([
    "eth_sendTransaction",
    "personal_sign",
    "eth_signTypedData",
    // ... all intercepted methods
  ]),
  params: z.array(z.unknown()).min(1).max(10),
  origin: z.string().url(),
  timestamp: z.number().int().positive(),
  requestId: z.string().uuid(),
});
```

- Invalid requests return `400 Bad Request` with a descriptive error
- All address fields are validated as valid hex strings with proper checksum
- Numeric fields are range-checked (e.g., risk scores must be 0–100)
- JSON payloads are size-limited to prevent memory exhaustion

### AI Response Sanitization

AI analysis responses are validated before use:

- `riskScore` must be a number in the range [0, 100]
- `confidence` must be a number in the range [0, 1]
- `recommendation` must be one of `ALLOW`, `WARN`, `BLOCK`
- `threats` must be an array of objects with required fields
- Any field failing validation causes a fallback to conservative defaults (WARN recommendation, score of 50)

---

## Smart Contract Security

### Access Control

SIFIX's smart contracts on 0G Galileo use role-based access control:

- **Owner functions** — Contract initialization, parameter updates, and emergency functions are restricted to the contract owner
- **Agent registry** — Only registered agent addresses can submit analysis results and update reputation scores
- **User functions** — Any address can query analysis results, submit threat reports, and vote on community tags

### Data Validation

On-chain data is validated at the contract level:

- Analysis hashes must be valid bytes32 values
- Reputation scores must be within the [0, 100] range
- Address parameters are checked for non-zero values
- Report submissions require valid evidence hashes

### Immutable Audit Trail

All analysis results stored via 0G Storage are:

- **Content-addressed** — The Merkle root hash is derived from the content itself, making tampering detectable
- **Immutable** — Once uploaded and anchored on-chain, the data cannot be modified
- **Verifiable** — Anyone can download the JSON from 0G Storage and verify it matches the on-chain root hash
- **Timestamped** — Block timestamps and upload receipts provide a chronological audit trail

---

## Privacy Model

### Zero-Knowledge Approach

SIFIX follows a **zero-knowledge philosophy** where the agent never needs to know the user's identity:

- **No KYC required** — Users authenticate with their wallet address via SIWE. No personal information is collected.
- **No transaction broadcasting** — The agent only simulates transactions; it never signs or broadcasts anything.
- **No private key access** — The extension never requests private keys. All signing happens in MetaMask.
- **Analysis is address-based** — Threat intelligence is aggregated by address, not by user identity.

### Local-First Data

The extension prioritizes local data storage:

- **Dexie IndexedDB** — Transaction history and community tag caches live in the browser's local IndexedDB
- **chrome.storage.local** — Auth tokens, settings, and wallet state stay on the device
- **Domain scan cache** — Session-scoped cache avoids sending the same domain to the API repeatedly
- **Settings** — AI provider preferences and notification settings are stored locally

### Optional Cloud Sync

The dApp dashboard provides additional features (watchlists, analytics, community tags) that require server-side storage. These are **opt-in**:

- Connecting to the dApp and signing in via SIWE is required only for extension activation
- Users can use the extension for domain scanning without creating a dApp session
- Watchlist and tag data is associated with the wallet address, not with any personal identifier
- Users can clear their data at any time through the dashboard settings

### Data Minimization

- **Scan records** store only what's necessary: addresses, scores, hashes, timestamps
- **No transaction content** — The agent does not store the full transaction calldata after analysis completes
- **Aggregated threat intel** — Historical context is aggregated (averages, max, distributions) rather than storing raw scan results in the AI prompt
- **0G Storage** — Full analysis JSON is stored on decentralized storage, but only the root hash reference is kept in the SQLite database

---

## Threat Model

### What SIFIX Protects Against

SIFIX is designed to detect and prevent the following categories of threats:

- **Phishing dApps** — Malicious websites that impersonate legitimate dApps to steal funds. Detected via domain safety scanning (5-layer pipeline: local blacklist → SIFIX API → GoPlus fallback) and warning banners on dangerous pages.
- **Malicious transaction payloads** — Transactions with harmful calldata (token draining, approval exploits, unauthorized transfers). Detected via simulation + AI analysis.
- **Approval exploits** — Excessive or suspicious ERC-20/ERC-721 approval requests. The AI flags unusually large approvals, approvals to unknown contracts, and approvals that differ from the expected dApp behavior.
- **Known scam addresses** — Addresses previously flagged by the community or automated systems. Detected via threat intelligence lookups.
- **Dusting attacks** — Micro-transactions designed to link addresses. The AI flags transactions from known dusting patterns.
- **Rug pull indicators** — Smart contract patterns associated with rug pulls (hidden mint functions, unrestricted token minting, unusual owner privileges). Detected via simulation analysis.
- **Social engineering via dApps** — Fake airdrop sites, impersonation dApps, and urgent-action scams. Detected via domain safety scanning and community-reported scam domains.

### What SIFIX Cannot Protect Against

SIFIX has known limitations. It does **not** protect against:

- **Zero-day exploits** — Novel attack vectors that haven't been seen before may not be flagged by the AI or threat intel system. The AI's training data may not cover every possible attack pattern.
- **Private key compromise** — If a user's private key or seed phrase is already compromised, SIFIX cannot prevent the attacker from signing transactions. SIFIX intercepts `window.ethereum` calls, but a compromised key can be used outside the browser.
- **Social engineering outside the browser** — Phishing emails, Discord scams, and phone-based social engineering attacks that don't involve a dApp transaction are outside SIFIX's scope.
- **Front-running and MEV** — SIFIX simulates transactions against current state but cannot predict or prevent front-running attacks that occur between simulation and actual broadcast.
- **Compromised MetaMask or browser** — If the user's browser or MetaMask extension is compromised (e.g., via a malicious browser extension), the attacker may bypass SIFIX's interception layer.
- **AI hallucinations** — The AI may occasionally produce incorrect risk assessments. Low-confidence analyses are flagged, and users should always review the reasoning.
- **Network-level attacks** — DNS hijacking, BGP attacks, or RPC endpoint compromise are outside SIFIX's threat model.
- **Smart contract bugs in SIFIX's own contracts** — While SIFIX's contracts are designed with security best practices, they have not been formally verified or audited by a third party.

### Security Assumptions

SIFIX's security model relies on these assumptions:

1. **The user's browser is not compromised** — The extension's isolation guarantees depend on Chrome's security model being intact.
2. **MetaMask is trustworthy** — SIFIX delegates all signing to MetaMask and assumes the wallet extension is not malicious.
3. **0G Galileo RPC is available** — Transaction simulation requires RPC access. If the RPC is down, simulation fails gracefully.
4. **AI providers are not adversarial** — The AI analysis assumes the configured provider returns genuine analysis, not crafted adversarial responses.
5. **The dApp server is operated by SIFIX** — The dApp server handles API keys and JWT validation. A compromised server could bypass authentication.

---

## Security Best Practices for Contributors

When contributing to SIFIX, follow these security guidelines:

- **Never commit API keys or private keys** — Use `.env` files (gitignored) for all secrets
- **Validate all inputs** — Use Zod schemas for every API endpoint and every internal message handler
- **Fail conservatively** — When in doubt, return a WARN recommendation rather than ALLOW
- **Test with mock mode** — Use `STORAGE_MOCK_MODE=true` and never test with real funded wallets
- **Sanitize AI outputs** — Always validate AI responses against expected schemas before using them
- **No eval or Function constructors** — Never execute arbitrary code from user input or AI responses
- **Keep dependencies updated** — Run `pnpm audit` regularly and update vulnerable packages

---

## See Also

- **[System Overview](/architecture/system-overview)** — Full architecture with all components
- **[Data Flow](/architecture/data-flow)** — Detailed pipeline with error handling at each step
- **[Auth Flow](/architecture/auth-flow)** — SIWE authentication and token security
