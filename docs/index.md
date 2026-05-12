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

## Problem we solve

Most Web3 losses happen before users realize risk.

People click **Approve** on transactions they do not fully understand. Scam sites and malicious contracts are built to look normal. Wallets usually ask for signature, but do not explain danger in plain language.

Result: one wrong click can drain funds.

## SIFIX solution

SIFIX acts like a security checkpoint before signature.

- It checks address/domain/transaction risk
- It explains risk in simple language
- It gives clear recommendation (safe, caution, block)
- It keeps report + verification trail transparent

So user decides with context, not guesswork.

## How it works (simple flow)

```mermaid
flowchart LR
  U[User action] --> A[Scan & AI analysis]
  A --> R[Create report]
  R --> L[Relay to onchain]
  L --> I[Indexer reads event]
  I --> C[Reconcile status]
  C --> D[Dashboard shows final state]
```

## Status flow (behind the scenes)

```mermaid
stateDiagram-v2
  [*] --> PENDING_LOCAL
  PENDING_LOCAL --> QUEUED
  QUEUED --> SYNCED
  QUEUED --> RELAY_FAILED
  RELAY_FAILED --> QUEUED: retry
```

## Why this matters

### For users
- Better protection before signing
- Less confusion on risky transactions
- More confidence when using Web3 apps

### For community and ecosystem
- Reports are verifiable, not random claims
- Moderation and sync state are visible
- Onchain events provide stronger accountability

## Current progress

- Chain-aware scan validation hardened
- Live guard health status in dashboard
- Relay endpoints active
- Reconcile endpoint active
- Ponder indexer integrated for sync pipeline

## Start here

- New to SIFIX: [Introduction](./overview/introduction)
- Integrating API: [REST API](./api-reference/rest-api)
- Using SDK: [@sifix/agent SDK](./api-reference/agent-sdk)
- Setup guide: [Installation](./guides/installation)
- Architecture details: [System Overview](./architecture/system-overview)
