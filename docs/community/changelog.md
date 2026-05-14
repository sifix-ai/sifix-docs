---
title: Changelog
description: SIFIX version history — features, improvements, bug fixes, and future roadmap
---

# Changelog

All notable changes to SIFIX are documented here. Versions follow [Semantic Versioning](https://semver.org/).

---

## v1.6.0 — Current Release

**Release Date:** 2026 Q2  
**Focus:** onchain-first publish pipeline, SifixReputation event indexing, and resilient sync lifecycle

### Features

- **Onchain-First Publish Pipeline** — Threat publication now centers on direct user wallet transactions against `SifixReputation` on 0G Galileo.
- **Indexer Reconcile Bridge** — Added public sync ingestion endpoint for indexed event batches:
  - `POST /api/v1/sync/reconcile-batch`
  - `GET /api/v1/sync/state`
- **Dual-Status Threat Lifecycle** — Threat reports track local workflow and onchain sync state separately for better observability and retries.
- **Ponder Indexer Repository** — `sifix-indexer` now indexes `SecurityReportSubmitted` events from contract `0xBBa8b030D80113e50271a2bbEeDBE109D9f1C42e` and pushes normalized `events + lastBlock + chainId` batches.
- **Sync Cursor Standardization** — Reconcile cursor key aligned to `sifix_reputation_indexer`.

### Improvements

- **Chain-aware Validation** — Address scan flow now supports stricter chain-aware existence checks.
- **Retry Scheduling for Relay Failures** — Added relay retry counters and next-attempt scheduling to reduce permanent sync failures.
- **Live Guard Status in Dashboard** — Replaced dummy status with live online/degraded/offline probing.

### Bug Fixes

- Fixed mismatch between local report state and onchain submission visibility by introducing reconcile sync pipeline.
- Fixed inconsistent status semantics by separating user-facing moderation status from sync status fields.

---

## v1.5.0 — Previous Release

**Release Date:** 2025 Q1  
**Focus:** 0G Compute integration, historical threat intelligence, multi-model AI, and batch analysis

### Features

- **0G Compute Integration** — Added primary AI inference through 0G Compute service, enabling decentralized AI analysis with automatic fallback to OpenAI, Groq, OpenRouter, and Ollama
- **Historical Threat Intelligence** — New `PrismaThreatIntelProvider` aggregates past analysis results into a local SQLite database, allowing the AI agent to reference historical patterns and improve detection accuracy over time
- **Batch Transaction Analysis** — Analyze multiple transactions in a single request, enabling portfolio-level security audits and bulk scam detection
- **5 AI Provider Support** — Full support for 0G Compute (primary), OpenAI, Groq, OpenRouter, and local Ollama models with automatic failover and latency-based routing
- **Agentic Identity (ERC-7857)** — On-chain identity for the SIFIX AI agent on 0G Galileo Testnet, enabling cryptographically signed analysis reports and verifiable trust chains
- **Enhanced Domain Scanner** — Improved phishing domain detection with heuristics for homoglyph attacks, typosquatting, and subdomain spoofing
- **0G Storage Evidence Vault** — Immutable on-chain storage of security analysis reports with root hash verification for tamper-proof evidence

### Improvements

- **Faster Analysis Pipeline** — Reduced end-to-end analysis time from ~5s to ~3s for standard transactions through parallel simulation and AI inference
- **Dashboard Refresh** — Redesigned the Next.js 16 dashboard with 12 pages and 35 API routes, including new portfolio risk overview and transaction timeline views
- **Extension Popup Redesign** — New 340×440 popup layout with clearer risk tier visualization, color-coded verdicts, and one-click detailed reports
- **Risk Scoring Accuracy** — Improved risk score calibration across all 5 tiers (SAFE, LOW, MEDIUM, HIGH, CRITICAL) to reduce false positives by ~30%
- **TypeScript Strict Mode** — Migrated all repositories to TypeScript strict mode with zero `any` types in production code
- **API Rate Limiting** — Added intelligent rate limiting across all REST API endpoints with configurable thresholds per endpoint
- **Error Recovery** — Enhanced error handling in the AI analysis pipeline with automatic retry logic and graceful degradation when providers are unavailable

### Bug Fixes

- **Extension Content Script Injection** — Fixed race condition where `tx-interceptor` could miss wallet events on slow-loading dApps
- **Simulation State Diff** — Corrected state diff calculation for contracts that modify storage in nested delegate calls
- **0G Storage Upload Retry** — Added exponential backoff for 0G Storage uploads that fail due to network congestion on Galileo Testnet
- **Popup Auth Session** — Fixed SIWE authentication session expiry not refreshing correctly in the extension popup after extended use
- **AI Response Parsing** — Improved resilience of AI response parser to handle malformed JSON from different provider models
- **Memory Leak in Background Worker** — Resolved IndexedDB connection leak in the extension's background service worker after prolonged sessions
- **Dashboard Charts Rendering** — Fixed chart components failing to render when transaction history contained only low-risk entries

---

## v1.0.0 — Initial Release

**Release Date:** 2024 Q4  
**Focus:** Core platform launch with extension, agent SDK, and dashboard

### Features

- **Chrome Extension (MV3)** — Plasmo-powered browser extension with 5 content scripts: `tx-interceptor`, `api-bridge`, `sifix-badge`, `dapp-checker`, and `auth-bridge` for real-time wallet protection
- **AI Security Agent SDK** — Core TypeScript SDK with modular pipeline: TransactionSimulator → AIAnalyzer → RiskScorer → StorageClient
- **Transaction Simulation** — Forked dry-run execution against 0G Galileo Testnet state using viem, with full state diff extraction
- **AI-Powered Risk Analysis** — Multi-model AI analysis with support for OpenAI GPT-4, providing natural language explanations of security risks
- **Risk Scoring System** — 0–100 risk score with 5 tiers (SAFE → CRITICAL), detailed risk factor breakdowns, and action recommendations
- **0G Storage Integration** — Immutable on-chain storage of security reports and analysis evidence on 0G Galileo Testnet
- **Web Dashboard** — Next.js dashboard with SIWE authentication, transaction history, risk report viewer, and security settings
- **SIWE Authentication** — Sign-In with Ethereum authentication flow using MetaMask and compatible wallets
- **MetaMask Interception** — Real-time transaction interception in MetaMask and compatible wallet interfaces via content script injection

### Improvements

- N/A — Initial release

### Bug Fixes

- N/A — Initial release

---

## Future Roadmap

### v1.6.0 — Planned

**Focus:** Mobile support, multi-chain expansion, and community features

- **Mobile Wallet Support** — Extend transaction interception to mobile wallet browsers (MetaMask Mobile, Rainbow, Coinbase Wallet) via deep-link analysis
- **Multi-Chain Analysis** — Expand beyond 0G Galileo to support Ethereum mainnet, Polygon, Arbitrum, Base, and BSC with chain-specific threat models
- **Community Threat Feed** — User-contributed threat intelligence with reputation-weighted scoring and on-chain verification
- **Custom Alert Rules** — User-defined rules engine for conditional alerts (e.g., "alert me when approving tokens above 1000 USDC")
- **Dashboard API Keys** — API key management for programmatic access to SIFIX analysis services
- **Enhanced 0G Storage Queries** — Advanced search and filtering of historical analysis reports stored on 0G Storage
- **Extension Firefox Support** — Port Chrome extension to Firefox with WebExtension API compatibility

### v2.0.0 — Vision

**Focus:** AI agent network, decentralized oracle, and protocol-level integration

- **AI Agent Network** — Decentralized network of SIFIX AI agents that cross-validate analysis results through consensus, reducing single-point-of-failure risk
- **Decentralized Security Oracle** — On-chain oracle contract that provides real-time security scores to other smart contracts and DeFi protocols
- **Zero-Knowledge Proofs** — Privacy-preserving analysis where users can prove transaction safety without revealing transaction details
- **Protocol Integration SDK** — Toolkit for DeFi protocols to integrate SIFIX security checks directly into their smart contract logic
- **Governance System** — Community governance for threat model updates, risk score calibration, and protocol parameters
- **Cross-Chain Bridge Security** — Specialized analysis module for detecting malicious bridge contracts and cross-chain attack vectors
- **AI Model Training Rewards** — Incentive mechanism for community members who contribute training data that improves detection accuracy
