     1|---
     2|title: Changelog
     3|description: SIFIX version history — features, improvements, bug fixes, and future roadmap
     4|---
     5|
     6|# Changelog
     7|
     8|All notable changes to SIFIX are documented here. Versions follow [Semantic Versioning](https://semver.org/).
     9|
    10|---
    11|
    12|## v1.6.0 — Current Release
    13|
    14|**Release Date:** 2026 Q2  
    15|**Focus:** onchain-first publish pipeline, SifixReputation event indexing, and resilient sync lifecycle
    16|
    17|### Features
    18|
    19|- **Onchain-First Publish Pipeline** — Threat publication now centers on direct user wallet transactions against `SifixReputation` on 0G Galileo.
    20|- **Indexer Reconcile Bridge** — Added public sync ingestion endpoint for indexed event batches:
    21|  - `POST /api/v1/sync/reconcile-batch`
    22|  - `GET /api/v1/sync/state`
    23|- **Dual-Status Threat Lifecycle** — Threat reports track local workflow and onchain sync state separately for better observability and retries.
    24|- **Ponder Indexer Repository** — `sifix-indexer` now indexes `SecurityReportSubmitted` events from contract `0xBBa8b030D80113e50271a2bbEeDBE109D9f1C42e` and pushes normalized `events + lastBlock + chainId` batches.
    25|- **Sync Cursor Standardization** — Reconcile cursor key aligned to `sifix_reputation_indexer`.
    26|
    27|### Improvements
    28|
    29|- **Chain-aware Validation** — Address scan flow now supports stricter chain-aware existence checks.
    30|- **Retry Scheduling for Relay Failures** — Added relay retry counters and next-attempt scheduling to reduce permanent sync failures.
    31|- **Live Guard Status in Dashboard** — Replaced dummy status with live online/degraded/offline probing.
    32|
    33|### Bug Fixes
    34|
    35|- Fixed mismatch between local report state and onchain submission visibility by introducing reconcile sync pipeline.
    36|- Fixed inconsistent status semantics by separating user-facing moderation status from sync status fields.
    37|
    38|---
    39|
    40|## v1.5.0 — Previous Release
    41|
    42|**Release Date:** 2025 Q1  
    43|**Focus:** 0G Compute integration, historical threat intelligence, multi-model AI, and batch analysis
    44|
    45|### Features
    46|
    47|- **0G Compute Integration** — Added primary AI inference through 0G Compute service, enabling decentralized AI analysis with automatic fallback to OpenAI, Groq, OpenRouter, and Ollama
    48|- **Historical Threat Intelligence** — New `PrismaThreatIntelProvider` aggregates past analysis results into a local PostgreSQL database, allowing the AI agent to reference historical patterns and improve detection accuracy over time
    49|- **Batch Transaction Analysis** — Analyze multiple transactions in a single request, enabling portfolio-level security audits and bulk scam detection
    50|- **5 AI Provider Support** — Full support for 0G Compute (primary), OpenAI, Groq, OpenRouter, and local Ollama models with automatic failover and latency-based routing
    51|- **Agentic Identity (ERC-7857)** — On-chain identity for the SIFIX AI agent on 0G Galileo Testnet, enabling cryptographically signed analysis reports and verifiable trust chains
    52|- **Enhanced Domain Scanner** — Improved phishing domain detection with heuristics for homoglyph attacks, typosquatting, and subdomain spoofing
    53|- **0G Storage Evidence Vault** — Immutable on-chain storage of security analysis reports with root hash verification for tamper-proof evidence
    54|
    55|### Improvements
    56|
    57|- **Faster Analysis Pipeline** — Reduced end-to-end analysis time from ~5s to ~3s for standard transactions through parallel simulation and AI inference
    58|- **Dashboard Refresh** — Redesigned the Next.js 16 dashboard with 12 pages and 35 API routes, including new portfolio risk overview and transaction timeline views
    59|- **Extension Popup Redesign** — New 340×440 popup layout with clearer risk tier visualization, color-coded verdicts, and one-click detailed reports
    60|- **Risk Scoring Accuracy** — Improved risk score calibration across all 5 tiers (SAFE, LOW, MEDIUM, HIGH, CRITICAL) to reduce false positives by ~30%
    61|- **TypeScript Strict Mode** — Migrated all repositories to TypeScript strict mode with zero `any` types in production code
    62|- **API Rate Limiting** — Added intelligent rate limiting across all REST API endpoints with configurable thresholds per endpoint
    63|- **Error Recovery** — Enhanced error handling in the AI analysis pipeline with automatic retry logic and graceful degradation when providers are unavailable
    64|
    65|### Bug Fixes
    66|
    67|- **Extension Content Script Injection** — Fixed race condition where `tx-interceptor` could miss wallet events on slow-loading dApps
    68|- **Simulation State Diff** — Corrected state diff calculation for contracts that modify storage in nested delegate calls
    69|- **0G Storage Upload Retry** — Added exponential backoff for 0G Storage uploads that fail due to network congestion on Galileo Testnet
    70|- **Popup Auth Session** — Fixed SIWE authentication session expiry not refreshing correctly in the extension popup after extended use
    71|- **AI Response Parsing** — Improved resilience of AI response parser to handle malformed JSON from different provider models
    72|- **Memory Leak in Background Worker** — Resolved IndexedDB connection leak in the extension's background service worker after prolonged sessions
    73|- **Dashboard Charts Rendering** — Fixed chart components failing to render when transaction history contained only low-risk entries
    74|
    75|---
    76|
    77|## v1.0.0 — Initial Release
    78|
    79|**Release Date:** 2024 Q4  
    80|**Focus:** Core platform launch with extension, agent SDK, and dashboard
    81|
    82|### Features
    83|
    84|- **Chrome Extension (MV3)** — Plasmo-powered browser extension with 5 content scripts: `tx-interceptor`, `api-bridge`, `sifix-badge`, `dapp-checker`, and `auth-bridge` for real-time wallet protection
    85|- **AI Security Agent SDK** — Core TypeScript SDK with modular pipeline: TransactionSimulator → AIAnalyzer → RiskScorer → StorageClient
    86|- **Transaction Simulation** — Forked dry-run execution against 0G Galileo Testnet state using viem, with full state diff extraction
    87|- **AI-Powered Risk Analysis** — Multi-model AI analysis with support for OpenAI GPT-4, providing natural language explanations of security risks
    88|- **Risk Scoring System** — 0–100 risk score with 5 tiers (SAFE → CRITICAL), detailed risk factor breakdowns, and action recommendations
    89|- **0G Storage Integration** — Immutable on-chain storage of security reports and analysis evidence on 0G Galileo Testnet
    90|- **Web Dashboard** — Next.js dashboard with SIWE authentication, transaction history, risk report viewer, and security settings
    91|- **SIWE Authentication** — Sign-In with Ethereum authentication flow using MetaMask and compatible wallets
    92|- **MetaMask Interception** — Real-time transaction interception in MetaMask and compatible wallet interfaces via content script injection
    93|
    94|### Improvements
    95|
    96|- N/A — Initial release
    97|
    98|### Bug Fixes
    99|
   100|- N/A — Initial release
   101|
   102|---
   103|
   104|## Future Roadmap
   105|
   106|### v1.6.0 — Planned
   107|
   108|**Focus:** Mobile support, multi-chain expansion, and community features
   109|
   110|- **Mobile Wallet Support** — Extend transaction interception to mobile wallet browsers (MetaMask Mobile, Rainbow, Coinbase Wallet) via deep-link analysis
   111|- **Multi-Chain Analysis** — Expand beyond 0G Galileo to support Ethereum mainnet, Polygon, Arbitrum, Base, and BSC with chain-specific threat models
   112|- **Community Threat Feed** — User-contributed threat intelligence with reputation-weighted scoring and on-chain verification
   113|- **Custom Alert Rules** — User-defined rules engine for conditional alerts (e.g., "alert me when approving tokens above 1000 USDC")
   114|- **Dashboard API Keys** — API key management for programmatic access to SIFIX analysis services
   115|- **Enhanced 0G Storage Queries** — Advanced search and filtering of historical analysis reports stored on 0G Storage
   116|- **Extension Firefox Support** — Port Chrome extension to Firefox with WebExtension API compatibility
   117|
   118|### v2.0.0 — Vision
   119|
   120|**Focus:** AI agent network, decentralized oracle, and protocol-level integration
   121|
   122|- **AI Agent Network** — Decentralized network of SIFIX AI agents that cross-validate analysis results through consensus, reducing single-point-of-failure risk
   123|- **Decentralized Security Oracle** — On-chain oracle contract that provides real-time security scores to other smart contracts and DeFi protocols
   124|- **Zero-Knowledge Proofs** — Privacy-preserving analysis where users can prove transaction safety without revealing transaction details
   125|- **Protocol Integration SDK** — Toolkit for DeFi protocols to integrate SIFIX security checks directly into their smart contract logic
   126|- **Governance System** — Community governance for threat model updates, risk score calibration, and protocol parameters
   127|- **Cross-Chain Bridge Security** — Specialized analysis module for detecting malicious bridge contracts and cross-chain attack vectors
   128|- **AI Model Training Rewards** — Incentive mechanism for community members who contribute training data that improves detection accuracy
   129|