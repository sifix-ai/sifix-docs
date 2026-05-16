     1|---
     2|title: Data Flow
     3|description: Detailed breakdown of the SIFIX 6-step transaction analysis pipeline — from interception in the browser to decentralized storage on 0G Galileo, with TypeScript interfaces for each stage.
     4|---
     5|
     6|# Data Flow
     7|
     8|> **🎯 TL;DR**
     9|> Every time you're about to confirm a crypto transaction, SIFIX runs it through a **6-step safety checklist**: it catches the request, does a test run, checks its records for past warnings, asks an AI for analysis, saves the results permanently on a decentralized network, and learns from it for next time. Think of it like a **home inspection before you buy a house** — you want to know what you're getting into before signing on the dotted line.
    10|
    11|Every transaction the SIFIX extension intercepts follows a **six-step pipeline** that runs from browser interception through on-chain storage. This page documents each step in detail, including input/output types, data transformations, and the exact flow of information between components.
    12|
    13|## Onchain publish model (current)
    14|
    15|SIFIX uses **user-published transactions** for threat/vote records:
    16|
    17|1. dApp prepares publish payload.
    18|2. User wallet signs and sends transaction against `SifixReputation` (user pays 0G gas).
    19|3. Contract emits `SecurityReportSubmitted` on 0G Galileo.
    20|4. `sifix-indexer` captures event into `security_report_events`.
    21|5. Indexer pushes normalized `events + lastBlock + chainId` batch to `POST /api/v1/sync/reconcile-batch`.
    22|6. dApp advances sync cursor key `sifix_reputation_indexer` and updates local status to `SYNCED_ONCHAIN`.
    23|
    24|Status lifecycle:
    25|- `DRAFT_LOCAL` -> `PUBLISHING` -> `SYNCED_ONCHAIN`
    26|- failure path: `PUBLISH_FAILED`
    27|
    28|---
    29|
    30|> Legacy relay endpoints remain optional and are not default production flow.
    31|
    32|---
    33|
    34|## Pipeline Overview
    35|
    36|```mermaid
    37|flowchart TD
    38|    START(["User triggers TX on dApp"]) --> INTERCEPT["① INTERCEPT<br/>tx-interceptor proxies<br/>window.ethereum.request()"]
    39|    INTERCEPT -->|"InterceptedRequest"| SIM["② SIMULATE<br/>TransactionSimulator<br/>viem publicClient.call()<br/>on 0G Galileo (Chain 16602)"]
    40|    SIM -->|"SimulationResult"| THREAT["③ THREAT INTEL<br/>PrismaThreatIntel.getAddressIntel()<br/>queries recent ScanHistory"]
    41|    THREAT -->|"AddressThreatIntel"| AI["④ AI ANALYZE<br/>AIAnalyzer constructs prompt<br/>simulation + historical context<br/>→ 0G Compute or OpenAI-compatible"]
    42|    AI -->|"RiskAnalysis"| STORE["⑤ STORE<br/>StorageClient uploads JSON<br/>to 0G Storage via ts-sdk<br/>Merkle tree + root hash"]
    43|    STORE -->|"StorageReceipt"| LEARN["⑥ LEARN<br/>saveScanResult() persists<br/>to ScanHistory table in PostgreSQL"]
    44|    LEARN -->|"AnalysisResult"| RESULT(["AnalysisResult returned to extension<br/>riskScore · recommendation<br/>storageRootHash · threats"])
    45|
    46|    style START fill:#22c55e,color:#fff
    47|    style INTERCEPT fill:#3b9eff,color:#fff
    48|    style SIM fill:#f59e0b,color:#000
    49|    style THREAT fill:#a855f7,color:#fff
    50|    style AI fill:#a855f7,color:#fff
    51|    style STORE fill:#22c55e,color:#fff
    52|    style LEARN fill:#6366f1,color:#fff
    53|    style RESULT fill:#ef4444,color:#fff
    54|```
    55|
    56|---
    57|
    58|## TypeScript Interfaces
    59|
    60|### Core Types
    61|
    62|```typescript
    63|// Risk levels used throughout the pipeline
    64|type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    65|
    66|// Recommendations returned by AI analysis
    67|type Recommendation = "ALLOW" | "WARN" | "BLOCK";
    68|
    69|// Transaction methods intercepted by the extension
    70|type InterceptedMethod =
    71|  | "eth_sendTransaction"
    72|  | "eth_signTransaction"
    73|  | "personal_sign"
    74|  | "eth_sign"
    75|  | "eth_signTypedData"
    76|  | "eth_signTypedData_v1"
    77|  | "eth_signTypedData_v3"
    78|  | "eth_signTypedData_v4"
    79|  | "wallet_addEthereumChain"
    80|  | "wallet_switchEthereumChain";
    81|```
    82|
    83|---
    84|
    85|## Step 1: INTERCEPT
    86|
    87|> **💡 Everyday analogy:** Think of this like a **mail room inspector reading the label on a package** before it leaves the building. The inspector doesn't open the package — they just note down where it's going, what kind of package it is, and who sent it, then flag it for further checks.
    88|
    89|The `tx-interceptor` content script runs in the **MAIN world** and replaces `window.ethereum.request()` with a JavaScript `Proxy` object. This happens **before any page scripts execute** — the script is injected at `webNavigation.onBeforeNavigate` with `injectImmediately: true`.
    90|
    91|**How it works:**
    92|
    93|1. The original `window.ethereum.request` is saved as `originalRequest`
    94|2. A `Proxy` wraps the object, intercepting calls to `request()`
    95|3. When a dApp calls an intercepted method, the proxy captures the parameters
    96|4. Parameters are sent to the background worker via `chrome.runtime.sendMessage`
    97|5. A pre-flight popup appears: **Analyze First** / **Continue** / **Block**
    98|6. If the user chooses **Analyze**, the request continues to the API
    99|
   100|**Input:** The raw `window.ethereum.request()` call from the dApp
   101|
   102|```typescript
   103|interface InterceptedRequest {
   104|  /** The Ethereum JSON-RPC method name */
   105|  method: InterceptedMethod;
   106|
   107|  /** Array of request parameters (varies by method) */
   108|  params: unknown[];
   109|
   110|  /** URL of the page where the request originated */
   111|  origin: string;
   112|
   113|  /** Timestamp of interception */
   114|  timestamp: number;
   115|
   116|  /** ID for correlating the request with the response */
   117|  requestId: string;
   118|}
   119|```
   120|
   121|**Output:** Transaction parameters extracted for analysis
   122|
   123|```typescript
   124|interface TransactionParams {
   125|  /** Sender address */
   126|  from: `0x${string}`;
   127|
   128|  /** Recipient address (contract or EOA) */
   129|  to?: `0x${string}`;
   130|
   131|  /** Encoded contract call data */
   132|  data?: `0x${string}`;
   133|
   134|  /** Value in wei being sent */
   135|  value?: bigint;
   136|
   137|  /** Gas limit */
   138|  gas?: bigint;
   139|
   140|  /** Max fee per gas (EIP-1559) */
   141|  maxFeePerGas?: bigint;
   142|
   143|  /** Max priority fee per gas */
   144|  maxPriorityFeePerGas?: bigint;
   145|
   146|  /** Nonce */
   147|  nonce?: number;
   148|
   149|  /** Chain ID */
   150|  chainId?: number;
   151|}
   152|```
   153|
   154|---
   155|
   156|## Step 2: SIMULATE
   157|
   158|> **💡 Everyday analogy:** This is like a **fire drill**. Instead of a real fire, you simulate the emergency to see what would happen — who evacuates, which doors get jammed, how long it takes. In SIFIX's case, instead of sending a real transaction (which can't be undone), it runs a fake one to see if it would succeed, fail, or cause unexpected results.
   159|
   160|Transaction parameters are sent to `POST /api/v1/extension/analyze` on the dApp server. The dApp creates a `TransactionSimulator` which uses **viem's `publicClient.call()`** against the 0G Galileo RPC (`https://evmrpc-testnet.0g.ai`). This simulates the transaction against the current chain state **without broadcasting**.
   161|
   162|**What simulation reveals:**
   163|
   164|- Whether the transaction would revert (and why)
   165|- Gas usage estimates
   166|- Balance changes for the sender and recipient
   167|- Events that would be emitted
   168|- State changes to contract storage
   169|
   170|**Input:** Transaction parameters (from Step 1)
   171|
   172|```typescript
   173|interface SimulationInput {
   174|  /** Transaction parameters */
   175|  transaction: TransactionParams;
   176|
   177|  /** Block tag to simulate against (default: "latest") */
   178|  blockTag?: "latest" | "pending";
   179|
   180|  /** 0G Galileo RPC URL */
   181|  rpcUrl: string; // "https://evmrpc-testnet.0g.ai"
   182|}
   183|```
   184|
   185|**Output:** Full simulation result
   186|
   187|```typescript
   188|interface SimulationResult {
   189|  /** Whether the simulation succeeded or reverted */
   190|  success: boolean;
   191|
   192|  /** Gas used in the simulation */
   193|  gasUsed: bigint;
   194|
   195|  /** Estimated gas limit for the actual transaction */
   196|  gasEstimate: bigint;
   197|
   198|  /** Balance changes keyed by address */
   199|  balanceChanges: Array<{
   200|    address: `0x${string}`;
   201|    change: bigint; // Negative = sent, Positive = received
   202|    token?: {
   203|      symbol: string;
   204|      decimals: number;
   205|    };
   206|  }>;
   207|
   208|  /** Events emitted during simulation */
   209|  events: Array<{
   210|    address: `0x${string}`;
   211|    topics: `0x${string}`[];
   212|    data: `0x${string}`;
   213|    eventName?: string;
   214|    args?: Record<string, unknown>;
   215|  }>;
   216|
   217|  /** Revert reason if the transaction would fail */
   218|  revertReason?: string;
   219|
   220|  /** Contract call trace */
   221|  trace?: Array<{
   222|    from: `0x${string}`;
   223|    to: `0x${string}`;
   224|    value: bigint;
   225|    input: `0x${string}`;
   226|    output?: `0x${string}`;
   227|  }>;
   228|
   229|  /** State diffs (if available) */
   230|  stateChanges?: Record<
   231|    `0x${string}`,
   232|    Record<string, { old: string; new: string }>
   233|  >;
   234|
   235|  /** Simulation duration in milliseconds */
   236|  duration: number;
   237|}
   238|```
   239|
   240|---
   241|
   242|## Step 3: THREAT INTEL
   243|
   244|> **💡 Everyday analogy:** Imagine you're a **bank teller checking a customer's history** before approving a large withdrawal. You look up whether this person has been involved in suspicious activity before, how many times they've been flagged, and what other branches have reported. SIFIX does the same thing by looking up an address's past scan history.
   245|
   246|The `PrismaThreatIntel.getAddressIntel()` implementation queries recent `ScanHistory` rows in PostgreSQL for the target address. This historical context helps the AI produce more accurate risk assessments.
   247|
   248|**What threat intel provides:**
   249|
   250|- How many times this address has been scanned
   251|- Average and maximum risk scores from previous scans
   252|- Known threats associated with the address
   253|- Risk distribution (how many LOW/MEDIUM/HIGH/CRITICAL results)
   254|- Recent scan summaries
   255|
   256|**Input:** Address to look up
   257|
   258|```typescript
   259|interface ThreatIntelInput {
   260|  /** The address to gather intelligence for */
   261|  address: `0x${string}`;
   262|
   263|  /** Maximum number of historical scans to consider */
   264|  limit: number; // Default: 50
   265|
   266|  /** Optional chain ID filter */
   267|  chainId?: number;
   268|}
   269|```
   270|
   271|**Output:** Aggregated threat intelligence
   272|
   273|```typescript
   274|interface AddressThreatIntel {
   275|  /** The queried address */
   276|  address: `0x${string}`;
   277|
   278|  /** Total number of previous scans */
   279|  totalScans: number;
   280|
   281|  /** Average risk score across all scans (0–100) */
   282|  avgRiskScore: number;
   283|
   284|  /** Maximum risk score ever recorded */
   285|  maxRiskScore: number;
   286|
   287|  /** List of known threats associated with this address */
   288|  knownThreats: Array<{
   289|    type: string;
   290|    severity: number;
   291|    description: string;
   292|    firstSeen: Date;
   293|    lastSeen: Date;
   294|  }>;
   295|
   296|  /** Distribution of risk levels from historical scans */
   297|  riskDistribution: {
   298|    low: number;
   299|    medium: number;
   300|    high: number;
   301|    critical: number;
   302|  };
   303|
   304|  /** Most recent scan summaries */
   305|  recentScans: Array<{
   306|    date: Date;
   307|    riskScore: number;
   308|    riskLevel: RiskLevel;
   309|    recommendation: Recommendation;
   310|    threats: string[];
   311|    reasoning: string;
   312|  }>;
   313|
   314|  /** Community tags for this address */
   315|  tags?: Array<{
   316|    tag: string;
   317|    upvotes: number;
   318|    downvotes: number;
   319|  }>;
   320|
   321|  /** Whether this address appears on any watchlists */
   322|  isWatchlisted: boolean;
   323|}
   324|```
   325|
   326|---
   327|
   328|## Step 4: AI ANALYZE
   329|
   330|> **💡 Everyday analogy:** This is like **bringing in a seasoned detective** to review all the evidence. You hand them the simulation results (the "crime scene photos") and the background check (the "criminal history"), and they give you their professional assessment: how risky is this, what are the specific threats, and what should you do about it.
   331|
   332|`AIAnalyzer.analyze()` constructs a structured prompt containing the simulation results and threat intelligence context. The prompt asks the AI to evaluate the transaction across multiple risk dimensions.
   333|
   334|**AI provider routing:**
   335|
   336|1. **0G Compute** — If `compute` config is provided (fully decentralized inference)
   337|2. **Configured provider** — If `aiProvider` config is set (OpenAI, Groq, OpenRouter, Together AI, Ollama)
   338|3. **Legacy** — If `openaiApiKey` is set (deprecated path)
   339|
   340|**Input:** Simulation result + threat intelligence
   341|
   342|```typescript
   343|interface AIAnalysisInput {
   344|  /** Simulation result from Step 2 */
   345|  simulation: SimulationResult;
   346|
   347|  /** Threat intelligence from Step 3 */
   348|  threatIntel: AddressThreatIntel;
   349|
   350|  /** Original transaction parameters */
   351|  transaction: TransactionParams;
   352|
   353|  /** The method that was intercepted */
   354|  method: InterceptedMethod;
   355|
   356|  /** Origin URL of the dApp */
   357|  origin: string;
   358|}
   359|```
   360|
   361|**Output:** Structured risk analysis
   362|
   363|```typescript
   364|interface RiskAnalysis {
   365|  /** Overall risk score (0–100) */
   366|  riskScore: number;
   367|
   368|  /** Confidence level of the analysis (0–1) */
   369|  confidence: number;
   370|
   371|  /** Human-readable explanation of the risk assessment */
   372|  reasoning: string;
   373|
   374|  /** List of specific threats detected */
   375|  threats: Array<{
   376|    /** Threat category */
   377|    type:
   378|      | "REENTRANCY"
   379|      | "APPROVAL_EXPLOIT"
   380|      | "PHISHING"
   381|      | "DUSTING"
   382|      | "FRONT_RUNNING"
   383|      | "RUG_PULL"
   384|      | "SUSPICIOUS_CONTRACT"
   385|      | "UNSUPPORTED_CHAIN"
   386|      | "UNUSUAL_VALUE"
   387|      | "KNOWN_SCAM"
   388|      | "PERMISSION_OVERREACH"
   389|      | "UNVERIFIED_SOURCE"
   390|      | "CUSTOM";
   391|
   392|    /** Severity of this specific threat */
   393|    severity: RiskLevel;
   394|
   395|    /** Description of the threat */
   396|    description: string;
   397|
   398|    /** Confidence in this specific detection */
   399|    confidence: number;
   400|  }>;
   401|
   402|  /** Action recommendation */
   403|  recommendation: Recommendation;
   404|
   405|  /** Suggested safe alternatives or mitigations */
   406|  mitigations?: string[];
   407|
   408|  /** Which risk factors contributed most to the score */
   409|  scoreBreakdown?: {
   410|    simulationRisk: number; // 0–100 component
   411|    historicalRisk: number; // 0–100 component
   412|    behavioralRisk: number; // 0–100 component
   413|    communityRisk: number; // 0–100 component
   414|  };
   415|}
   416|```
   417|
   418|---
   419|
   420|## Step 5: STORE
   421|
   422|> **💡 Everyday analogy:** Think of this as **filing the police report in a tamper-proof vault**. Once the detective finishes their analysis, the full report is sealed in a container that can't be edited or destroyed. Anyone can verify the report later by checking the vault's seal — but nobody can change what's inside.
   423|
   424|`StorageClient.storeAnalysis()` serializes the complete analysis result into JSON and uploads it to **0G Storage** via `@0gfoundation/0g-storage-ts-sdk`. The upload creates a Merkle tree, and the root hash is stored on-chain as a permanent, tamper-proof reference.
   425|
   426|**Storage properties:**
   427|
   428|- Upload includes the full `AnalysisResult` JSON
   429|- A Merkle tree is generated client-side
   430|- The root hash anchors the data on-chain
   431|- Content can be retrieved by hash from any 0G Storage node
   432|- 3 retries with exponential backoff (2s, 4s delays)
   433|
   434|**Input:** Complete analysis result
   435|
   436|```typescript
   437|interface StorageInput {
   438|  /** The full analysis result to store */
   439|  analysis: AnalysisResult;
   440|
   441|  /** Whether to use mock mode (deterministic keccak256 hash) */
   442|  mockMode: boolean;
   443|
   444|  /** 0G Storage indexer URL */
   445|  indexerUrl: string; // "https://indexer-storage-testnet-turbo.0g.ai"
   446|
   447|  /** Private key for the upload transaction */
   448|  privateKey: `0x${string}`;
   449|}
   450|```
   451|
   452|**Output:** Storage receipt with reference data
   453|
   454|```typescript
   455|interface StorageReceipt {
   456|  /** Merkle root hash of the uploaded data */
   457|  rootHash: `0x${string}`;
   458|
   459|  /** URL to view the data on the 0G Storage explorer */
   460|  explorerUrl: string;
   461|
   462|  /** Size of the uploaded data in bytes */
   463|  dataSize: number;
   464|
   465|  /** Timestamp of the upload */
   466|  uploadedAt: Date;
   467|
   468|  /** Whether the upload was real or mocked */
   469|  isMock: boolean;
   470|}
   471|```
   472|
   473|---
   474|
   475|## Step 6: LEARN
   476|
   477|> **💡 Everyday analogy:** This is like **adding the case to a detective's experience log**. Every solved case makes the detective sharper for the next one. Similarly, by saving the scan results, SIFIX ensures that the next time someone interacts with the same address, it has a richer history to draw from — making each subsequent analysis more informed.
   478|
   479|`ThreatIntelProvider.saveScanResult()` persists the complete scan result to the `ScanHistory` table in PostgreSQL. This creates a **self-improving feedback loop** — on the next scan involving the same address, Step 3 will return richer context.
   480|
   481|**What gets persisted:**
   482|
   483|- Target and sender addresses
   484|- Risk score, level, and recommendation
   485|- AI reasoning and detected threats
   486|- 0G Storage root hash reference
   487|- Confidence score
   488|- Timestamp and duration
   489|
   490|**Input:** Complete scan result for persistence
   491|
   492|```typescript
   493|interface ScanResultInput {
   494|  /** Sender address */
   495|  fromAddress: `0x${string}`;
   496|
   497|  /** Target/recipient address */
   498|  toAddress: `0x${string}`;
   499|
   500|  /** Overall risk score */
   501|  riskScore: number;
   502|
   503|  /** Risk level classification */
   504|  riskLevel: RiskLevel;
   505|
   506|  /** AI recommendation */
   507|  recommendation: Recommendation;
   508|
   509|  /** AI reasoning text */
   510|  reasoning: string;
   511|
   512|  /** Detected threats as JSON array */
   513|  threats: string[];
   514|
   515|  /** Confidence score */
   516|  confidence: number;
   517|
   518|  /** 0G Storage root hash */
   519|  rootHash: `0x${string}`;
   520|
   521|  /** Scan duration in milliseconds */
   522|  scanDuration: number;
   523|
   524|  /** Agent version that performed the analysis */
   525|  agentVersion: string;
   526|}
   527|```
   528|
   529|**Output:** Persisted record confirmation
   530|
   531|```typescript
   532|interface ScanRecord {
   533|  /** Auto-incremented record ID */
   534|  id: string;
   535|
   536|  /** Timestamp of persistence */
   537|  createdAt: Date;
   538|
   539|  /** The root hash reference for retrieval */
   540|  rootHash: `0x${string}`;
   541|}
   542|```
   543|
   544|---
   545|
   546|## Composite: AnalysisResult
   547|
   548|The final result returned to the extension combines outputs from all steps:
   549|
   550|```typescript
   551|interface AnalysisResult {
   552|  /** Unique analysis ID */
   553|  id: string;
   554|
   555|  /** Timestamp of the analysis */
   556|  timestamp: number;
   557|
   558|  /** Original intercepted request */
   559|  request: InterceptedRequest;
   560|
   561|  /** Simulation results (Step 2) */
   562|  simulation: SimulationResult;
   563|
   564|  /** AI risk analysis (Step 4) */
   565|  analysis: RiskAnalysis;
   566|
   567|  /** 0G Storage receipt (Step 5) */
   568|  storage: StorageReceipt;
   569|
   570|  /** Total pipeline duration in milliseconds */
   571|  totalDuration: number;
   572|
   573|  /** Which AI provider was used */
   574|  aiProvider: "0g-compute" | "openai" | "groq" | "ollama" | "custom";
   575|
   576|  /** Agent version */
   577|  agentVersion: string;
   578|}
   579|```
   580|
   581|---
   582|
   583|## Extension Presentation
   584|
   585|Once the `AnalysisResult` is returned to the extension, the popup displays:
   586|
   587|- **Risk Score** — Color-coded gauge (green → yellow → orange → red)
   588|- **Risk Level** — SAFE / LOW / MEDIUM / HIGH / CRITICAL badge
   589|- **Recommendation** — ALLOW / WARN / BLOCK with action button
   590|- **AI Reasoning** — Human-readable explanation of the risk
   591|- **Detected Threats** — List with type, severity, and description
   592|- **0G Storage Proof** — Root hash with link to explorer
   593|- **Balance Changes** — Token transfers from simulation
   594|- **Action Buttons** — Proceed to Wallet / Block Transaction
   595|
   596|---
   597|
   598|## Error Handling
   599|
   600|The pipeline handles failures at each step:
   601|
   602|- **Step 1 failure:** If the proxy fails to intercept, the original request passes through unmodified (fail-open)
   603|- **Step 2 failure:** If simulation fails (network error, RPC down), the analysis continues with `simulation.success = false` and the revert reason
   604|- **Step 3 failure:** If threat intel is unavailable (new address, DB error), `totalScans = 0` and the AI relies solely on simulation data
   605|- **Step 4 failure:** If AI analysis fails entirely (all providers down), the system returns a conservative WARN recommendation with the raw simulation data
   606|- **Step 5 failure:** If 0G Storage upload fails after retries, the analysis still completes but `storage.isMock = true` with a local keccak256 hash
   607|- **Step 6 failure:** If persistence fails, the analysis result is still returned to the user but the learning loop is broken for this scan
   608|
   609|---
   610|
   611|## See Also
   612|
   613|- **[System Overview](/architecture/system-overview)** — Full architecture with all components
   614|- **[Security Model](/architecture/security-model)** — How SIFIX protects each step
   615|- **[Database Schema](/architecture/database-schema)** — Prisma models storing pipeline data
   616|