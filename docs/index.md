---
title: SIFIX Docs
description: AI-Powered Wallet Security for Web3 on 0G Galileo
---

# SIFIX

AI-powered wallet security layer for Web3.

SIFIX built because wallet UX today still blind: users sign transactions they don’t fully understand, attackers exploit that gap, losses keep happening. SIFIX puts analysis before signature.

## Why this project exists

Web3 users face recurring threats:
- Phishing domains and fake dApps
- Malicious token approvals
- Contract interactions that look normal but drain funds
- Social trust issues: reports exist, verification weak

Traditional wallets execute request. SIFIX evaluates risk first.

## What SIFIX does

SIFIX combines 4 parts:
- **sifix-extension**: intercept + warn in browser
- **sifix-dapp**: dashboard + API + moderation workflows
- **sifix-agent**: AI analysis SDK
- **sifix-indexer**: onchain event indexer (Ponder)

Network baseline: **0G Galileo Testnet (Chain ID 16602)**.

## How it works (end-to-end)

1. User triggers interaction (address/domain/tx)
2. Extension or dApp sends request to analysis pipeline
3. Agent simulates + scores risk + generates explanation
4. Threat report created in local DB with safe default state (`PENDING`)
5. Relay submits verified payload to onchain contract flow
6. Indexer captures `ScamVoteSubmitted` events
7. Reconcile endpoint syncs onchain truth back to dApp status

Result: user-facing status + onchain evidence stay aligned.

## Status model

Threat lifecycle split into two planes:

- Moderation plane:
  - `status`: `PENDING | VERIFIED | DISMISSED`
- Sync plane:
  - `localStatus`: `PENDING_LOCAL | QUEUED | SYNCED | RELAY_FAILED`
  - `onchainStatus`: `NONE | SUBMITTED`

This split prevents false “verified” assumptions and improves retry observability.

## Impact

SIFIX target impact:
- Reduce blind-sign incidents by pre-sign risk warnings
- Improve trust via transparent report/vote flow
- Preserve tamper-resistance via onchain event evidence
- Give operators actionable sync telemetry (queued, failed, synced)

## Current progress (May 2026)

- Chain-aware scan hardening added
- Live guard status probes in dashboard
- Relay endpoints added:
  - `POST /api/v1/threats/[id]/relay`
  - `POST /api/v1/threats/[id]/vote/relay`
- Reconcile endpoint added:
  - `POST /api/internal/reconcile/onchain`
- New `sifix-indexer` (Ponder) scaffolded and connected for reconcile push flow

## Start here

- Product overview: [Introduction](./overview/introduction)
- API integration: [REST API](./api-reference/rest-api)
- SDK usage: [@sifix/agent SDK](./api-reference/agent-sdk)
- Deployment: [Guides](./guides/installation)
- System internals: [Architecture](./architecture/system-overview)

## Repositories

- `sifix-agent` — https://github.com/sifix-ai/sifix-agent
- `sifix-dapp` — https://github.com/sifix-ai/sifix-dapp
- `sifix-extension` — https://github.com/sifix-ai/sifix-extension
- `sifix-indexer` — https://github.com/sifix-ai/sifix-indexer
- `sifix-docs` — https://github.com/sifix-ai/sifix-docs
