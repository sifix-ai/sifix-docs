     1|---
     2|title: System Overview
     3|description: Full system architecture of SIFIX — how the Chrome extension, dApp server, agent SDK, and 0G Galileo infrastructure work together to deliver AI-powered Web3 wallet security.
     4|---
     5|
     6|# System Overview
     7|
     8|> **🎯 TL;DR**
     9|> SIFIX is like a **smart security guard for your crypto wallet**. When you're about to send a transaction on a blockchain app, SIFIX quietly steps in, tests what would happen if you sent it (without actually sending anything), asks an AI to check for danger signs, and then tells you whether it's safe to proceed. It runs as a Chrome browser extension, talks to a backend server for the heavy lifting, and stores its findings on a decentralized network so nobody can tamper with the results.
    10|
    11|## What Is SIFIX? (Plain-English Overview)
    12|
    13|If you've ever used a crypto wallet like MetaMask to interact with a blockchain app (a "dApp"), you know the feeling: you click a button, a popup asks you to confirm a transaction, and you have to trust that everything is fine. But what if the app is malicious? What if confirming that transaction drains your wallet?
    14|
    15|**SIFIX exists to answer that question before you confirm.**
    16|
    17|Here's how it works in everyday terms:
    18|
    19|1. **It watches your browser.** The SIFIX Chrome extension sits between you and the blockchain. When a website asks your wallet to do something, SIFIX catches that request first — like a bouncer checking IDs at the door.
    20|2. **It does a dry run.** Instead of sending the real transaction, SIFIX simulates it on the blockchain to see what would actually happen. Would money leave your account? Would a smart contract do something unexpected?
    21|3. **It asks an AI for a second opinion.** The simulation results are sent to an AI that's trained to spot red flags — things like phishing attempts, scam contracts, or suspicious token approvals.
    22|4. **It shows you the verdict.** You get a clear risk score (safe → critical) with a plain-English explanation, so you can make an informed decision.
    23|5. **It remembers.** Every scan is saved, so the system gets smarter over time. If an address has been flagged as dangerous before, you'll know immediately.
    24|
    25|SIFIX is built entirely on the **0G Galileo Testnet** (a blockchain test network) and consists of three pieces of software that work together: a browser extension, a web server, and a security analysis toolkit.
    26|
    27|---
    28|
    29|## Technical Architecture
    30|
    31|SIFIX is a three-part system on **0G Galileo (Chain 16602)**:
    32|
    33|- **Extension**: catches risky actions before wallet signature.
    34|- **dApp server**: runs API + orchestration.
    35|- **Agent SDK**: simulates, analyzes, scores, and stores evidence.
    36|
    37|In short: **capture → simulate → analyze → explain**.
    38|
    39|The goal is simple: make transaction risk understandable before user signs.
    40|
    41|---
    42|
    43|## Architecture Diagram
    44|
    45|```mermaid
    46|graph TB
    47|    subgraph BROWSER["Chrome Browser"]
    48|        direction TB
    49|        EXT["sifix-extension<br/>Plasmo 0.88 · MV3"]
    50|        TXI["tx-interceptor<br/>MAIN world proxy"]
    51|        BADGE["sifix-badge<br/>Shield overlay"]
    52|        CHECKER["dapp-checker<br/>Warning banners"]
    53|        AUTHB["auth-bridge<br/>SIWE token relay"]
    54|        APIB["api-bridge<br/>ISOLATED world fetch"]
    55|        POPUP["Popup UI<br/>340×460 · React 18"]
    56|        BG["Background Worker<br/>Domain scanner · Badge"]
    57|        DEXIE["Dexie IndexedDB<br/>TX history · Tags cache"]
    58|        CSTORE["chrome.storage.local<br/>Auth token · Settings"]
    59|
    60|        EXT --> TXI
    61|        EXT --> BADGE
    62|        EXT --> CHECKER
    63|        EXT --> AUTHB
    64|        EXT --> APIB
    65|        EXT --> POPUP
    66|        EXT --> BG
    67|        EXT --> DEXIE
    68|        EXT --> CSTORE
    69|    end
    70|
    71|    subgraph DAPP["sifix-dapp Server"]
    72|        direction TB
    73|        DASH["Next.js 16 App Router<br/>Dashboard Pages"]
    74|        API["API Routes<br/>/api/v1/*"]
    75|        DB["Prisma ORM<br/>PostgreSQL · App State"]
    76|        SDK["@sifix/agent SDK<br/>SecurityAgent orchestrator"]
    77|        TI["PrismaThreatIntel<br/>ThreatIntelProvider impl"]
    78|        VIEM["viem PublicClient<br/>0G Galileo RPC"]
    79|        PRISMA["Prisma Client<br/>Query builder"]
    80|    end
    81|
    82|    subgraph ZG["0G Galileo Testnet (Chain 16602)"]
    83|        direction TB
    84|        ZGS["0G Storage<br/>Evidence + Merkle proofs"]
    85|        ZGC["0G Compute<br/>Decentralized AI inference"]
    86|        EVM["0G Chain<br/>SIFIX Contract · Agentic ID"]
    87|    end
    88|
    89|    subgraph EXT_APIS["External Services"]
    90|        OAI["OpenAI / Groq / Ollama<br/>Fallback AI providers"]
    91|        GOPUS["GoPlus Security<br/>Phishing API fallback"]
    92|        WC["WalletConnect Cloud<br/>Wallet session management"]
    93|    end
    94|
    95|    %% Browser → DApp
    96|    TXI -->|"intercepted TX params"| APIB
    97|    APIB -->|"POST /api/v1/analyze<br/>Authorization: Bearer JWT"| API
    98|    POPUP -->|"User actions"| BG
    99|    BG -->|"GET /api/v1/check-domain"| API
   100|    BG -->|"domain check (fallback)"| GOPUS
   101|    AUTHB -->|"postMessage JWT"| CSTORE
   102|    POPUP -->|"Activate via dApp"| DASH
   103|
   104|    %% DApp internal
   105|    DASH --> API
   106|    API --> PRISMA
   107|    PRISMA --> DB
   108|    API --> SDK
   109|    SDK --> TI
   110|    TI --> PRISMA
   111|
   112|    %% DApp → 0G
   113|    SDK -->|"0G Compute broker<br/>/chat/completions"| ZGC
   114|    SDK -->|"0G Storage upload<br/>JSON + Merkle tree"| ZGS
   115|    SDK -->|"EVM call()<br/>TX simulation"| EVM
   116|    VIEM -->|"publicClient.call()<br/>eth_call simulation"| EVM
   117|
   118|    %% DApp → External
   119|    SDK -->|"AI fallback<br/>OpenAI-compatible API"| OAI
   120|    DASH -->|"WalletConnect"| WC
   121|
   122|    %% 0G → DApp (responses)
   123|    ZGS -->|"rootHash + explorerUrl"| SDK
   124|    ZGC -->|"RiskAnalysis response"| SDK
   125|    EVM -->|"SimulationResult"| VIEM
   126|
   127|    style BROWSER fill:#1a1a2e,color:#fff
   128|    style DAPP fill:#16213e,color:#fff
   129|    style ZG fill:#0f3460,color:#fff
   130|    style EXT_APIS fill:#374151,color:#fff
   131|    style SDK fill:#a855f7,color:#fff
   132|    style EXT fill:#3b9eff,color:#fff
   133|```
   134|
   135|---
   136|
   137|## Three-Component Architecture
   138|
   139|### sifix-extension
   140|
   141|A **Plasmo 0.88** Chrome Manifest V3 extension that serves as the user-facing entry point.
   142|
   143|- **Role:** Intercepts wallet transactions at the browser level, scans domains for safety, and displays real-time security indicators
   144|- **Tech:** React 18, Plasmo framework, Dexie IndexedDB, chrome.storage API
   145|- **Content Scripts:** 5 scripts across MAIN and ISOLATED worlds — `tx-interceptor`, `api-bridge`, `sifix-badge`, `dapp-checker`, `auth-bridge`
   146|- **Background Worker:** Manages domain safety scans (5-layer pipeline), per-tab badge updates, and message routing between popup and content scripts
   147|- **Early Injection:** `tx-interceptor.js` is injected at `webNavigation.onBeforeNavigate` with `injectImmediately: true` in the MAIN world — ensuring the `window.ethereum` proxy is in place before any page scripts execute
   148|
   149|### sifix-dapp
   150|
   151|A **Next.js 16** application serving as both the web dashboard and the REST API backend.
   152|
   153|- **Role:** Hosts setup, history, reputation, analytics, and settings flows; provides authenticated API routes consumed by the extension and dashboard
   154|- **Tech:** React 19, Wagmi v3, TanStack React Query, Prisma 5 (PostgreSQL), Zod validation, TailwindCSS 4
   155|- **Database:** Prisma ORM with PostgreSQL, 13 models covering core security data, community features, and system state
   156|- **Threat Intel:** Implements `ThreatIntelProvider` interface from the agent SDK, bridging persisted scan history to the analysis pipeline
   157|- **Auth:** SIWE (Sign-In with Ethereum) authentication issuing JWT tokens for extension and dashboard sessions
   158|
   159|### sifix-agent
   160|
   161|The core security analysis SDK published as `@sifix/agent` on npm.
   162|
   163|- **Role:** Orchestrates the full analysis pipeline — simulation, threat intelligence gathering, AI risk analysis, and decentralized storage
   164|- **Key Classes:** `SecurityAgent` (orchestrator), `TransactionSimulator` (viem-based), `AIAnalyzer` (dual-provider), `StorageClient` (0G Storage), `ComputeClient` (0G Compute), `ThreatIntelProvider` (interface)
   165|- **Database-Agnostic:** Consumers inject a `ThreatIntelProvider` implementation to supply historical scan context
   166|- **AI Routing Priority:** 0G Compute (decentralized) → configured OpenAI-compatible provider → legacy `openaiApiKey`
   167|
   168|---
   169|
   170|## Communication Protocols
   171|
   172|### Browser ↔ DApp Server
   173|
   174|- **Protocol:** HTTPS (REST)
   175|- **Auth:** Bearer JWT token obtained via SIWE flow
- **Endpoints used by extension:**
  - `POST /api/v1/analyze` — Transaction analysis
  - `POST /api/v1/scan` — Address scanning
  - `GET /api/v1/check-domain` — Domain safety checks
  - `GET /api/v1/system-status` — Extension/system status
   181|  - `POST /api/v1/auth/nonce` — SIWE nonce request
   182|  - `POST /api/v1/auth/verify` — SIWE signature verification
   183|  - `POST /api/v1/auth/verify-token` — Token validation
   184|- **Content-Type:** `application/json`
   185|- **Token storage:** `chrome.storage.local` (injected via `postMessage` from dApp page)
   186|
   187|### DApp Server ↔ 0G Galileo
   188|
   189|- **EVM RPC:** `https://evmrpc-testnet.0g.ai` — Transaction simulation via `eth_call`
   190|- **0G Storage Indexer:** `https://indexer-storage-testnet-turbo.0g.ai` — JSON upload/download with Merkle proofs
   191|- **0G Compute:** Broker-based decentralized AI inference via `/chat/completions` endpoint
   192|- **Chain ID:** 16602
   193|- **Block Explorer:** `https://chainscan-galileo.0g.ai`
   194|
   195|### DApp Server ↔ External APIs
   196|
   197|- **AI Fallback:** Any OpenAI-compatible API (OpenAI, Groq, OpenRouter, Together AI, Ollama) — used when 0G Compute is not configured
   198|- **GoPlus Security:** Phishing domain detection API — used as a fallback when the SIFIX domain check API fails
   199|- **WalletConnect Cloud:** Wallet session management via `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   200|
   201|---
   202|
   203|## Port & Network Configuration
   204|
   205|| Component | Default Port | Protocol | Notes |
   206||-----------|-------------|----------|-------|
   207|| sifix-dapp (dev) | 3000 | HTTP | `pnpm dev` → `http://localhost:3000` |
   208|| 0G Galileo RPC | 443 | HTTPS | `https://evmrpc-testnet.0g.ai` |
   209|| 0G Storage Indexer | 443 | HTTPS | `https://indexer-storage-testnet-turbo.0g.ai` |
   210|| 0G Compute | 443 | HTTPS | Broker endpoint (varies by provider) |
   211|| AI Fallback API | 443 | HTTPS | Provider-specific (e.g., `api.openai.com`) |
   212|| GoPlus API | 443 | HTTPS | `https://api.gopluslabs.io` |
   213|
   214|> The extension has no standalone server — it communicates exclusively through the dApp API routes and external endpoints via the background service worker's `fetch()` calls.
   215|
   216|---
   217|
   218|## Data Flow Summary
   219|
   220|Every transaction intercepted by the extension follows a **six-step pipeline**:
   221|
   222|1. **INTERCEPT** — `tx-interceptor` proxies `window.ethereum.request()` in the MAIN world
   223|2. **SIMULATE** — `TransactionSimulator` uses viem `publicClient.call()` against 0G Galileo
   224|3. **THREAT INTEL** — `PrismaThreatIntel.getAddressIntel()` queries the last 50 scans from PostgreSQL
   225|4. **AI ANALYZE** — `AIAnalyzer` sends a structured prompt with simulation + historical context → returns `riskScore`, `confidence`, `reasoning`, `threats[]`, and `recommendation`
   226|5. **STORE** — `StorageClient` uploads analysis JSON to 0G Storage, returns `rootHash` + `explorerUrl`
   227|6. **LEARN** — `saveScanResult()` persists to the database, enriching future scans
   228|
   229|See [Data Flow](/architecture/data-flow) for the detailed breakdown with TypeScript interfaces.
   230|
   231|---
   232|
   233|## Risk Scoring System
   234|
   235|The agent returns a risk score from 0 to 100, mapped to four risk levels:
   236|
   237|- **0–39 (SAFE/LOW)** → **ALLOW** — Transaction appears safe, proceed normally
   238|- **40–59 (MEDIUM)** → **WARN** — Some concerns detected, user should review carefully
   239|- **60–79 (HIGH)** → **BLOCK** — Significant risk, transaction blocked by default
   240|- **80–100 (CRITICAL)** → **BLOCK** — Severe threat detected, almost certainly malicious
   241|
   242|---
   243|
   244|## 0G Galileo Services
   245|
   246|SIFIX uses three distinct 0G services:
   247|
   248|- **0G Storage** — Permanent, decentralized evidence storage. Analysis results are serialized as JSON, uploaded via the `@0gfoundation/0g-storage-ts-sdk`, Merkle-tree verified, and referenced by root hash. The `StorageClient` handles uploads with 3 retries and exponential backoff (2s, 4s delays). Supports mock mode for local development (deterministic `keccak256` hashes).
   249|- **0G Compute** — Decentralized AI inference. The `ComputeClient` initializes a broker, acknowledges the provider signer, fetches service metadata (endpoint + model), and routes `/chat/completions` requests through the network. This is the primary AI provider when configured.
   250|- **0G EVM** — The EVM-compatible chain (ID: 16602) used for transaction simulation (`eth_call`), smart contract interactions, and ERC-7857 Agentic Identity for agent provenance tracking.
   251|
   252|---
   253|
   254|## What's Next
   255|
   256|- **[Data Flow](/architecture/data-flow)** — Detailed 6-step pipeline with TypeScript interfaces
   257|- **[Security Model](/architecture/security-model)** — Extension, agent, and smart contract security
   258|- **[Database Schema](/architecture/database-schema)** — All 13 Prisma models with relations
   259|- **[Auth Flow](/architecture/auth-flow)** — SIWE authentication deep dive
   260|