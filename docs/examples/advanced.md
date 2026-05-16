     1|---
     2|title: "Advanced Patterns"
     3|description: "Advanced SIFIX SDK patterns — batch analysis with concurrency, custom ThreatIntelProvider, retry with exponential backoff, webhooks, Dashboard API integration, and Chrome Extension content script patterns on 0G Galileo Testnet."
     4|---
     5|
     6|# Advanced Patterns
     7|
     8|This guide covers advanced integration patterns for production SIFIX deployments — batch analysis with concurrency control, custom threat intelligence providers, resilient error handling, webhook integrations, Dashboard API calls, and Chrome Extension content script patterns.
     9|
    10|All examples target the **0G Galileo Testnet** (Chain ID: 16602).
    11|
    12|---
    13|
    14|## Batch Analysis with Concurrency Control
    15|
    16|When scanning multiple addresses or transactions (e.g., a wallet's full history or a monitoring batch), use concurrency-limited batch analysis to balance throughput with API rate limits.
    17|
    18|### Basic Batch Analysis
    19|
    20|```typescript
    21|// batch-analysis.ts
    22|import { SecurityAgent } from "@sifix/agent";
    23|import type { AnalysisResult } from "@sifix/agent";
    24|
    25|interface TxInput {
    26|  from: string;
    27|  to: string;
    28|  data?: string;
    29|  value?: string;
    30|  label?: string; // Optional label for logging
    31|}
    32|
    33|async function batchAnalyze(
    34|  agent: SecurityAgent,
    35|  transactions: TxInput[],
    36|  concurrency: number = 3
    37|): Promise<AnalysisResult[]> {
    38|  const results: AnalysisResult[] = [];
    39|  const queue = [...transactions];
    40|  let completed = 0;
    41|
    42|  async function worker(workerId: number): Promise<void> {
    43|    while (queue.length > 0) {
    44|      const tx = queue.shift();
    45|      if (!tx) break;
    46|
    47|      try {
    48|        const result = await agent.analyzeTransaction({
    49|          from: tx.from,
    50|          to: tx.to,
    51|          data: tx.data,
    52|          value: tx.value,
    53|        });
    54|
    55|        results.push(result);
    56|        completed++;
    57|
    58|        const label = tx.label || tx.to.slice(0, 10);
    59|        console.log(
    60|          `✅ [${completed}/${transactions.length}] worker-${workerId} ` +
    61|          `${label} → score: ${result.analysis.riskScore} ` +
    62|          `(${result.analysis.recommendation})`
    63|        );
    64|      } catch (error: any) {
    65|        completed++;
    66|        console.error(
    67|          `❌ [${completed}/${transactions.length}] worker-${workerId} ` +
    68|          `Failed: ${error.message}`
    69|        );
    70|      }
    71|    }
    72|  }
    73|
    74|  // Spin up N concurrent workers
    75|  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
    76|  await Promise.all(workers);
    77|
    78|  // Summary
    79|  const safe = results.filter((r) => r.analysis.riskScore <= 20).length;
    80|  const warned = results.filter(
    81|    (r) => r.analysis.riskScore > 20 && r.analysis.riskScore <= 60
    82|  ).length;
    83|  const blocked = results.filter((r) => r.analysis.riskScore > 60).length;
    84|
    85|  console.log("\n📊 Batch Summary:");
    86|  console.log(`   Total: ${results.length}`);
    87|  console.log(`   ✅ Safe: ${safe}`);
    88|  console.log(`   ⚠️ Warned: ${warned}`);
    89|  console.log(`   🚨 Blocked: ${blocked}`);
    90|
    91|  return results;
    92|}
    93|```
    94|
    95|### Usage
    96|
    97|```typescript
    98|const agent = new SecurityAgent({
    99|  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
   100|  aiProvider: { apiKey: process.env.AI_API_KEY!, model: "gpt-4o" },
   101|  storage: { mockMode: true },
   102|  identity: {
   103|    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
   104|    tokenId: 99,
   105|  },
   106|});
   107|await agent.init();
   108|
   109|const transactions: TxInput[] = [
   110|  { from: "0x742d...", to: "0xd8dA...", value: "1000000000000000000", label: "ETH transfer" },
   111|  { from: "0x742d...", to: "0xA0b8...", data: "0x095ea7b9...", value: "0", label: "USDC approve" },
   112|  { from: "0x742d...", to: "0x4E1f...", data: "0x42842e0e...", value: "0", label: "NFT transfer" },
   113|  { from: "0x742d...", to: "0x881d...", data: "0xa9059cbb...", value: "0", label: "Token transfer" },
   114|  { from: "0x742d...", to: "0x68b3...", data: "0x38ed1739...", value: "0", label: "DEX swap" },
   115|];
   116|
   117|// Analyze with 3 concurrent workers
   118|const results = await batchAnalyze(agent, transactions, 3);
   119|```
   120|
   121|### Rate-Limited Batch (Controlled Throughput)
   122|
   123|For external AI providers with rate limits, add inter-request delays:
   124|
   125|```typescript
   126|// rate-limited-batch.ts
   127|async function rateLimitedBatch(
   128|  agent: SecurityAgent,
   129|  transactions: TxInput[],
   130|  options: {
   131|    concurrency?: number;
   132|    delayBetweenMs?: number;
   133|    maxRequestsPerMinute?: number;
   134|  } = {}
   135|): Promise<AnalysisResult[]> {
   136|  const { concurrency = 2, delayBetweenMs = 1000, maxRequestsPerMinute = 30 } = options;
   137|
   138|  const results: AnalysisResult[] = [];
   139|  const queue = [...transactions];
   140|  const minuteWindow: number[] = []; // Timestamps of requests in current minute
   141|
   142|  async function canMakeRequest(): Promise<boolean> {
   143|    const now = Date.now();
   144|
   145|    // Remove timestamps older than 1 minute
   146|    while (minuteWindow.length > 0 && now - minuteWindow[0] > 60_000) {
   147|      minuteWindow.shift();
   148|    }
   149|
   150|    if (minuteWindow.length >= maxRequestsPerMinute) {
   151|      const waitTime = 60_000 - (now - minuteWindow[0]);
   152|      console.log(`🚦 Rate limit — waiting ${Math.round(waitTime / 1000)}s...`);
   153|      await new Promise((resolve) => setTimeout(resolve, waitTime));
   154|      return canMakeRequest(); // Re-check after waiting
   155|    }
   156|
   157|    minuteWindow.push(now);
   158|    return true;
   159|  }
   160|
   161|  async function worker(): Promise<void> {
   162|    while (queue.length > 0) {
   163|      const tx = queue.shift();
   164|      if (!tx) break;
   165|
   166|      await canMakeRequest();
   167|
   168|      try {
   169|        const result = await agent.analyzeTransaction(tx);
   170|        results.push(result);
   171|      } catch (error: any) {
   172|        console.error(`Failed: ${error.message}`);
   173|      }
   174|
   175|      // Inter-request delay
   176|      if (delayBetweenMs > 0) {
   177|        await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
   178|      }
   179|    }
   180|  }
   181|
   182|  await Promise.all(Array.from({ length: concurrency }, () => worker()));
   183|  return results;
   184|}
   185|
   186|// Usage: max 20 requests/minute with 2-second delays
   187|const results = await rateLimitedBatch(agent, transactions, {
   188|  concurrency: 2,
   189|  delayBetweenMs: 2000,
   190|  maxRequestsPerMinute: 20,
   191|});
   192|```
   193|
   194|---
   195|
   196|## Custom ThreatIntelProvider
   197|
   198|The `ThreatIntelProvider` interface defines the contract for threat intelligence data sources. Implement it to integrate custom feeds, proprietary databases, or specialized APIs into the SIFIX analysis pipeline.
   199|
   200|### Interface
   201|
   202|```typescript
   203|interface ThreatIntelProvider {
   204|  getAddressIntel(address: string): Promise<AddressIntel | null>;
   205|  saveScanResult(address: string, result: AddressIntel): Promise<void>;
   206|}
   207|
   208|interface AddressIntel {
   209|  address: string;
   210|  riskScore: number;           // 0–100
   211|  labels: string[];            // e.g. ["phishing", "drainer"]
   212|  firstSeen: string;           // ISO 8601
   213|  lastSeen: string;            // ISO 8601
   214|  transactionCount: number;
   215|  associatedEntities: string[];
   216|}
   217|```
   218|
   219|### Example: Chainalysis-Style Provider
   220|
   221|```typescript
   222|// custom-threat-provider.ts
   223|import { ThreatIntelProvider, AddressIntel } from "@sifix/agent";
   224|
   225|class ChainalysisThreatProvider implements ThreatIntelProvider {
   226|  private apiUrl: string;
   227|  private apiKey: string;
   228|  private cache: Map<string, { data: AddressIntel; expires: number }>;
   229|  private cacheTtl: number;
   230|
   231|  constructor(apiUrl: string, apiKey: string, cacheTtl: number = 300) {
   232|    this.apiUrl = apiUrl;
   233|    this.apiKey = apiKey;
   234|    this.cache = new Map();
   235|    this.cacheTtl = cacheTtl * 1000; // Convert to ms
   236|  }
   237|
   238|  async getAddressIntel(address: string): Promise<AddressIntel | null> {
   239|    // Check cache first
   240|    const cached = this.cache.get(address);
   241|    if (cached && cached.expires > Date.now()) {
   242|      return cached.data;
   243|    }
   244|
   245|    try {
   246|      const response = await fetch(
   247|        `${this.apiUrl}/v1/address/${address}/risk`,
   248|        {
   249|          headers: {
   250|            Authorization: `Bearer ${this.apiKey}`,
   251|            "Content-Type": "application/json",
   252|          },
   253|          signal: AbortSignal.timeout(5_000), // 5s timeout
   254|        }
   255|      );
   256|
   257|      if (!response.ok) {
   258|        if (response.status === 404) return null; // No data available
   259|        throw new Error(`API returned ${response.status}`);
   260|      }
   261|
   262|      const data = await response.json();
   263|
   264|      const intel: AddressIntel = {
   265|        address,
   266|        riskScore: data.risk_score ?? 50,
   267|        labels: data.tags ?? [],
   268|        firstSeen: data.first_seen ?? new Date().toISOString(),
   269|        lastSeen: data.last_seen ?? new Date().toISOString(),
   270|        transactionCount: data.tx_count ?? 0,
   271|        associatedEntities: data.related_addresses ?? [],
   272|      };
   273|
   274|      // Cache the result
   275|      this.cache.set(address, {
   276|        data: intel,
   277|        expires: Date.now() + this.cacheTtl,
   278|      });
   279|
   280|      return intel;
   281|    } catch (error: any) {
   282|      console.error(`ThreatIntel lookup failed for ${address}:`, error.message);
   283|      return null; // Graceful degradation
   284|    }
   285|  }
   286|
   287|  async saveScanResult(address: string, result: AddressIntel): Promise<void> {
   288|    // Persist to the external API for future lookups
   289|    try {
   290|      await fetch(`${this.apiUrl}/v1/scans`, {
   291|        method: "POST",
   292|        headers: {
   293|          Authorization: `Bearer ${this.apiKey}`,
   294|          "Content-Type": "application/json",
   295|        },
   296|        body: JSON.stringify({ address, result }),
   297|      });
   298|    } catch (error: any) {
   299|      console.error(`Failed to save scan result:`, error.message);
   300|      // Non-critical — don't throw
   301|    }
   302|  }
   303|}
   304|```
   305|
   306|### Example: Multi-Source Aggregator
   307|
   308|Combine multiple threat intelligence sources with weighted scoring:
   309|
   310|```typescript
   311|// multi-source-intel.ts
   312|import { ThreatIntelProvider, AddressIntel } from "@sifix/agent";
   313|
   314|class MultiSourceThreatProvider implements ThreatIntelProvider {
   315|  private sources: { provider: ThreatIntelProvider; weight: number }[];
   316|
   317|  constructor(sources: { provider: ThreatIntelProvider; weight: number }[]) {
   318|    // Validate weights sum to 1.0
   319|    const total = sources.reduce((sum, s) => sum + s.weight, 0);
   320|    if (Math.abs(total - 1.0) > 0.01) {
   321|      throw new Error(`Weights must sum to 1.0, got ${total}`);
   322|    }
   323|    this.sources = sources;
   324|  }
   325|
   326|  async getAddressIntel(address: string): Promise<AddressIntel | null> {
   327|    // Query all sources concurrently
   328|    const results = await Promise.allSettled(
   329|      this.sources.map((source) => source.provider.getAddressIntel(address))
   330|    );
   331|
   332|    // Collect successful results
   333|    const intelResults: { intel: AddressIntel; weight: number }[] = [];
   334|    for (let i = 0; i < results.length; i++) {
   335|      const result = results[i];
   336|      if (result.status === "fulfilled" && result.value) {
   337|        intelResults.push({ intel: result.value, weight: this.sources[i].weight });
   338|      }
   339|    }
   340|
   341|    if (intelResults.length === 0) return null;
   342|
   343|    // Aggregate: weighted risk score
   344|    const weightedScore = intelResults.reduce(
   345|      (sum, { intel, weight }) => sum + intel.riskScore * weight,
   346|      0
   347|    );
   348|
   349|    // Merge labels (deduplicated)
   350|    const allLabels = [...new Set(intelResults.flatMap(({ intel }) => intel.labels))];
   351|
   352|    // Use earliest firstSeen, latest lastSeen
   353|    const firstSeen = intelResults
   354|      .map(({ intel }) => intel.firstSeen)
   355|      .sort()[0];
   356|    const lastSeen = intelResults
   357|      .map(({ intel }) => intel.lastSeen)
   358|      .sort()
   359|      .reverse()[0];
   360|
   361|    return {
   362|      address,
   363|      riskScore: Math.round(weightedScore),
   364|      labels: allLabels,
   365|      firstSeen,
   366|      lastSeen,
   367|      transactionCount: Math.max(...intelResults.map(({ intel }) => intel.transactionCount)),
   368|      associatedEntities: [
   369|        ...new Set(intelResults.flatMap(({ intel }) => intel.associatedEntities)),
   370|      ],
   371|    };
   372|  }
   373|
   374|  async saveScanResult(address: string, result: AddressIntel): Promise<void> {
   375|    // Save to all sources
   376|    await Promise.allSettled(
   377|      this.sources.map((source) => source.provider.saveScanResult(address, result))
   378|    );
   379|  }
   380|}
   381|```
   382|
   383|### Registering a Custom Provider
   384|
   385|```typescript
   386|// register-provider.ts
   387|import { SecurityAgent } from "@sifix/agent";
   388|
   389|const agent = new SecurityAgent({
   390|  network: { chainId: 16602, rpcUrl: "https://evmrpc-testnet.0g.ai" },
   391|  aiProvider: { apiKey: process.env.AI_API_KEY!, model: "gpt-4o" },
   392|  storage: { mockMode: true },
   393|  threatIntel: {
   394|    enabled: true,
   395|    provider: new ChainalysisThreatProvider(
   396|      "https://threat-api.example.com",
   397|      process.env.THREAT_API_KEY!,
   398|      300 // 5-minute cache TTL
   399|    ),
   400|  },
   401|  identity: {
   402|    contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
   403|    tokenId: 99,
   404|  },
   405|});
   406|```
   407|
   408|---
   409|
   410|## Error Handling with Retry and Exponential Backoff
   411|
   412|### Generic Retry Utility
   413|
   414|```typescript
   415|// retry.ts
   416|interface RetryOptions {
   417|  maxRetries: number;
   418|  baseDelay: number;  // Base delay in ms
   419|  maxDelay: number;   // Maximum delay cap in ms
   420|  jitter: boolean;    // Add randomness to prevent thundering herd
   421|  shouldRetry: (error: any) => boolean; // Predicate to decide if retryable
   422|}
   423|
   424|const DEFAULT_RETRY_OPTIONS: RetryOptions = {
   425|  maxRetries: 3,
   426|  baseDelay: 1000,
   427|  maxDelay: 30_000,
   428|  jitter: true,
   429|  shouldRetry: () => true,
   430|};
   431|
   432|async function withRetry<T>(
   433|  fn: () => Promise<T>,
   434|  options: Partial<RetryOptions> = {}
   435|): Promise<T> {
   436|  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
   437|
   438|  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
   439|    try {
   440|      return await fn();
   441|    } catch (error: any) {
   442|      const isLastAttempt = attempt > opts.maxRetries;
   443|
   444|      if (isLastAttempt || !opts.shouldRetry(error)) {
   445|        throw error;
   446|      }
   447|
   448|      // Exponential backoff: 1s, 2s, 4s, 8s, ...
   449|      let delay = opts.baseDelay * Math.pow(2, attempt - 1);
   450|
   451|      // Cap at maxDelay
   452|      delay = Math.min(delay, opts.maxDelay);
   453|
   454|      // Add jitter (random 0–50% of delay)
   455|      if (opts.jitter) {
   456|        delay += Math.random() * delay * 0.5;
   457|      }
   458|
   459|      console.warn(
   460|        `⚠️ Attempt ${attempt}/${opts.maxRetries} failed: ${error.message}. ` +
   461|        `Retrying in ${Math.round(delay / 1000)}s...`
   462|      );
   463|
   464|      await new Promise((resolve) => setTimeout(resolve, delay));
   465|    }
   466|  }
   467|
   468|  throw new Error("Unreachable");
   469|}
   470|```
   471|
   472|### Using Retry with SIFIX Agent
   473|
   474|```typescript
   475|// retry-analysis.ts
   476|import { SecurityAgent } from "@sifix/agent";
   477|
   478|const agent: SecurityAgent = /* ... */;
   479|
   480|// Retry analysis with custom logic
   481|const result = await withRetry(
   482|  () =>
   483|    agent.analyzeTransaction({
   484|      from: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
   485|      to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
   486|      value: "1000000000000000000",
   487|    }),
   488|  {
   489|    maxRetries: 5,
   490|    baseDelay: 2000,
   491|    shouldRetry: (error) => {
   492|      // Don't retry on configuration errors
   493|      if (error.name === "ConfigurationError") return false;
   494|      // Don't retry on blocked transactions (they'll still be blocked)
   495|      if (error.message?.includes("blocked")) return false;
   496|      // Retry on network, timeout, and AI provider errors
   497|      return (
   498|        error.message?.includes("timeout") ||
   499|        error.message?.includes("network") ||
   500|        error.message?.includes("ECONNRESET") ||
   501|        error.message?.includes("rate limit") ||
   502|        error.message?.includes("503")
   503|      );
   504|    },
   505|  }
   506|);
   507|
   508|console.log("Analysis complete:", result.analysis.riskScore);
   509|```
   510|
   511|### Circuit Breaker Pattern
   512|
   513|For long-running services, implement a circuit breaker to avoid hammering a failing provider:
   514|
   515|```typescript
   516|// circuit-breaker.ts
   517|class CircuitBreaker {
   518|  private failures = 0;
   519|  private lastFailureTime = 0;
   520|  private state: "closed" | "open" | "half-open" = "closed";
   521|
   522|  constructor(
   523|    private threshold: number = 5,      // Failures before opening
   524|    private resetTimeout: number = 60_000, // Time before trying again
   525|    private halfOpenAttempts: number = 1   // Requests to try in half-open
   526|  ) {}
   527|
   528|  async execute<T>(fn: () => Promise<T>): Promise<T> {
   529|    if (this.state === "open") {
   530|      const timeSinceFailure = Date.now() - this.lastFailureTime;
   531|      if (timeSinceFailure < this.resetTimeout) {
   532|        throw new Error(
   533|          `Circuit breaker is OPEN — retry after ${Math.round(
   534|            (this.resetTimeout - timeSinceFailure) / 1000
   535|          )}s`
   536|        );
   537|      }
   538|      // Transition to half-open
   539|      this.state = "half-open";
   540|    }
   541|
   542|    try {
   543|      const result = await fn();
   544|      this.onSuccess();
   545|      return result;
   546|    } catch (error) {
   547|      this.onFailure();
   548|      throw error;
   549|    }
   550|  }
   551|
   552|  private onSuccess(): void {
   553|    this.failures = 0;
   554|    this.state = "closed";
   555|  }
   556|
   557|  private onFailure(): void {
   558|    this.failures++;
   559|    this.lastFailureTime = Date.now();
   560|
   561|    if (this.failures >= this.threshold) {
   562|      this.state = "open";
   563|      console.error(
   564|        `🔴 Circuit breaker OPEN after ${this.failures} failures. ` +
   565|        `Will retry in ${this.resetTimeout / 1000}s.`
   566|      );
   567|    }
   568|  }
   569|
   570|  getState(): string {
   571|    return this.state;
   572|  }
   573|}
   574|
   575|// Usage
   576|const breaker = new CircuitBreaker(5, 60_000);
   577|
   578|async function resilientAnalyze(tx: any) {
   579|  return breaker.execute(() =>
   580|    withRetry(
   581|      () => agent.analyzeTransaction(tx),
   582|      { maxRetries: 3, baseDelay: 1000 }
   583|    )
   584|  );
   585|}
   586|```
   587|
   588|---
   589|
   590|## Webhook Integration
   591|
   592|SIFIX can send real-time notifications when analysis completes, enabling integration with alerting systems, Slack bots, or custom backends.
   593|
   594|### Webhook Server
   595|
   596|```typescript
   597|// webhook-server.ts
   598|import express from "express";
   599|import crypto from "crypto";
   600|
   601|const app = express();
   602|app.use(express.json());
   603|
   604|// Webhook secret for signature verification
   605|const WEBHOOK_SECRET = process.env.SIFIX_WEBHOOK_SECRET!;
   606|
   607|// Verify webhook signature
   608|function verifySignature(payload: string, signature: string): boolean {
   609|  const expected = crypto
   610|    .createHmac("sha256", WEBHOOK_SECRET)
   611|    .update(payload)
   612|    .digest("hex");
   613|  return crypto.timingSafeEqual(
   614|    Buffer.from(signature),
   615|    Buffer.from(expected)
   616|  );
   617|}
   618|
   619|// Webhook endpoint
   620|app.post("/webhooks/sifix", (req, res) => {
   621|  const signature = req.headers["x-sifix-signature"] as string;
   622|  const payload = JSON.stringify(req.body);
   623|
   624|  if (!verifySignature(payload, signature)) {
   625|    return res.status(401).json({ error: "Invalid signature" });
   626|  }
   627|
   628|  const { analysis, simulation, threatIntel, storageRootHash, timestamp } = req.body;
   629|
   630|  console.log(`[${timestamp}] Risk: ${analysis.riskScore} — ${analysis.recommendation}`);
   631|
   632|  // Route based on risk level
   633|  switch (analysis.recommendation) {
   634|    case "block":
   635|      sendCriticalAlert(analysis, threatIntel);
   636|      break;
   637|    case "warn":
   638|      sendWarningNotification(analysis);
   639|      break;
   640|    case "allow":
   641|      logSafeTransaction(analysis);
   642|      break;
   643|  }
   644|
   645|  // Store evidence reference
   646|  if (storageRootHash) {
   647|    console.log(`Evidence: https://chainscan-galileo.0g.ai/tx/${storageRootHash}`);
   648|  }
   649|
   650|  res.json({ received: true });
   651|});
   652|
   653|app.listen(3001, () => {
   654|  console.log("📡 Webhook server listening on port 3001");
   655|});
   656|```
   657|
   658|### Webhook Sender (Client-Side)
   659|
   660|```typescript
   661|// webhook-sender.ts
   662|import crypto from "crypto";
   663|
   664|async function sendWebhook(
   665|  url: string,
   666|  secret: string,
   667|  result: any
   668|): Promise<void> {
   669|  const payload = JSON.stringify({
   670|    analysis: result.analysis,
   671|    simulation: {
   672|      success: result.simulation.success,
   673|      gasUsed: result.simulation.gasUsed,
   674|      stateChanges: result.simulation.stateChanges,
   675|    },
   676|    threatIntel: {
   677|      fromRiskScore: result.threatIntel.fromAddress?.riskScore,
   678|      toRiskScore: result.threatIntel.toAddress?.riskScore,
   679|      relatedScamDomains: result.threatIntel.relatedScamDomains,
   680|    },
   681|    storageRootHash: result.storageRootHash,
   682|    timestamp: result.timestamp,
   683|  });
   684|
   685|  const signature = crypto
   686|    .createHmac("sha256", secret)
   687|    .update(payload)
   688|    .digest("hex");
   689|
   690|  await fetch(url, {
   691|    method: "POST",
   692|    headers: {
   693|      "Content-Type": "application/json",
   694|      "X-SIFIX-Signature": signature,
   695|    },
   696|    body: payload,
   697|  });
   698|}
   699|
   700|// Usage after analysis
   701|const result = await agent.analyzeTransaction({ /* ... */ });
   702|await sendWebhook(
   703|  "https://your-server.com/webhooks/sifix",
   704|  process.env.SIFIX_WEBHOOK_SECRET!,
   705|  result
   706|);
   707|```
   708|
   709|### Slack Integration via Webhook
   710|
   711|```typescript
   712|// slack-webhook.ts
   713|async function sendSlackAlert(
   714|  webhookUrl: string,
   715|  result: any
   716|): Promise<void> {
   717|  const { analysis, threatIntel } = result;
   718|
   719|  const emoji =
   720|    analysis.riskScore <= 20 ? "✅" :
   721|    analysis.riskScore <= 60 ? "⚠️" :
   722|    "🚨";
   723|
   724|  const blocks = [
   725|    {
   726|      type: "header",
   727|      text: { type: "plain_text", text: `${emoji} SIFIX Security Alert` },
   728|    },
   729|    {
   730|      type: "section",
   731|      fields: [
   732|        { type: "mrkdwn", text: `*Risk Score:* ${analysis.riskScore}/100` },
   733|        { type: "mrkdwn", text: `*Action:* ${analysis.recommendation.toUpperCase()}` },
   734|        { type: "mrkdwn", text: `*Confidence:* ${(analysis.confidence * 100).toFixed(1)}%` },
   735|        { type: "mrkdwn", text: `*Provider:* ${analysis.provider}` },
   736|      ],
   737|    },
   738|  ];
   739|
   740|  if (analysis.threats.length > 0) {
   741|    const threatLines = analysis.threats
   742|      .map((t: any) => `• [${t.severity}] ${t.type}: ${t.description}`)
   743|      .join("\n");
   744|
   745|    blocks.push({
   746|      type: "section",
   747|      text: { type: "mrkdwn", text: `*Threats:*\n${threatLines}` },
   748|    });
   749|  }
   750|
   751|  if (result.storageRootHash) {
   752|    blocks.push({
   753|      type: "context",
   754|      elements: [
   755|        {
   756|          type: "mrkdwn",
   757|          text: `📦 Evidence: \`${result.storageRootHash.slice(0, 20)}...\` on 0G Galileo`,
   758|        },
   759|      ],
   760|    });
   761|  }
   762|
   763|  await fetch(webhookUrl, {
   764|    method: "POST",
   765|    headers: { "Content-Type": "application/json" },
   766|    body: JSON.stringify({ blocks }),
   767|  });
   768|}
   769|```
   770|
   771|---
   772|
   773|## Dashboard API Integration
   774|
   775|The SIFIX Dashboard exposes **REST endpoints** for programmatic access to scans, tags, watchlists, and reports.
   776|
   777|### Authentication
   778|
   779|All dashboard API calls require a JWT token obtained via SIWE (Sign-In with Ethereum):
   780|
   781|```typescript
   782|// dashboard-auth.ts
   783|const API_BASE = "https://api.sifix.io/v1";
   784|
   785|async function authenticate(
   786|  walletAddress: string,
   787|  signMessage: (message: string) => Promise<string>
   788|): Promise<string> {
   789|  // Step 1: Get nonce
   790|  const nonceRes = await fetch(`${API_BASE}/auth/nonce`);
   791|  const { nonce } = await nonceRes.json();
   792|
   793|  // Step 2: Create SIWE message
   794|  const message = `app.sifix.io wants you to sign in with your Ethereum account:\n` +
   795|    `${walletAddress}\n\n` +
   796|    `Sign in to SIFIX Dashboard\n\n` +
   797|    `URI: https://app.sifix.io\n` +
   798|    `Version: 1\n` +
   799|    `Chain ID: 16602\n` +
   800|    `Nonce: ${nonce}\n` +
   801|    `Issued At: ${new Date().toISOString()}`;
   802|
   803|  // Step 3: Sign the message
   804|  const signature = await signMessage(message);
   805|
   806|  // Step 4: Verify and get JWT
   807|  const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
   808|    method: "POST",
   809|    headers: { "Content-Type": "application/json" },
   810|    body: JSON.stringify({ message, signature }),
   811|  });
   812|
   813|  const { token } = await verifyRes.json();
   814|  return token;
   815|}
   816|
   817|// Helper for authenticated requests
   818|function authHeaders(token: string) {
   819|  return {
   820|    Authorization: `Bearer ${token}`,
   821|    "Content-Type": "application/json",
   822|  };
   823|}
   824|```
   825|
   826|### Scan an Address
   827|
   828|```typescript
   829|// dashboard-scan.ts
   830|async function scanAddress(token: string, address: string) {
   831|  const response = await fetch(`${API_BASE}/scan/${address}`, {
   832|    headers: authHeaders(token),
   833|  });
   834|
   835|  const data = await response.json();
   836|  console.log("Address:", data.address);
   837|  console.log("Risk Score:", data.riskScore);
   838|  console.log("Labels:", data.labels.join(", "));
   839|  console.log("First Seen:", data.firstSeen);
   840|
   841|  return data;
   842|}
   843|```
   844|
   845|### Manage Tags
   846|
   847|```typescript
   848|// dashboard-tags.ts
   849|// Get all tags for the authenticated user
   850|async function getTags(token: string) {
   851|  const response = await fetch(`${API_BASE}/tags`, {
   852|    headers: authHeaders(token),
   853|  });
   854|  return response.json();
   855|}
   856|
   857|// Create a new tag
   858|async function createTag(token: string, name: string, color: string) {
   859|  const response = await fetch(`${API_BASE}/tags`, {
   860|    method: "POST",
   861|    headers: authHeaders(token),
   862|    body: JSON.stringify({ name, color }),
   863|  });
   864|  return response.json();
   865|}
   866|
   867|// Tag an address
   868|async function tagAddress(
   869|  token: string,
   870|  address: string,
   871|  tagId: string
   872|) {
   873|  const response = await fetch(`${API_BASE}/tags/${tagId}/addresses`, {
   874|    method: "POST",
   875|    headers: authHeaders(token),
   876|    body: JSON.stringify({ address }),
   877|  });
   878|  return response.json();
   879|}
   880|```
   881|
   882|### Watchlist Operations
   883|
   884|```typescript
   885|// dashboard-watchlist.ts
   886|// Get watchlist
   887|async function getWatchlist(token: string) {
   888|  const response = await fetch(`${API_BASE}/watchlist`, {
   889|    headers: authHeaders(token),
   890|  });
   891|  return response.json();
   892|}
   893|
   894|// Add address to watchlist
   895|async function addToWatchlist(
   896|  token: string,
   897|  address: string,
   898|  alias?: string,
   899|  alertThreshold: number = 60
   900|) {
   901|  const response = await fetch(`${API_BASE}/watchlist`, {
   902|    method: "POST",
   903|    headers: authHeaders(token),
   904|    body: JSON.stringify({ address, alias, alertThreshold }),
   905|  });
   906|  return response.json();
   907|}
   908|
   909|// Remove from watchlist
   910|async function removeFromWatchlist(token: string, address: string) {
   911|  await fetch(`${API_BASE}/watchlist/${address}`, {
   912|    method: "DELETE",
   913|    headers: authHeaders(token),
   914|  });
   915|}
   916|
   917|// Check watchlist status
   918|async function checkWatchlist(token: string, address: string) {
   919|  const response = await fetch(`${API_BASE}/watchlist/${address}`, {
   920|    headers: authHeaders(token),
   921|  });
   922|
   923|  if (response.status === 404) return null;
   924|  return response.json();
   925|}
   926|```
   927|
   928|### Domain Check (Public — No Auth)
   929|
   930|```typescript
   931|// domain-check.ts
   932|async function checkDomain(domain: string) {
   933|  // This endpoint is public — no authentication required
   934|  const response = await fetch(
   935|    `${API_BASE}/check-domain?domain=${encodeURIComponent(domain)}`
   936|  );
   937|
   938|  const data = await response.json();
   939|  return {
   940|    domain: data.domain,
   941|    isScam: data.isScam,
   942|    category: data.category,
   943|    reportedCount: data.reportedCount,
   944|    firstReported: data.firstReported,
   945|  };
   946|}
   947|
   948|// Usage
   949|const result = await checkDomain("suspicious-dapp.com");
   950|if (result.isScam) {
   951|  console.log(`🚨 ${result.domain} is flagged as ${result.category} (${result.reportedCount} reports)`);
   952|}
   953|```
   954|
   955|---
   956|
   957|## Extension Content Script Integration
   958|
   959|The SIFIX Chrome Extension uses content scripts to intercept wallet transactions in real-time. Here's the pattern for integrating with the extension's message bus.
   960|
   961|### Message Types
   962|
   963|```typescript
   964|// types.ts — Content script message types
   965|type ExtensionMessage =
   966|  | { type: "ANALYZE_TX"; payload: { from: string; to: string; data?: string; value?: string } }
   967|  | { type: "ANALYSIS_RESULT"; payload: any }
   968|  | { type: "CHECK_DOMAIN"; payload: { domain: string } }
   969|  | { type: "DOMAIN_RESULT"; payload: { domain: string; isScam: boolean; category?: string } }
   970|  | { type: "GET_STATUS"; payload: {} }
   971|  | { type: "STATUS"; payload: { active: boolean; address?: string } };
   972|```
   973|
   974|### Content Script — Transaction Interception
   975|
   976|```typescript
   977|// content-tx-interceptor.ts
   978|// This runs in MAIN world to access window.ethereum
   979|
   980|(function () {
   981|  const originalRequest = window.ethereum?.request;
   982|
   983|  if (!originalRequest) return;
   984|
   985|  window.ethereum.request = async function (args: any) {
   986|    // Intercept eth_sendTransaction
   987|    if (args.method === "eth_sendTransaction" && args.params?.[0]) {
   988|      const tx = args.params[0];
   989|
   990|      // Forward to background service worker for analysis
   991|      const analysis = await chrome.runtime.sendMessage({
   992|        type: "ANALYZE_TX",
   993|        payload: {
   994|          from: tx.from,
   995|          to: tx.to,
   996|          data: tx.data,
   997|          value: tx.value,
   998|        },
   999|      });
  1000|
  1001|      // Check if transaction should be blocked
  1002|      if (analysis.analysis.recommendation === "block") {
  1003|        const error = new Error(
  1004|          `SIFIX: Transaction blocked — risk score ${analysis.analysis.riskScore}/100. ` +
  1005|          `${analysis.analysis.reasoning}`
  1006|        );
  1007|        (error as any).code = 4001; // User rejected
  1008|        throw error;
  1009|      }
  1010|
  1011|      // Warn but allow user to proceed
  1012|      if (analysis.analysis.recommendation === "warn") {
  1013|        const proceed = confirm(
  1014|          `⚠️ SIFIX Warning (Risk: ${analysis.analysis.riskScore}/100)\n\n` +
  1015|          `${analysis.analysis.reasoning}\n\n` +
  1016|          `Proceed anyway?`
  1017|        );
  1018|        if (!proceed) {
  1019|          const error = new Error("SIFIX: User declined warned transaction");
  1020|          (error as any).code = 4001;
  1021|          throw error;
  1022|        }
  1023|      }
  1024|    }
  1025|
  1026|    // Pass through to original provider
  1027|    return originalRequest.call(window.ethereum, args);
  1028|  };
  1029|})();
  1030|```
  1031|
  1032|### Background Service Worker — Analysis Handler
  1033|
  1034|```typescript
  1035|// background-analysis.ts
  1036|// Service worker that receives intercepted transactions and runs analysis
  1037|
  1038|import { SecurityAgent } from "@sifix/agent";
  1039|
  1040|let agent: SecurityAgent | null = null;
  1041|
  1042|async function getAgent(): Promise<SecurityAgent> {
  1043|  if (!agent) {
  1044|    agent = new SecurityAgent({
  1045|      network: {
  1046|        chainId: 16602,
  1047|        rpcUrl: "https://evmrpc-testnet.0g.ai",
  1048|        name: "0G Galileo Testnet",
  1049|      },
  1050|      aiProvider: {
  1051|        apiKey: (await getStoredApiKey()) || "",
  1052|        baseUrl: (await getStoredBaseUrl()) || undefined,
  1053|        model: (await getStoredModel()) || "gpt-4o",
  1054|      },
  1055|      storage: { mockMode: true }, // Extension uses mock mode
  1056|      identity: {
  1057|        contract: "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F",
  1058|        tokenId: 99,
  1059|      },
  1060|    });
  1061|    await agent.init();
  1062|  }
  1063|  return agent;
  1064|}
  1065|
  1066|chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  1067|  if (message.type === "ANALYZE_TX") {
  1068|    // Use async handler — return true to keep message channel open
  1069|    handleAnalysis(message.payload)
  1070|      .then(sendResponse)
  1071|      .catch((error) => {
  1072|        sendResponse({ error: error.message });
  1073|      });
  1074|    return true; // Keep channel open for async response
  1075|  }
  1076|
  1077|  if (message.type === "CHECK_DOMAIN") {
  1078|    handleDomainCheck(message.payload.domain)
  1079|      .then(sendResponse)
  1080|      .catch((error) => {
  1081|        sendResponse({ error: error.message });
  1082|      });
  1083|    return true;
  1084|  }
  1085|});
  1086|
  1087|async function handleAnalysis(tx: any) {
  1088|  const agent = await getAgent();
  1089|  const result = await agent.analyzeTransaction(tx);
  1090|
  1091|  // Update extension badge with risk level
  1092|  const score = result.analysis.riskScore;
  1093|  const badgeText = score > 60 ? "!" : score > 20 ? "?" : "";
  1094|  const badgeColor =
  1095|    score > 80 ? "#FF0000" :
  1096|    score > 60 ? "#FF8800" :
  1097|    score > 40 ? "#FFCC00" :
  1098|    "#00CC00";
  1099|
  1100|  chrome.action.setBadgeText({ text: badgeText });
  1101|  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  1102|
  1103|  return result;
  1104|}
  1105|
  1106|async function handleDomainCheck(domain: string) {
  1107|  const response = await fetch(
  1108|    `https://api.sifix.io/v1/check-domain?domain=${encodeURIComponent(domain)}`
  1109|  );
  1110|  return response.json();
  1111|}
  1112|
  1113|// Helper: read stored configuration from extension storage
  1114|async function getStoredApiKey(): Promise<string | undefined> {
  1115|  const result = await chrome.storage.local.get("apiKey");
  1116|  return result.apiKey;
  1117|}
  1118|
  1119|async function getStoredBaseUrl(): Promise<string | undefined> {
  1120|  const result = await chrome.storage.local.get("baseUrl");
  1121|  return result.baseUrl;
  1122|}
  1123|
  1124|async function getStoredModel(): Promise<string | undefined> {
  1125|  const result = await chrome.storage.local.get("model");
  1126|  return result.model;
  1127|}
  1128|```
  1129|
  1130|### Popup — Display Analysis Results
  1131|
  1132|```typescript
  1133|// popup-analysis.ts
  1134|// Render analysis results in the extension popup (340×440)
  1135|
  1136|function renderAnalysis(result: any, container: HTMLElement) {
  1137|  const { riskScore, recommendation, reasoning, threats, confidence } = result.analysis;
  1138|
  1139|  // Risk tier color
  1140|  const tier =
  1141|    riskScore <= 20 ? { label: "SAFE", color: "#22C55E", icon: "✅" } :
  1142|    riskScore <= 40 ? { label: "LOW", color: "#86EFAC", icon: "🟢" } :
  1143|    riskScore <= 60 ? { label: "MEDIUM", color: "#FDE047", icon: "🟡" } :
  1144|    riskScore <= 80 ? { label: "HIGH", color: "#FB923C", icon: "🟠" } :
  1145|    { label: "CRITICAL", color: "#EF4444", icon: "🔴" };
  1146|
  1147|  container.innerHTML = `
  1148|    <div style="text-align: center; padding: 16px;">
  1149|      <div style="font-size: 48px;">${tier.icon}</div>
  1150|      <div style="font-size: 24px; font-weight: bold; color: ${tier.color};">
  1151|        ${tier.label}
  1152|      </div>
  1153|      <div style="font-size: 14px; color: #888;">
  1154|        Risk Score: ${riskScore}/100 · Confidence: ${(confidence * 100).toFixed(0)}%
  1155|      </div>
  1156|    </div>
  1157|    <div style="padding: 0 16px;">
  1158|      <p style="font-size: 13px; line-height: 1.5;">${reasoning}</p>
  1159|      ${
  1160|        threats.length > 0
  1161|          ? `<div style="margin-top: 12px;">
  1162|              <strong>Threats (${threats.length}):</strong>
  1163|              ${threats
  1164|                .map(
  1165|                  (t: any) =>
  1166|                    `<div style="margin: 4px 0; padding: 8px; background: #1a1a2e; border-radius: 6px;">
  1167|                      <span style="color: ${severityColor(t.severity)}; font-weight: bold;">${t.severity.toUpperCase()}</span>
  1168|                      <span style="color: #ccc;"> ${t.type}</span>
  1169|                      <div style="font-size: 11px; color: #888;">${t.description}</div>
  1170|                    </div>`
  1171|                )
  1172|                .join("")}
  1173|            </div>`
  1174|          : ""
  1175|      }
  1176|      ${
  1177|        result.storageRootHash
  1178|          ? `<div style="margin-top: 12px; font-size: 11px; color: #888;">
  1179|              📦 Evidence: <code>${result.storageRootHash.slice(0, 20)}...</code>
  1180|            </div>`
  1181|          : ""
  1182|      }
  1183|    </div>
  1184|  `;
  1185|}
  1186|
  1187|function severityColor(severity: string): string {
  1188|  switch (severity) {
  1189|    case "critical": return "#EF4444";
  1190|    case "high": return "#FB923C";
  1191|    case "medium": return "#FDE047";
  1192|    case "low": return "#86EFAC";
  1193|    default: return "#888";
  1194|  }
  1195|}
  1196|```
  1197|
  1198|---
  1199|
  1200|## Related
  1201|
  1202|- **[Basic Analysis](./basic-analysis)** — Start with simple transaction analysis
  1203|- **[AI Providers](./ai-providers)** — Configure AI backends
  1204|- **[Storage](./storage)** — Store and retrieve analysis evidence
  1205|- **[REST API](../api-reference/rest-api)** — Full Dashboard API reference (endpoints)
  1206|- **[Extension API](../api-reference/extension-api)** — Chrome extension message protocol
  1207|- **[Chrome Extension](../product/extension)** — Extension architecture and content scripts
  1208|- **[Agent SDK](../api-reference/agent-sdk)** — Complete SDK reference
  1209|