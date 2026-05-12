---
title: SIFIX Docs
description: AI-Powered Wallet Security for Web3
---

<div align="center">

# 🛡️ SIFIX

**AI-Powered Wallet Security for Web3**

*Every 14 seconds, a Web3 user falls victim to a scam. SIFIX stops it before it happens.*

<p class="hero-badges" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0 0;">
  <a href="https://chainscan-galileo.0g.ai"><img src="https://img.shields.io/badge/Network-0G%20Galileo-3b9eff?style=flat-square" alt="0G Galileo" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/Language-TypeScript-3178c6?style=flat-square" alt="TypeScript" /></a>
  <a href="https://github.com/sifix-ai/sifix-agent"><img src="https://img.shields.io/badge/SDK-v1.5.0-22c55e?style=flat-square" alt="SDK v1.5.0" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-a855f7?style=flat-square" alt="MIT License" /></a>
</p>

</div>

---

## Why SIFIX exists

Web3 security still has one core problem: users sign transactions they do not fully understand. Attackers exploit that gap with phishing domains, malicious approvals, and deceptive contract calls.

SIFIX exists to move security **before signature**, not after loss.

## What SIFIX is

SIFIX is a security system made of four connected repos:

- `sifix-extension` — browser interception and warning layer
- `sifix-dapp` — dashboard, API, moderation, sync status
- `sifix-agent` — AI simulation and risk analysis SDK
- `sifix-indexer` — Ponder indexer for onchain event truth

Baseline network: **0G Galileo Testnet (Chain ID 16602)**.

## How SIFIX works

```mermaid
flowchart LR
  U[User interaction] --> A[Scan / Analyze]
  A --> R[Create threat report<br/>status=PENDING]
  R --> L[Relay to onchain]
  L --> E[ScamVoteSubmitted event]
  E --> I[Ponder indexer]
  I --> C[Reconcile endpoint]
  C --> D[Dashboard/API synced status]
```

### Sync lifecycle

```mermaid
stateDiagram-v2
  [*] --> PENDING_LOCAL
  PENDING_LOCAL --> QUEUED: relay requested
  QUEUED --> SYNCED: tx + event reconciled
  QUEUED --> RELAY_FAILED: tx failed/timeout
  RELAY_FAILED --> QUEUED: retry scheduler

  state "Onchain" as O {
    [*] --> NONE
    NONE --> SUBMITTED
  }
```

## Why this matters (impact)

- Reduces blind-sign incidents with pre-sign warnings
- Gives transparent moderation flow (`PENDING`, vote, override)
- Keeps sync observability clear (`QUEUED`, `SYNCED`, `RELAY_FAILED`)
- Anchors evidence with onchain events, not UI assumptions only

## Current progress (May 2026)

- Chain-aware scan validation hardened
- Live guard probes added to dashboard status
- Relay endpoints added:
  - `POST /api/v1/threats/[id]/relay`
  - `POST /api/v1/threats/[id]/vote/relay`
- Reconcile endpoint added:
  - `POST /api/internal/reconcile/onchain`
- `sifix-indexer` scaffolded with Ponder + reconcile push script

## Start from here

- Product intro: [Introduction](./overview/introduction)
- API integration: [REST API](./api-reference/rest-api)
- SDK usage: [@sifix/agent SDK](./api-reference/agent-sdk)
- Setup: [Installation Guide](./guides/installation)
- Deep internals: [System Overview](./architecture/system-overview)
