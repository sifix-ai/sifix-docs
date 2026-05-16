     1|---
     2|title: Solution
     3|description: How SIFIX's 5-step AI protection pipeline intercepts, simulates, analyzes, scores, and acts on every transaction
     4|---
     5|
     6|# Solution
     7|
     8|> **⚡ TL;DR**
     9|> SIFIX runs a **5-step safety check** on every transaction before you sign it: Intercept → Simulate → Analyze → Score → Act. It takes under 3 seconds and works like a **fire drill** — we run through the entire transaction to see exactly what would happen, without actually executing it. Then an AI explains the risks in plain English and either greenlights the transaction or warns you about the danger.
    10|
    11|## The SIFIX Protection Pipeline
    12|
    13|SIFIX adds one safety layer before signature.
    14|
    15|```
    16|Intercept → Simulate → Analyze → Score → Act
    17|```
    18|
    19|What this means for non-technical users:
    20|- You get explanation before sign, not after loss.
    21|- You see risk level in plain words.
    22|- You stay in control of final decision.
    23|
    24|No real transaction is executed during analysis. Simulation is read-only.
    25|
    26|---
    27|
    28|## Pipeline Overview
    29|
    30|```mermaid
    31|flowchart LR
    32|    Start(["⚡ Transaction<br/>Initiated"]) --> Intercept
    33|
    34|    subgraph Intercept["🔍 Step 1: Intercept"]
    35|        Capture["Capture<br/>Transaction Payload"]
    36|        Parse["Parse<br/>Calldata + Params"]
    37|    end
    38|
    39|    Intercept --> Simulate
    40|
    41|    subgraph Simulate["🧪 Step 2: Simulate"]
    42|        Fork["Fork 0G Galileo<br/>State"]
    43|        DryRun["Dry-Run<br/>Execution"]
    44|        StateDiff["Extract<br/>State Changes"]
    45|    end
    46|
    47|    Simulate --> Analyze
    48|
    49|    subgraph Analyze["🤖 Step 3: Analyze"]
    50|        OG["0G Compute<br/>Primary AI"]
    51|        Fallback["Fallback Models<br/>OpenAI / Groq / Ollama"]
    52|        Context["Enrich with<br/>On-Chain Context"]
    53|    end
    54|
    55|    Analyze --> Score
    56|
    57|    subgraph Score["📊 Step 4: Score"]
    58|        Calculate["Calculate<br/>Risk Score 0–100"]
    59|        Factors["Identify<br/>Risk Factors"]
    60|        Tier["Assign<br/>Risk Tier"]
    61|    end
    62|
    63|    Score --> Act
    64|
    65|    subgraph Act["🛡️ Step 5: Act"]
    66|        Safe["✅ SAFE<br/>Allow"]
    67|        Low["🟢 LOW<br/>Proceed"]
    68|        Medium["🟡 MEDIUM<br/>Warn"]
    69|        High["🟠 HIGH<br/>Block + Warn"]
    70|        Critical["🔴 CRITICAL<br/>Block + Alert"]
    71|    end
    72|
    73|    Calculate --> Tier
    74|    Tier -->|"0–20"| Safe
    75|    Tier -->|"20–40"| Low
    76|    Tier -->|"40–60"| Medium
    77|    Tier -->|"60–80"| High
    78|    Tier -->|"80–100"| Critical
    79|
    80|    Safe --> End(["👤 User<br/>Decision"])
    81|    Low --> End
    82|    Medium --> End
    83|    High --> End
    84|    Critical --> End
    85|
    86|    style Intercept fill:#4A90D9,color:#fff
    87|    style Simulate fill:#7B68EE,color:#fff
    88|    style Analyze fill:#9B59B6,color:#fff
    89|    style Score fill:#E67E22,color:#fff
    90|    style Act fill:#E74C3C,color:#fff
    91|    style Critical fill:#C0392B,color:#fff
    92|    style High fill:#E67E22,color:#fff
    93|    style Medium fill:#F1C40F,color:#333
    94|    style Low fill:#2ECC71,color:#fff
    95|    style Safe fill:#27AE60,color:#fff
    96|```
    97|
    98|---
    99|
   100|## Step 1: Intercept
   101|
   102|**Goal:** Capture the full transaction payload before it reaches the wallet's signing interface.
   103|
   104|When a dApp initiates a transaction (via `eth_sendTransaction` or `personal_sign`), the SIFIX Chrome Extension intercepts the request using the Plasmo MV3 content script pipeline:
   105|
   106|- **Capture raw payload** — `to`, `value`, `data`, `gas`, and all parameters
   107|- **Parse calldata** — Decode function selectors and parameters using ABI matching
   108|- **Identify interaction type** — Classify as ERC-20 transfer, approval, swap, multicall, proxy call, or unknown
   109|- **Enrich with metadata** — Resolve ENS names, contract labels, and known address tags
   110|
   111|The interception is **non-invasive** — it reads the transaction without modifying it or preventing the wallet from functioning normally.
   112|
   113|---
   114|
   115|## Step 2: Simulate
   116|
   117|**Goal:** Execute the transaction in a sandboxed environment and extract all state changes.
   118|
   119|> 🔥 **Think of it like a fire drill.** Before a real emergency happens, you practice the evacuation route to see where everyone would go and what would happen — without any actual danger. SIFIX does the same with your transaction: it runs through the *entire* execution on a copy of the blockchain to see exactly what would change, which tokens would move, and where they'd go — without ever submitting the real transaction.
   120|
   121|SIFIX runs the captured transaction against a **forked 0G Galileo node** using `eth_call` and `trace` methods:
   122|
   123|- **Fork current state** — Create a snapshot of the blockchain state at the current block
   124|- **Dry-run execution** — Execute the transaction without broadcasting it
   125|- **Extract state diff** — Identify every balance change, approval change, and contract storage modification
   126|- **Trace internal calls** — Follow the execution path through all internal transactions and delegate calls
   127|- **Estimate gas accurately** — Calculate true gas cost including internal operations
   128|
   129|**Key principle:** The simulation is **read-only**. No transaction is ever submitted to the network during analysis. The forked state is discarded after the simulation completes.
   130|
   131|**Simulation outputs include:**
   132|- Token transfers (from → to, amount, token address)
   133|- Approval changes (owner, spender, new allowance)
   134|- Contract state modifications
   135|- Event logs emitted
   136|- Gas usage breakdown
   137|
   138|---
   139|
   140|## Step 3: Analyze
   141|
   142|**Goal:** Apply AI-driven semantic analysis to understand the transaction's intent and identify threats.
   143|
   144|The simulation output is passed to the AI analysis layer, which uses **0G Compute as the primary inference engine** with intelligent fallback to multiple AI providers:
   145|
   146|**Primary: 0G Compute**
   147|- On-chain AI inference optimized for blockchain data
   148|- Lowest latency for on-chain analysis patterns
   149|- Native integration with 0G Galileo infrastructure
   150|
   151|**Fallback Chain:**
   152|1. **OpenAI** (GPT-4 class) — Deep reasoning for complex transaction patterns
   153|2. **Groq** (LPU inference) — Ultra-low latency for real-time scoring
   154|3. **OpenRouter** — Model routing for specialized analysis tasks
   155|4. **Ollama** (local) — Privacy-preserving offline analysis
   156|
   157|**Analysis dimensions:**
   158|- **Intent classification** — What is this transaction trying to accomplish?
   159|- **Risk pattern matching** — Does this match known attack patterns (phishing, rug pull, approval scam)?
   160|- **Counterparty analysis** — Is the receiving address known, flagged, or newly created?
   161|- **Anomaly detection** — Is this transaction unusual for this user's historical behavior?
   162|- **Contextual enrichment** — Cross-reference with on-chain data (contract age, liquidity, holder distribution)
   163|
   164|---
   165|
   166|## Step 4: Score
   167|
   168|**Goal:** Synthesize all analysis into a single actionable risk score.
   169|
   170|> **Think of it like a credit score for transactions.** Just as a credit score condenses your financial history into a single number that tells a lender "safe" or "risky," SIFIX condenses dozens of security checks into a 0–100 score that tells you at a glance whether a transaction is safe to sign.
   171|
   172|Every transaction receives a **composite risk score from 0 to 100**, calculated from weighted risk factors identified during analysis:
   173|
   174|### Risk Tiers
   175|
   176|| Tier | Score | Color | Description | Action |
   177||---|---|---|---|---|
   178|| **SAFE** | 0–20 | 🟢 Green | Standard, well-understood interaction with verified contracts | ✅ Allow — show minimal notification |
   179|| **LOW** | 20–40 | 🟢 Light Green | Minor concerns — new contract, small amount to unverified address | ✅ Proceed — show brief summary |
   180|| **MEDIUM** | 40–60 | 🟡 Yellow | Notable risks — unusual approval, unverified contract, large transfer | ⚠️ Warn — require explicit confirmation with risk breakdown |
   181|| **HIGH** | 60–80 | 🟠 Orange | Major risks — pattern matches known scams, unlimited approval to unknown address | 🚫 Block — prevent signing, show detailed threat report |
   182|| **CRITICAL** | 80–100 | 🔴 Red | Imminent threat — confirmed malicious contract, active phishing campaign, clear drain pattern | 🚫 Block — prevent signing, trigger alert to connected devices |
   183|
   184|**Scoring factors include:**
   185|- Contract verification status and audit history
   186|- Approval magnitude (limited vs. unlimited)
   187|- Counterparty reputation and flag status
   188|- Transaction pattern anomaly score
   189|- Token legitimacy and liquidity analysis
   190|- Historical interaction frequency with target address
   191|- Time-weighted threat intelligence (recent scam patterns)
   192|
   193|---
   194|
   195|## Step 5: Act
   196|
   197|**Goal:** Present the analysis to the user in the most appropriate way for the risk level.
   198|
   199|Based on the assigned risk tier, SIFIX takes proportionate action:
   200|
   201|- **SAFE / LOW** — A non-intrusive notification appears in the extension popup showing the simulation summary and AI confidence score. The user proceeds normally.
   202|- **MEDIUM** — An expanded warning panel appears with the full simulation breakdown, identified risk factors, and a plain-English explanation. The user must explicitly acknowledge the risks before proceeding.
   203|- **HIGH / CRITICAL** — The transaction is blocked from signing. A full threat report is displayed with:
   204|  - Every identified risk factor with severity
   205|  - Simulation state diff showing exactly what would change
   206|  - AI-generated explanation of the attack vector
   207|  - Recommended actions (revoke approvals, check device security)
   208|  - Option to override (at the user's explicit risk)
   209|
   210|**The user always retains final control.** SIFIX never prevents a user from signing a transaction they explicitly choose to proceed with — but it ensures they do so with full knowledge of the risks.
   211|
   212|---
   213|
   214|## Zero-Knowledge Approach
   215|
   216|SIFIX operates on a strict principle: **simulate, never execute.**
   217|
   218|> **Think of SIFIX as a safety inspector, not a driver.** A car inspector can tell you everything about a vehicle's condition — but they never drive it off the lot. Similarly, SIFIX reads and analyzes your transactions but has **zero ability** to move your money, sign anything, or act on your behalf.
   219|
   220|- ✅ **Does:** Read transaction payloads, simulate on forked state, analyze with AI, present risk reports
   221|- ❌ **Does NOT:** Hold private keys, submit transactions, modify wallet state, store sensitive data, require custody
   222|
   223|The system is designed to be a **read-only advisor** that sits between the dApp and the wallet. It has zero ability to move funds, sign transactions, or interact with contracts on behalf of the user.
   224|
   225|All analysis data is stored locally in the extension's IndexedDB (via Dexie) and the dApp's PostgreSQL database (via Prisma). No transaction details, wallet addresses, or simulation results are sent to external services beyond what's required for AI inference.
   226|
   227|---
   228|
   229|## Performance
   230|
   231|| Metric | Target | Typical |
   232||---|---|---|
   233|| Simple transfer analysis | < 2s | ~1.2s |
   234|| ERC-20 approval analysis | < 3s | ~2.1s |
   235|| Complex DeFi interaction | < 8s | ~5.5s |
   236|| AI model fallback switch | < 500ms | ~200ms |
   237|| Extension popup load | < 500ms | ~300ms |
   238|
   239|---
   240|
   241|## Summary
   242|
   243|SIFIX's 5-step pipeline transforms the transaction signing experience from **blind trust** to **informed consent**. By combining on-chain simulation with multi-model AI analysis, it provides the semantic understanding that traditional wallets lack — without ever taking custody of user funds.
   244|
   245|→ **Next:** [Tech Stack](./tech-stack) — The technologies that power each step of the pipeline.
   246|