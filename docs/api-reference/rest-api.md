---
title: "REST API"
description: "Complete reference for the SIFIX dApp REST API — 35 endpoints across 11 domains for scanning, analysis, threats, reports, tags, watchlist, scam domains, auth, system, storage, and identity on 0G Galileo Testnet."
---

# REST API

The SIFIX dApp exposes **35 REST endpoints** organized across 11 domains. These endpoints power the dashboard, Chrome extension, and all programmatic interactions with the SIFIX security platform on **0G Galileo Testnet**.

---

## Base URL & Authentication

**Base URL:**

```
https://api.sifix.io/v1
```

**Authentication:**

Most endpoints require a JWT token obtained via the [Auth](#auth) flow (SIWE — Sign-In with Ethereum). Include it in the `Authorization` header:

```typescript
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
```

Public endpoints (no auth required): `GET /health`, `GET /check-domain`

---

## Scanning

### `GET /check-domain`

Check whether a domain is flagged as a known scam. **Public endpoint — no authentication required.**

**Query Parameters:**

- `domain` **`string`** — The domain to check (required)

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/check-domain?domain=evil-phishing.com"
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

### `GET /scan/:address`

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
//   threats: [
//     { type: "phishing", severity: "high", description: "..." }
//   ]
// }
```

---

### `POST /scan`

Submit a new scan request for one or more addresses.

**Request Body:**

- `addresses` **`string[]`** — Array of EVM addresses to scan
- `options` **`object`** *(optional)*
  - `deepScan` **`boolean`** — Enable extended analysis (default: `false`)
  - `includeStorage` **`boolean`** — Persist result on 0G Storage (default: `false`)

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
//   results: [
//     { address: "0x1234...", riskScore: 82, status: "complete" },
//     { address: "0xabcd...", riskScore: 12, status: "complete" }
//   ],
//   estimatedTime: "30s"
// }
```

---

## Analysis

### `POST /analyze`

Perform a full AI-powered security analysis on a transaction or contract interaction. Runs simulation, threat intelligence lookup, and AI risk assessment.

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
//   threatIntel: {
//     fromAddress: null,
//     toAddress: { riskScore: 72, labels: ["drainer"] },
//     relatedScamDomains: [],
//     knownExploitSignatures: []
//   },
//   analysis: {
//     riskScore: 15,
//     confidence: 0.92,
//     reasoning: "Standard ERC-20 transfer to a verified address...",
//     threats: [],
//     recommendation: "allow",
//     provider: "galileo"
//   },
//   timestamp: "2026-05-09T12:00:00Z",
//   storageRootHash: "0xdef456...",
//   computeProvider: "galileo"
// }
```

---

### `POST /extension/analyze`

Analysis endpoint optimized for the browser extension. Accepts a lighter payload and returns a streamlined response suitable for popup and overlay UIs.

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
//   details: {
//     simulation: { success: true, gasUsed: 184200 },
//     threats: [],
//     provider: "galileo"
//   }
// }
```

---

## Threats

### `GET /threats`

Retrieve a paginated list of known threats.

**Query Parameters:**

- `page` **`number`** — Page number (default: `1`)
- `limit` **`number`** — Results per page (default: `20`, max: `100`)
- `category` **`string`** *(optional)* — Filter by category (`phishing`, `drainer`, `mixer`, `honeypot`, `rug-pull`)
- `severity` **`string`** *(optional)* — Filter by severity (`low`, `medium`, `high`, `critical`)

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/threats?category=phishing&limit=10",
  { headers }
);

const data = await response.json();
// {
//   threats: [
//     {
//       id: "threat_001",
//       type: "phishing",
//       severity: "high",
//       address: "0xBadActor...",
//       description: "Wallet drainer targeting DeFi users",
//       firstSeen: "2025-11-15T...",
//       reports: 23
//     },
//     ...
//   ],
//   pagination: { page: 1, limit: 10, total: 1423 }
// }
```

---

### `POST /threats/report`

Submit a new threat report. Requires authentication.

**Request Body:**

- `address` **`string`** — The malicious address
- `category` **`string`** — Threat category (`phishing`, `drainer`, `mixer`, `honeypot`, `rug-pull`, `other`)
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
      "https://chainscan-galileo.0g.ai/tx/0xAbCd...",
    ],
    domain: "nft-claim-now.xyz",
  }),
});

const data = await response.json();
// { reportId: "rpt_xyz789", status: "submitted" }
```

---

## Reports

### `GET /reports`

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
//     {
//       id: "rpt_001",
//       address: "0xBadAddr...",
//       title: "Phishing contract",
//       status: "confirmed",
//       severity: "high",
//       createdAt: "2026-04-20T...",
//       votes: { up: 34, down: 1 }
//     },
//     ...
//   ],
//   pagination: { page: 1, limit: 10, total: 56 }
// }
```

---

### `POST /reports`

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
    description: "This contract exhibits characteristics of a Ponzi scheme with guaranteed returns...",
    tags: ["ponzi", "fraud"],
    severity: "critical",
  }),
});

const data = await response.json();
// { id: "rpt_abc456", status: "pending", createdAt: "2026-05-09T..." }
```

---

### `POST /reports/:id/vote`

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

## Tags

### `GET /address-tags`

Retrieve a paginated list of address tags across the platform.

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
//     {
//       id: "tag_001",
//       address: "0xBadAddr...",
//       tag: "drainer",
//       addedBy: "0xReporter...",
//       createdAt: "2026-03-15T..."
//     },
//     ...
//   ],
//   pagination: { page: 1, limit: 50, total: 230 }
// }
```

---

### `POST /address-tags`

Tag an address with a label. Requires authentication.

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

### `GET /address/:address/tags`

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

## Watchlist

### `GET /watchlist`

Retrieve the authenticated user's watchlist of monitored addresses.

```typescript
const response = await fetch("https://api.sifix.io/v1/watchlist", {
  headers,
});

const data = await response.json();
// {
//   watchlist: [
//     {
//       id: "wl_001",
//       address: "0xMonitored...",
//       label: "Suspicious whale",
//       addedAt: "2026-04-15T08:30:00Z",
//       lastActivity: "2026-05-09T14:22:00Z",
//       riskScore: 45
//     },
//     ...
//   ]
// }
```

---

### `POST /watchlist`

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

### `DELETE /watchlist/:address`

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

## Scam Domains

### `GET /scam-domains`

Retrieve a paginated list of known scam domains tracked by SIFIX.

**Query Parameters:**

- `page` **`number`** — Page number (default: `1`)
- `limit` **`number`** — Results per page (default: `20`)
- `category` **`string`** *(optional)* — Filter by category (`phishing`, `drainer`, `impersonation`, `fake-airdrop`)

```typescript
const response = await fetch(
  "https://api.sifix.io/v1/scam-domains?category=phishing&limit=50",
  { headers }
);

const data = await response.json();
// {
//   domains: [
//     {
//       domain: "evil-phishing.com",
//       category: "phishing",
//       status: "active",
//       reports: 47,
//       firstReported: "2025-11-02T..."
//     },
//     ...
//   ],
//   pagination: { page: 1, limit: 50, total: 8901 }
// }
```

---

### `GET /scam-domains/check`

Quickly check whether a specific domain is flagged. Returns a lightweight response optimized for the extension's domain safety pipeline.

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

### `GET /scam-domains/:domain`

Retrieve detailed information about a specific scam domain, including associated addresses and targeted chains.

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
//   associatedAddresses: ["0xBad1...", "0xBad2..."],
//   targetChains: ["ethereum", "polygon", "0g-galileo"]
// }
```

---

## Auth

SIFIX uses a **SIWE (Sign-In with Ethereum)** flow for authentication. The client requests a nonce, signs it with their wallet, and verifies the signature to obtain a JWT.

### `POST /auth/nonce`

Request a unique nonce for wallet signing. **No authentication required.**

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

### `POST /auth/verify`

Verify a signed SIWE message and obtain a JWT token. **No authentication required.**

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

The returned `token` should be included as `Authorization: Bearer <token>` in all subsequent authenticated requests. Tokens expire after **24 hours**.

---

### `GET /auth/verify-token`

Validate an existing JWT token. Useful for checking token validity on app startup or after page refresh.

```typescript
const response = await fetch("https://api.sifix.io/v1/auth/verify-token", {
  headers: { Authorization: `Bearer ${token}` },
});

const data = await response.json();
// { valid: true, address: "0xYourWallet...", expiresAt: "2026-05-10T12:00:00Z" }
```

---

## System

### `GET /stats`

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

### `GET /leaderboard`

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

### `GET /history`

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
//     { id: "scan_abc123", type: "scan", address: "0x...", riskScore: 72, timestamp: "..." },
//     ...
//   ],
//   pagination: { page: 1, limit: 10, total: 234 }
// }
```

---

### `GET /scan-history`

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

## Settings

### `GET /settings/ai-provider`

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

## Storage

### `GET /storage/:hash/download`

Download a previously stored on-chain analysis by its 0G Storage root hash.

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
//   analysis: {
//     riskScore: 15,
//     recommendation: "allow",
//     reasoning: "Standard ERC-20 transfer...",
//     threats: []
//   },
//   metadata: { analyzedBy: "0x...", version: "1.5.0" },
//   storedAt: "2026-05-08T09:15:00Z"
// }
```

---

## Identity

### `GET /agentic-id`

Retrieve the agentic identity information for the authenticated user. Returns on-chain identity data, reputation score, and verifiable credentials linked to ERC-7857.

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

## Health

### `GET /health`

Public endpoint to check API health and uptime status. **No authentication required.**

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

- **`400`** `VALIDATION_ERROR` — Missing or invalid parameters
- **`401`** `UNAUTHORIZED` — Missing or invalid JWT
- **`403`** `FORBIDDEN` — Insufficient permissions
- **`404`** `NOT_FOUND` — Resource not found
- **`409`** `CONFLICT` — Duplicate resource or state conflict
- **`429`** `RATE_LIMITED` — Rate limit exceeded
- **`500`** `INTERNAL_ERROR` — Internal server error
- **`503`** `SERVICE_UNAVAILABLE` — AI provider or network issue

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

- **Free tier:** 30 requests/min · 1,000 requests/day
- **Pro tier:** 120 requests/min · 10,000 requests/day
- **Enterprise:** Custom limits

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

## Endpoint Summary

All 35 endpoints organized by domain:

**Scanning (3)**
- `GET /check-domain` — Check domain scam status (public)
- `GET /scan/:address` — Get cached scan or trigger new scan
- `POST /scan` — Batch scan addresses

**Analysis (2)**
- `POST /analyze` — Full AI security analysis
- `POST /extension/analyze` — Lightweight extension analysis

**Threats (2)**
- `GET /threats` — List known threats
- `POST /threats/report` — Submit threat report

**Reports (3)**
- `GET /reports` — List user reports
- `POST /reports` — Create report
- `POST /reports/:id/vote` — Vote on report

**Tags (3)**
- `GET /address-tags` — List address tags
- `POST /address-tags` — Tag an address
- `GET /address/:address/tags` — Get tags for address

**Watchlist (3)**
- `GET /watchlist` — List watched addresses
- `POST /watchlist` — Add to watchlist
- `DELETE /watchlist/:address` — Remove from watchlist

**Scam Domains (3)**
- `GET /scam-domains` — List scam domains
- `GET /scam-domains/check` — Quick domain check
- `GET /scam-domains/:domain` — Domain details

**Auth (3)**
- `POST /auth/nonce` — Request SIWE nonce (public)
- `POST /auth/verify` — Verify signature, get JWT (public)
- `GET /auth/verify-token` — Validate existing JWT

**System (4)**
- `GET /stats` — Platform statistics
- `GET /leaderboard` — Contributor rankings
- `GET /history` — User activity history
- `GET /scan-history` — User scan history

**Settings (1)**
- `GET /settings/ai-provider` — AI provider config

**Storage (1)**
- `GET /storage/:hash/download` — Download on-chain analysis

**Identity (1)**
- `GET /agentic-id` — User agentic identity

**Health (1)**
- `GET /health` — API health check (public)

---

## Related

- [@sifix/agent SDK](./agent-sdk.md) — TypeScript SDK for programmatic access
- [Extension API](./extension-api.md) — Chrome extension message API
- [0G Storage API](./0g-storage-api.md) — 0G Storage integration details
