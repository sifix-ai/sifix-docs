     1|---
     2|title: Security Model
     3|description: Comprehensive security architecture of SIFIX — extension isolation, agent sandboxing, smart contract access control, privacy protections, and the threat model defining what SIFIX can and cannot protect against.
     4|---
     5|
     6|# Security Model
     7|
     8|> **🎯 TL;DR**
     9|> SIFIX is a security tool, so it needs to be secure itself. This page explains how SIFIX protects every layer — from the browser extension to the server to the blockchain. Think of it as the **blueprints for a bank vault**: every door, every lock, and every camera is documented here, along with what it can and can't protect against.
    10|
    11|## Why Security Matters in Web3
    12|
    13|In traditional web applications, if something goes wrong — an unauthorized charge, a hacked account — there's usually a customer support team, a bank, or a legal system that can help you recover your funds. **Web3 is different.** Blockchain transactions are **irreversible by design**. Once you confirm a transaction, there is no "undo" button, no customer service hotline, and often no legal recourse.
    14|
    15|This creates a uniquely high-stakes environment:
    16|
    17|- **One click can drain your entire wallet.** A malicious "approve" transaction can give a scammer unlimited access to your tokens.
    18|- **Scams are sophisticated.** Modern phishing sites look identical to real dApps — even experienced users get tricked.
    19|- **No safety net.** Unlike a credit card dispute, stolen crypto is gone for good.
    20|- **Anyone can create a smart contract.** There's no app store review process. Malicious contracts go live instantly.
    21|
    22|SIFIX exists because **prevention is the only defense** in Web3. If a transaction looks dangerous, SIFIX warns you *before* you sign it — when it still matters. But for SIFIX's warnings to be trustworthy, SIFIX itself must be built with the highest security standards. This document explains how.
    23|
    24|---
    25|
    26|SIFIX is a security product, and its own security architecture is paramount. This document covers how SIFIX protects each layer — from the browser extension's content script isolation to the agent SDK's simulation sandbox, smart contract access controls, and privacy guarantees.
    27|
    28|---
    29|
    30|## Extension Security
    31|
    32|### Content Script Isolation
    33|
    34|The SIFIX extension uses Chrome Manifest V3's world isolation to prevent cross-context attacks:
    35|
    36|- **MAIN world (`tx-interceptor`)** — Runs in the page's JavaScript context to proxy `window.ethereum`. This is the only script that shares context with page scripts. It communicates exclusively via `chrome.runtime.sendMessage` and never directly accesses extension APIs.
    37|- **ISOLATED world (`api-bridge`, `auth-bridge`)** — Runs in a separate JavaScript context with access to Chrome extension APIs but isolated from page scripts. Page scripts cannot read, modify, or call into isolated world scripts.
    38|- **Overlay scripts (`sifix-badge`, `dapp-checker`)** — Injected as UI overlays. Shadow DOM encapsulation prevents page CSS from affecting SIFIX UI elements.
    39|
    40|**Isolation guarantees:**
    41|
    42|- Page scripts **cannot** access `chrome.runtime`, `chrome.storage`, or any extension API
    43|- Extension scripts **cannot** be called directly from page code
    44|- The only cross-context channel is `chrome.runtime.sendMessage` / `onMessage`
    45|- The `auth-bridge` uses `window.postMessage` with strict origin validation to receive the JWT from the dApp page — it only accepts messages from the SIFIX dApp origin
    46|
    47|### Message Validation
    48|
    49|All messages between content scripts, background worker, and popup are validated:
    50|
    51|```typescript
    52|// Every internal message has a typed shape and is validated at the receiver
    53|interface ExtensionMessage {
    54|  type: "ANALYZE_TX" | "SCAN_DOMAIN" | "AUTH_STATUS" | "SETTINGS_UPDATE" | ...;
    55|  payload: unknown;
    56|  requestId: string;
    57|  timestamp: number;
    58|}
    59|
    60|// Receivers validate:
    61|// 1. message.type is a known enum value
    62|// 2. message.payload matches the expected shape for that type
    63|// 3. message.timestamp is within acceptable window (±30s)
    64|// 4. message.requestId is unique (replay protection)
    65|```
    66|
    67|- All message handlers validate the `type` field against a known enum — unknown types are silently dropped
    68|- Payloads are validated for expected shape before processing
    69|- Timestamps are checked to reject stale or delayed messages
    70|- Request IDs prevent replay attacks within the extension's internal messaging
    71|
    72|### API Key Protection
    73|
    74|- **AI API keys** (`AI_API_KEY`, `COMPUTE_PRIVATE_KEY`, `STORAGE_PRIVATE_KEY`) are **server-side only** — they exist exclusively in the dApp's `.env` file and are never sent to the browser
    75|- The extension never has access to any API key — it communicates only via the dApp's authenticated REST API
    76|- The extension's `chrome.storage.local` stores only:
    77|  - JWT bearer token (from SIWE auth)
    78|  - User settings (AI provider preference)
    79|  - Wallet connection state
    80|  - Domain scan cache
    81|- The `NEXT_PUBLIC_` prefix is used **only** for non-sensitive values (chain config, contract addresses, WalletConnect project ID)
    82|
    83|### Early Injection Integrity
    84|
    85|The `tx-interceptor.js` is injected at `webNavigation.onBeforeNavigate` with `injectImmediately: true` and `world: "MAIN"`. This ensures:
    86|
    87|- The proxy is installed **before** any page scripts execute
    88|- No dApp can detect the proxy's presence through timing attacks (it's always there first)
    89|- The original `window.ethereum.request` is captured before any page code can wrap or replace it
    90|- The pre-compiled `static/tx-interceptor.js` is bundled at build time and cannot be modified at runtime
    91|
    92|---
    93|
    94|## Agent Security
    95|
    96|### Simulation Sandbox
    97|
    98|The `TransactionSimulator` uses viem's `publicClient.call()` which executes an `eth_call` against the 0G Galileo RPC. This is a **read-only simulation** — it:
    99|
   100|- Does **not** broadcast any transaction
   101|- Does **not** modify chain state
   102|- Does **not** consume gas or require signatures
   103|- Runs against the current block state (or a specified block tag)
   104|- Cannot be used to execute arbitrary state changes
   105|
   106|The simulation result is treated as **untrusted input** — it's validated and normalized before being passed to the AI analyzer. Malformed or unexpected simulation results trigger a conservative WARN recommendation.
   107|
   108|### Rate Limiting
   109|
   110|- **API routes:** Rate limited per-wallet-address based on the SIWE JWT identity. Prevents abuse of the analysis pipeline.
   111|- **Extension analysis:** The `POST /api/v1/extension/analyze` endpoint enforces per-session limits to prevent a compromised extension from flooding the agent with requests.
   112|- **Domain scanning:** The background worker caches domain check results per session, avoiding redundant API calls for the same domain within a browsing session.
   113|
   114|### Input Validation
   115|
   116|All API inputs are validated with **Zod schemas** before processing:
   117|
   118|```typescript
   119|// Example: Extension analysis request validation
   120|const AnalyzeRequestSchema = z.object({
   121|  method: z.enum([
   122|    "eth_sendTransaction",
   123|    "personal_sign",
   124|    "eth_signTypedData",
   125|    // ... all intercepted methods
   126|  ]),
   127|  params: z.array(z.unknown()).min(1).max(10),
   128|  origin: z.string().url(),
   129|  timestamp: z.number().int().positive(),
   130|  requestId: z.string().uuid(),
   131|});
   132|```
   133|
   134|- Invalid requests return `400 Bad Request` with a descriptive error
   135|- All address fields are validated as valid hex strings with proper checksum
   136|- Numeric fields are range-checked (e.g., risk scores must be 0–100)
   137|- JSON payloads are size-limited to prevent memory exhaustion
   138|
   139|### AI Response Sanitization
   140|
   141|AI analysis responses are validated before use:
   142|
   143|- `riskScore` must be a number in the range [0, 100]
   144|- `confidence` must be a number in the range [0, 1]
   145|- `recommendation` must be one of `ALLOW`, `WARN`, `BLOCK`
   146|- `threats` must be an array of objects with required fields
   147|- Any field failing validation causes a fallback to conservative defaults (WARN recommendation, score of 50)
   148|
   149|---
   150|
   151|## Smart Contract Security
   152|
   153|### Access Control
   154|
   155|SIFIX's smart contracts on 0G Galileo use role-based access control:
   156|
   157|- **Owner functions** — Contract initialization, parameter updates, and emergency functions are restricted to the contract owner
   158|- **Agent registry** — Only registered agent addresses can submit analysis results and update reputation scores
   159|- **User functions** — Any address can query analysis results, submit threat reports, and vote on community tags
   160|
   161|### Data Validation
   162|
   163|On-chain data is validated at the contract level:
   164|
   165|- Analysis hashes must be valid bytes32 values
   166|- Reputation scores must be within the [0, 100] range
   167|- Address parameters are checked for non-zero values
   168|- Report submissions require valid evidence hashes
   169|
   170|### Immutable Audit Trail
   171|
   172|All analysis results stored via 0G Storage are:
   173|
   174|- **Content-addressed** — The Merkle root hash is derived from the content itself, making tampering detectable
   175|- **Immutable** — Once uploaded and anchored on-chain, the data cannot be modified
   176|- **Verifiable** — Anyone can download the JSON from 0G Storage and verify it matches the on-chain root hash
   177|- **Timestamped** — Block timestamps and upload receipts provide a chronological audit trail
   178|
   179|---
   180|
   181|## Privacy Model
   182|
   183|### Zero-Knowledge Approach
   184|
   185|SIFIX follows a **zero-knowledge philosophy** where the agent never needs to know the user's identity:
   186|
   187|- **No KYC required** — Users authenticate with their wallet address via SIWE. No personal information is collected.
   188|- **No transaction broadcasting** — The agent only simulates transactions; it never signs or broadcasts anything.
   189|- **No private key access** — The extension never requests private keys. All signing happens in MetaMask.
   190|- **Analysis is address-based** — Threat intelligence is aggregated by address, not by user identity.
   191|
   192|### Local-First Data
   193|
   194|The extension prioritizes local data storage:
   195|
   196|- **Dexie IndexedDB** — Transaction history and community tag caches live in the browser's local IndexedDB
   197|- **chrome.storage.local** — Auth tokens, settings, and wallet state stay on the device
   198|- **Domain scan cache** — Session-scoped cache avoids sending the same domain to the API repeatedly
   199|- **Settings** — AI provider preferences and notification settings are stored locally
   200|
   201|### Optional Cloud Sync
   202|
   203|The dApp dashboard provides additional features (watchlists, analytics, community tags) that require server-side storage. These are **opt-in**:
   204|
   205|- Connecting to the dApp and signing in via SIWE is required only for extension activation
   206|- Users can use the extension for domain scanning without creating a dApp session
   207|- Watchlist and tag data is associated with the wallet address, not with any personal identifier
   208|- Users can clear their data at any time through the dashboard settings
   209|
   210|### Data Minimization
   211|
   212|- **Scan records** store only what's necessary: addresses, scores, hashes, timestamps
   213|- **No transaction content** — The agent does not store the full transaction calldata after analysis completes
   214|- **Aggregated threat intel** — Historical context is aggregated (averages, max, distributions) rather than storing raw scan results in the AI prompt
   215|- **0G Storage** — Full analysis JSON is stored on decentralized storage, but only the root hash reference is kept in the PostgreSQL database
   216|
   217|---
   218|
   219|## Threat Model
   220|
   221|### What SIFIX Protects Against
   222|
   223|SIFIX is designed to detect and prevent the following categories of threats:
   224|
   225|- **Phishing dApps** — Malicious websites that impersonate legitimate dApps to steal funds. Detected via domain safety scanning (5-layer pipeline: local blacklist → SIFIX API → GoPlus fallback) and warning banners on dangerous pages.
   226|- **Malicious transaction payloads** — Transactions with harmful calldata (token draining, approval exploits, unauthorized transfers). Detected via simulation + AI analysis.
   227|- **Approval exploits** — Excessive or suspicious ERC-20/ERC-721 approval requests. The AI flags unusually large approvals, approvals to unknown contracts, and approvals that differ from the expected dApp behavior.
   228|- **Known scam addresses** — Addresses previously flagged by the community or automated systems. Detected via threat intelligence lookups.
   229|- **Dusting attacks** — Micro-transactions designed to link addresses. The AI flags transactions from known dusting patterns.
   230|- **Rug pull indicators** — Smart contract patterns associated with rug pulls (hidden mint functions, unrestricted token minting, unusual owner privileges). Detected via simulation analysis.
   231|- **Social engineering via dApps** — Fake airdrop sites, impersonation dApps, and urgent-action scams. Detected via domain safety scanning and community-reported scam domains.
   232|
   233|### What SIFIX Cannot Protect Against
   234|
   235|SIFIX has known limitations. It does **not** protect against:
   236|
   237|- **Zero-day exploits** — Novel attack vectors that haven't been seen before may not be flagged by the AI or threat intel system. The AI's training data may not cover every possible attack pattern.
   238|- **Private key compromise** — If a user's private key or seed phrase is already compromised, SIFIX cannot prevent the attacker from signing transactions. SIFIX intercepts `window.ethereum` calls, but a compromised key can be used outside the browser.
   239|- **Social engineering outside the browser** — Phishing emails, Discord scams, and phone-based social engineering attacks that don't involve a dApp transaction are outside SIFIX's scope.
   240|- **Front-running and MEV** — SIFIX simulates transactions against current state but cannot predict or prevent front-running attacks that occur between simulation and actual broadcast.
   241|- **Compromised MetaMask or browser** — If the user's browser or MetaMask extension is compromised (e.g., via a malicious browser extension), the attacker may bypass SIFIX's interception layer.
   242|- **AI hallucinations** — The AI may occasionally produce incorrect risk assessments. Low-confidence analyses are flagged, and users should always review the reasoning.
   243|- **Network-level attacks** — DNS hijacking, BGP attacks, or RPC endpoint compromise are outside SIFIX's threat model.
   244|- **Smart contract bugs in SIFIX's own contracts** — While SIFIX's contracts are designed with security best practices, they have not been formally verified or audited by a third party.
   245|
   246|### Security Assumptions
   247|
   248|SIFIX's security model relies on these assumptions:
   249|
   250|1. **The user's browser is not compromised** — The extension's isolation guarantees depend on Chrome's security model being intact.
   251|2. **MetaMask is trustworthy** — SIFIX delegates all signing to MetaMask and assumes the wallet extension is not malicious.
   252|3. **0G Galileo RPC is available** — Transaction simulation requires RPC access. If the RPC is down, simulation fails gracefully.
   253|4. **AI providers are not adversarial** — The AI analysis assumes the configured provider returns genuine analysis, not crafted adversarial responses.
   254|5. **The dApp server is operated by SIFIX** — The dApp server handles API keys and JWT validation. A compromised server could bypass authentication.
   255|
   256|---
   257|
   258|## Security Best Practices for Contributors
   259|
   260|When contributing to SIFIX, follow these security guidelines:
   261|
   262|- **Never commit API keys or private keys** — Use `.env` files (gitignored) for all secrets
   263|- **Validate all inputs** — Use Zod schemas for every API endpoint and every internal message handler
   264|- **Fail conservatively** — When in doubt, return a WARN recommendation rather than ALLOW
   265|- **Test with mock mode** — Use `STORAGE_MOCK_MODE=true` and never test with real funded wallets
   266|- **Sanitize AI outputs** — Always validate AI responses against expected schemas before using them
   267|- **No eval or Function constructors** — Never execute arbitrary code from user input or AI responses
   268|- **Keep dependencies updated** — Run `pnpm audit` regularly and update vulnerable packages
   269|
   270|---
   271|
   272|## See Also
   273|
   274|- **[System Overview](/architecture/system-overview)** — Full architecture with all components
   275|- **[Data Flow](/architecture/data-flow)** — Detailed pipeline with error handling at each step
   276|- **[Auth Flow](/architecture/auth-flow)** — SIWE authentication and token security
   277|