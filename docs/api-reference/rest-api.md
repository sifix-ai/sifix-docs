     1|---
     2|title: "REST API"
     3|description: "Complete reference for the SIFIX dApp REST API — endpoints across 11 domains for scanning, analysis, threats, reports, tags, watchlist, scam domains, auth, system, storage, and identity on 0G Galileo Testnet."
     4|---
     5|
     6|# REST API
     7|
     8|The SIFIX dApp exposes **36 REST endpoints** organized across core security domains. These endpoints power the dashboard, Chrome extension, analytics review loop, and all programmatic interactions with the SIFIX security platform on **0G Galileo Testnet**.
     9|
    10|---
    11|
    12|## Base URL & Authentication
    13|
    14|**Base URL:**
    15|
    16|```
    17|https://api.sifix.io/v1
    18|```
    19|
    20|**Authentication:**
    21|
    22|Most endpoints require a JWT token obtained via the [Auth](#auth) flow (SIWE — Sign-In with Ethereum). Include it in the `Authorization` header:
    23|
    24|```typescript
    25|const headers = {
    26|  Authorization: `Bearer ${token}`,
    27|  "Content-Type": "application/json",
    28|};
    29|```
    30|
    31|Public endpoints (no auth required): `GET /health`, `GET /check-domain`
    32|
    33|---
    34|
    35|## Scanning
    36|
    37|### `GET /check-domain`
    38|
    39|Check whether a domain is flagged as a known scam. **Public endpoint — no authentication required.**
    40|
    41|**Query Parameters:**
    42|
    43|- `domain` **`string`** — The domain to check (required)
    44|
    45|```typescript
    46|const response = await fetch(
    47|  "https://api.sifix.io/v1/check-domain?domain=evil-phishing.com"
    48|);
    49|
    50|const data = await response.json();
    51|// {
    52|//   domain: "evil-phishing.com",
    53|//   isScam: true,
    54|//   category: "phishing",
    55|//   reportedCount: 47,
    56|//   firstReported: "2025-11-02T14:30:00Z"
    57|// }
    58|```
    59|
    60|---
    61|
    62|### `GET /scan/:address`
    63|
    64|Retrieve a cached scan result for an address. If no cached result exists, triggers a new scan.
    65|
    66|**Path Parameters:**
    67|
    68|- `address` **`string`** — EVM address to scan
    69|
    70|```typescript
    71|const response = await fetch(
    72|  "https://api.sifix.io/v1/scan/0x1234567890abcdef1234567890abcdef12345678",
    73|  { headers }
    74|);
    75|
    76|const data = await response.json();
    77|// {
    78|//   address: "0x1234567890abcdef...",
    79|//   riskScore: 82,
    80|//   labels: ["phishing", "drainer"],
    81|//   scannedAt: "2026-05-09T10:00:00Z",
    82|//   threats: [
    83|//     { type: "phishing", severity: "high", description: "..." }
    84|//   ]
    85|// }
    86|```
    87|
    88|---
    89|
    90|### `POST /scan`
    91|
    92|Submit a new scan request for one or more addresses.
    93|
    94|**Request Body:**
    95|
    96|- `addresses` **`string[]`** — Array of EVM addresses to scan
    97|- `options` **`object`** *(optional)*
    98|  - `deepScan` **`boolean`** — Enable extended analysis (default: `false`)
    99|  - `includeStorage` **`boolean`** — Persist result on 0G Storage (default: `false`)
   100|
   101|```typescript
   102|const response = await fetch("https://api.sifix.io/v1/scan", {
   103|  method: "POST",
   104|  headers,
   105|  body: JSON.stringify({
   106|    addresses: [
   107|      "0x1234567890abcdef1234567890abcdef12345678",
   108|      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
   109|    ],
   110|    options: {
   111|      deepScan: true,
   112|      includeStorage: true,
   113|    },
   114|  }),
   115|});
   116|
   117|const data = await response.json();
   118|// {
   119|//   scanId: "scan_abc123",
   120|//   status: "processing",
   121|//   results: [
   122|//     { address: "0x1234...", riskScore: 82, status: "complete" },
   123|//     { address: "0xabcd...", riskScore: 12, status: "complete" }
   124|//   ],
   125|//   estimatedTime: "30s"
   126|// }
   127|```
   128|
   129|---
   130|
   131|## Analysis
   132|
   133|### `POST /analyze`
   134|
   135|Perform a full AI-powered security analysis on a transaction or contract interaction. Runs simulation, threat intelligence lookup, and AI risk assessment.
   136|
   137|**Request Body:**
   138|
   139|- `from` **`string`** — Sender address
   140|- `to` **`string`** — Target address
   141|- `data` **`string | null`** — Transaction calldata
   142|- `value` **`string | null`** — ETH value in wei
   143|- `options` **`object`** *(optional)*
   144|  - `provider` **`"galileo" | "openai"`** — Preferred AI provider
   145|  - `simulate` **`boolean`** — Run simulation (default: `true`)
   146|
   147|```typescript
   148|const response = await fetch("https://api.sifix.io/v1/analyze", {
   149|  method: "POST",
   150|  headers,
   151|  body: JSON.stringify({
   152|    from: "0xSender...",
   153|    to: "0xRecipient...",
   154|    data: "0xa9059cbb...",
   155|    value: "1000000000000000000",
   156|    options: {
   157|      provider: "galileo",
   158|      simulate: true,
   159|    },
   160|  }),
   161|});
   162|
   163|const data = await response.json();
   164|// {
   165|//   simulation: { success: true, gasUsed: 52341, ... },
   166|//   threatIntel: {
   167|//     fromAddress: null,
   168|//     toAddress: { riskScore: 72, labels: ["drainer"] },
   169|//     relatedScamDomains: [],
   170|//     knownExploitSignatures: []
   171|//   },
   172|//   analysis: {
   173|//     riskScore: 15,
   174|//     confidence: 0.92,
   175|//     reasoning: "Standard ERC-20 transfer to a verified address...",
   176|//     threats: [],
   177|//     recommendation: "allow",
   178|//     provider: "galileo"
   179|//   },
   180|//   timestamp: "2026-05-09T12:00:00Z",
   181|//   storageRootHash: "0xdef456...",
   182|//   computeProvider: "galileo"
   183|// }
   184|```
   185|
   186|---
   187|
   188|### `POST /extension/analyze`
   189|
   190|Analysis endpoint optimized for the browser extension. Accepts a lighter payload and returns a streamlined response suitable for popup and overlay UIs.
   191|
   192|**Request Body:**
   193|
   194|- `url` **`string`** — The page URL where the interaction originates
   195|- `transaction` **`object`** — Transaction parameters (`from`, `to`, `data`, `value`)
   196|- `userAddress` **`string`** — The connected wallet address
   197|
   198|```typescript
   199|const response = await fetch("https://api.sifix.io/v1/extension/analyze", {
   200|  method: "POST",
   201|  headers,
   202|  body: JSON.stringify({
   203|    url: "https://app.uniswap.org",
   204|    transaction: {
   205|      from: "0xUser...",
   206|      to: "0xRouter...",
   207|      data: "0x38ed1739...",
   208|      value: "0",
   209|    },
   210|    userAddress: "0xUser...",
   211|  }),
   212|});
   213|
   214|const data = await response.json();
   215|// {
   216|//   riskScore: 5,
   217|//   recommendation: "allow",
   218|//   summary: "Uniswap V3 token swap — no threats detected.",
   219|//   details: {
   220|//     simulation: { success: true, gasUsed: 184200 },
   221|//     threats: [],
   222|//     provider: "galileo"
   223|//   }
   224|// }
   225|```
   226|
   227|---
   228|
   229|## Threats
   230|
   231|### `POST /threats/:id/publish`
   232|
   233|Prepare onchain publish payload for a threat report. User signs and sends transaction from wallet (user pays gas). Authenticated endpoint.
   234|
   235|**Headers:**
   236|- `Authorization: Bearer <JWT>`
   237|
   238|**Path Parameters:**
   239|- `id` **`string`** — Threat report ID
   240|
   241|**Response fields (key):**
   242|- `localStatus` (`DRAFT_LOCAL`/`PUBLISHING`/`SYNCED_ONCHAIN`/`PUBLISH_FAILED`)
   243|- `onchainStatus` (`NONE`/`SUBMITTED`/`CONFIRMED`)
   244|- `txRequest` (contract call data for wallet)
   245|
   246|---
   247|
   248|### `POST /threats/:id/vote/publish`
   249|
   250|Prepare onchain vote publish payload. User signs/sends from wallet. Authenticated endpoint.
   251|
   252|**Headers:**
   253|- `Authorization: Bearer <JWT>`
   254|
   255|**Path Parameters:**
   256|- `id` **`string`** — Threat report ID
   257|
   258|---
   259|
   260|### Legacy relay endpoints
   261|
   262|`/threats/:id/relay` and `/threats/:id/vote/relay` are legacy sponsor-gas paths. Default production flow uses user-published transactions.
   263|
   264|### `GET /threats`
   265|
   266|
   267|Retrieve a paginated list of known threats.
   268|
   269|**Query Parameters:**
   270|
   271|- `page` **`number`** — Page number (default: `1`)
   272|- `limit` **`number`** — Results per page (default: `20`, max: `100`)
   273|- `category` **`string`** *(optional)* — Filter by category (`phishing`, `drainer`, `mixer`, `honeypot`, `rug-pull`)
   274|- `severity` **`string`** *(optional)* — Filter by severity (`low`, `medium`, `high`, `critical`)
   275|
   276|```typescript
   277|const response = await fetch(
   278|  "https://api.sifix.io/v1/threats?category=phishing&limit=10",
   279|  { headers }
   280|);
   281|
   282|const data = await response.json();
   283|// {
   284|//   threats: [
   285|//     {
   286|//       id: "threat_001",
   287|//       type: "phishing",
   288|//       severity: "high",
   289|//       address: "0xBadActor...",
   290|//       description: "Wallet drainer targeting DeFi users",
   291|//       firstSeen: "2025-11-15T...",
   292|//       reports: 23
   293|//     },
   294|//     ...
   295|//   ],
   296|//   pagination: { page: 1, limit: 10, total: 1423 }
   297|// }
   298|```
   299|
   300|---
   301|
   302|### `POST /threats/report`
   303|
   304|Submit a new threat report. Requires authentication.
   305|
   306|**Request Body:**
   307|
   308|- `address` **`string`** — The malicious address
   309|- `category` **`string`** — Threat category (`phishing`, `drainer`, `mixer`, `honeypot`, `rug-pull`, `other`)
   310|- `description` **`string`** — Human-readable description
   311|- `evidence` **`string[]`** *(optional)* — URLs or transaction hashes as evidence
   312|- `domain` **`string | null`** *(optional)* — Associated scam domain
   313|
   314|```typescript
   315|const response = await fetch("https://api.sifix.io/v1/threats/report", {
   316|  method: "POST",
   317|  headers,
   318|  body: JSON.stringify({
   319|    address: "0xBadActor...",
   320|    category: "drainer",
   321|    description: "Wallet drainer contract targeting NFT holders",
   322|    evidence: [
   323|      "https://chainscan-galileo.0g.ai/tx/0xAbCd...",
   324|    ],
   325|    domain: "nft-claim-now.xyz",
   326|  }),
   327|});
   328|
   329|const data = await response.json();
   330|// { reportId: "rpt_xyz789", status: "submitted" }
   331|```
   332|
   333|---
   334|
   335|## Reports
   336|
   337|### `GET /reports`
   338|
   339|List all reports created by the authenticated user.
   340|
   341|**Query Parameters:**
   342|
   343|- `status` **`string`** *(optional)* — Filter by status (`pending`, `confirmed`, `rejected`)
   344|- `page` **`number`** — Page number (default: `1`)
   345|- `limit` **`number`** — Results per page (default: `20`)
   346|
   347|```typescript
   348|const response = await fetch(
   349|  "https://api.sifix.io/v1/reports?status=confirmed&limit=10",
   350|  { headers }
   351|);
   352|
   353|const data = await response.json();
   354|// {
   355|//   reports: [
   356|//     {
   357|//       id: "rpt_001",
   358|//       address: "0xBadAddr...",
   359|//       title: "Phishing contract",
   360|//       status: "confirmed",
   361|//       severity: "high",
   362|//       createdAt: "2026-04-20T...",
   363|//       votes: { up: 34, down: 1 }
   364|//     },
   365|//     ...
   366|//   ],
   367|//   pagination: { page: 1, limit: 10, total: 56 }
   368|// }
   369|```
   370|
   371|---
   372|
   373|### `POST /reports`
   374|
   375|Create a new report for a suspicious address or contract.
   376|
   377|**Request Body:**
   378|
   379|- `address` **`string`** — Target address
   380|- `title` **`string`** — Report title
   381|- `description` **`string`** — Detailed description
   382|- `tags` **`string[]`** *(optional)* — Tags for categorization
   383|- `severity` **`string`** — Severity level (`low`, `medium`, `high`, `critical`)
   384|
   385|```typescript
   386|const response = await fetch("https://api.sifix.io/v1/reports", {
   387|  method: "POST",
   388|  headers,
   389|  body: JSON.stringify({
   390|    address: "0xSuspicious...",
   391|    title: "Ponzi scheme contract",
   392|    description: "This contract exhibits characteristics of a Ponzi scheme with guaranteed returns...",
   393|    tags: ["ponzi", "fraud"],
   394|    severity: "critical",
   395|  }),
   396|});
   397|
   398|const data = await response.json();
   399|// { id: "rpt_abc456", status: "pending", createdAt: "2026-05-09T..." }
   400|```
   401|
   402|---
   403|
   404|### `POST /reports/:id/vote`
   405|
   406|Vote on a report's validity. Requires authentication.
   407|
   408|**Path Parameters:**
   409|
   410|- `id` **`string`** — Report ID
   411|
   412|**Request Body:**
   413|
   414|- `vote` **`"up" | "down"`** — Vote direction
   415|- `reason` **`string`** *(optional)* — Justification for the vote
   416|
   417|```typescript
   418|const response = await fetch("https://api.sifix.io/v1/reports/rpt_abc456/vote", {
   419|  method: "POST",
   420|  headers,
   421|  body: JSON.stringify({
   422|    vote: "up",
   423|    reason: "Confirmed — this contract drained my wallet.",
   424|  }),
   425|});
   426|
   427|const data = await response.json();
   428|// { reportId: "rpt_abc456", votes: { up: 12, down: 1 }, userVote: "up" }
   429|```
   430|
   431|---
   432|
   433|## Tags
   434|
   435|### `GET /address-tags`
   436|
   437|Retrieve a paginated list of address tags across the platform.
   438|
   439|**Query Parameters:**
   440|
   441|- `page` **`number`** — Page number (default: `1`)
   442|- `limit` **`number`** — Results per page (default: `20`)
   443|- `tag` **`string`** *(optional)* — Filter by tag name
   444|
   445|```typescript
   446|const response = await fetch(
   447|  "https://api.sifix.io/v1/address-tags?tag=drainer&limit=50",
   448|  { headers }
   449|);
   450|
   451|const data = await response.json();
   452|// {
   453|//   tags: [
   454|//     {
   455|//       id: "tag_001",
   456|//       address: "0xBadAddr...",
   457|//       tag: "drainer",
   458|//       addedBy: "0xReporter...",
   459|//       createdAt: "2026-03-15T..."
   460|//     },
   461|//     ...
   462|//   ],
   463|//   pagination: { page: 1, limit: 50, total: 230 }
   464|// }
   465|```
   466|
   467|---
   468|
   469|### `POST /address-tags`
   470|
   471|Tag an address with a label. Requires authentication.
   472|
   473|**Request Body:**
   474|
   475|- `address` **`string`** — EVM address to tag
   476|- `tag` **`string`** — Label to apply
   477|- `description` **`string`** *(optional)* — Reason for the tag
   478|
   479|```typescript
   480|const response = await fetch("https://api.sifix.io/v1/address-tags", {
   481|  method: "POST",
   482|  headers,
   483|  body: JSON.stringify({
   484|    address: "0xBadAddr...",
   485|    tag: "phishing",
   486|    description: "Known phishing operator — targets DeFi users",
   487|  }),
   488|});
   489|
   490|const data = await response.json();
   491|// { id: "tag_001", address: "0xBadAddr...", tag: "phishing", createdAt: "..." }
   492|```
   493|
   494|---
   495|
   496|### `GET /address/:address/tags`
   497|
   498|Retrieve all tags for a specific address.
   499|
   500|**Path Parameters:**
   501|
   502|- `address` **`string`** — EVM address
   503|
   504|```typescript
   505|const response = await fetch(
   506|  "https://api.sifix.io/v1/address/0xBadAddr.../tags",
   507|  { headers }
   508|);
   509|
   510|const data = await response.json();
   511|// {
   512|//   address: "0xBadAddr...",
   513|//   tags: [
   514|//     { tag: "phishing", votes: { up: 34, down: 2 }, status: "confirmed" },
   515|//     { tag: "drainer", votes: { up: 18, down: 1 }, status: "confirmed" }
   516|//   ]
   517|// }
   518|```
   519|
   520|---
   521|
   522|## Watchlist
   523|
   524|### `GET /watchlist`
   525|
   526|Retrieve the authenticated user's watchlist of monitored addresses.
   527|
   528|```typescript
   529|const response = await fetch("https://api.sifix.io/v1/watchlist", {
   530|  headers,
   531|});
   532|
   533|const data = await response.json();
   534|// {
   535|//   watchlist: [
   536|//     {
   537|//       id: "wl_001",
   538|//       address: "0xMonitored...",
   539|//       label: "Suspicious whale",
   540|//       addedAt: "2026-04-15T08:30:00Z",
   541|//       lastActivity: "2026-05-09T14:22:00Z",
   542|//       riskScore: 45
   543|//     },
   544|//     ...
   545|//   ]
   546|// }
   547|```
   548|
   549|---
   550|
   551|### `POST /watchlist`
   552|
   553|Add an address to the authenticated user's watchlist.
   554|
   555|**Request Body:**
   556|
   557|- `address` **`string`** — EVM address to monitor
   558|- `label` **`string`** *(optional)* — A human-readable label
   559|
   560|```typescript
   561|const response = await fetch("https://api.sifix.io/v1/watchlist", {
   562|  method: "POST",
   563|  headers,
   564|  body: JSON.stringify({
   565|    address: "0xMonitored...",
   566|    label: "Suspicious whale",
   567|  }),
   568|});
   569|
   570|const data = await response.json();
   571|// { id: "wl_001", address: "0xMonitored...", label: "Suspicious whale", addedAt: "..." }
   572|```
   573|
   574|---
   575|
   576|### `DELETE /watchlist/:address`
   577|
   578|Remove an address from the authenticated user's watchlist.
   579|
   580|**Path Parameters:**
   581|
   582|- `address` **`string`** — EVM address to remove
   583|
   584|```typescript
   585|const response = await fetch(
   586|  "https://api.sifix.io/v1/watchlist/0xMonitored...",
   587|  {
   588|    method: "DELETE",
   589|    headers,
   590|  }
   591|);
   592|
   593|const data = await response.json();
   594|// { deleted: true, address: "0xMonitored..." }
   595|```
   596|
   597|---
   598|
   599|## Scam Domains
   600|
   601|### `GET /scam-domains`
   602|
   603|Retrieve a paginated list of known scam domains tracked by SIFIX.
   604|
   605|**Query Parameters:**
   606|
   607|- `page` **`number`** — Page number (default: `1`)
   608|- `limit` **`number`** — Results per page (default: `20`)
   609|- `category` **`string`** *(optional)* — Filter by category (`phishing`, `drainer`, `impersonation`, `fake-airdrop`)
   610|
   611|```typescript
   612|const response = await fetch(
   613|  "https://api.sifix.io/v1/scam-domains?category=phishing&limit=50",
   614|  { headers }
   615|);
   616|
   617|const data = await response.json();
   618|// {
   619|//   domains: [
   620|//     {
   621|//       domain: "evil-phishing.com",
   622|//       category: "phishing",
   623|//       status: "active",
   624|//       reports: 47,
   625|//       firstReported: "2025-11-02T..."
   626|//     },
   627|//     ...
   628|//   ],
   629|//   pagination: { page: 1, limit: 50, total: 8901 }
   630|// }
   631|```
   632|
   633|---
   634|
   635|### `GET /scam-domains/check`
   636|
   637|Quickly check whether a specific domain is flagged. Returns a lightweight response optimized for the extension's domain safety pipeline.
   638|
   639|**Query Parameters:**
   640|
   641|- `domain` **`string`** — Domain to check (required)
   642|
   643|```typescript
   644|const response = await fetch(
   645|  "https://api.sifix.io/v1/scam-domains/check?domain=suspicious-site.xyz",
   646|  { headers }
   647|);
   648|
   649|const data = await response.json();
   650|// { domain: "suspicious-site.xyz", isScam: true, category: "drainer", reports: 12 }
   651|```
   652|
   653|---
   654|
   655|### `GET /scam-domains/:domain`
   656|
   657|Retrieve detailed information about a specific scam domain, including associated addresses and targeted chains.
   658|
   659|**Path Parameters:**
   660|
   661|- `domain` **`string`** — The domain name
   662|
   663|```typescript
   664|const response = await fetch(
   665|  "https://api.sifix.io/v1/scam-domains/suspicious-site.xyz",
   666|  { headers }
   667|);
   668|
   669|const data = await response.json();
   670|// {
   671|//   domain: "suspicious-site.xyz",
   672|//   category: "drainer",
   673|//   status: "active",
   674|//   firstReported: "2025-12-01T...",
   675|//   lastReported: "2026-05-09T...",
   676|//   reports: 12,
   677|//   associatedAddresses: ["0xBad1...", "0xBad2..."],
   678|//   targetChains: ["ethereum", "polygon", "0g-galileo"]
   679|// }
   680|```
   681|
   682|---
   683|
   684|## Auth
   685|
   686|SIFIX uses a **SIWE (Sign-In with Ethereum)** flow for authentication. The client requests a nonce, signs it with their wallet, and verifies the signature to obtain a JWT.
   687|
   688|### `POST /auth/nonce`
   689|
   690|Request a unique nonce for wallet signing. **No authentication required.**
   691|
   692|**Request Body:**
   693|
   694|- `address` **`string`** — EVM address of the wallet
   695|
   696|```typescript
   697|const nonceResponse = await fetch("https://api.sifix.io/v1/auth/nonce", {
   698|  method: "POST",
   699|  headers: { "Content-Type": "application/json" },
   700|  body: JSON.stringify({ address: "0xYourWallet..." }),
   701|});
   702|
   703|const { nonce, message } = await nonceResponse.json();
   704|// {
   705|//   nonce: "a1b2c3d4e5f6",
   706|//   message: "sifix.io wants you to sign in with your Ethereum account:\n0xYourWallet...\n\nNonce: a1b2c3d4e5f6"
   707|// }
   708|```
   709|
   710|---
   711|
   712|### `POST /auth/verify`
   713|
   714|Verify a signed SIWE message and obtain a JWT token. **No authentication required.**
   715|
   716|**Request Body:**
   717|
   718|- `message` **`string`** — The SIWE message received from `/auth/nonce`
   719|- `signature` **`string`** — The signature produced by the wallet
   720|
   721|```typescript
   722|// Sign the message with ethers.js
   723|import { ethers } from "ethers";
   724|
   725|const signer = await wallet.getSigner();
   726|const signature = await signer.signMessage(message);
   727|
   728|const verifyResponse = await fetch("https://api.sifix.io/v1/auth/verify", {
   729|  method: "POST",
   730|  headers: { "Content-Type": "application/json" },
   731|  body: JSON.stringify({ message, signature }),
   732|});
   733|
   734|const { token, expiresAt } = await verifyResponse.json();
   735|// { token: "eyJhbGciOiJIUzI1NiIs...", expiresAt: "2026-05-10T12:00:00Z" }
   736|```
   737|
   738|The returned `token` should be included as `Authorization: Bearer <token>` in all subsequent authenticated requests. Tokens expire after **24 hours**.
   739|
   740|---
   741|
   742|### `GET /auth/verify-token`
   743|
   744|Validate an existing JWT token. Useful for checking token validity on app startup or after page refresh.
   745|
   746|```typescript
   747|const response = await fetch("https://api.sifix.io/v1/auth/verify-token", {
   748|  headers: { Authorization: `Bearer ${token}` },
   749|});
   750|
   751|const data = await response.json();
   752|// { valid: true, address: "0xYourWallet...", expiresAt: "2026-05-10T12:00:00Z" }
   753|```
   754|
   755|---
   756|
   757|## System
   758|
   759|### `GET /stats`
   760|
   761|Retrieve platform-wide statistics.
   762|
   763|```typescript
   764|const response = await fetch("https://api.sifix.io/v1/stats", { headers });
   765|
   766|const data = await response.json();
   767|// {
   768|//   totalScans: 1250342,
   769|//   totalThreats: 45231,
   770|//   totalReports: 8921,
   771|//   activeUsers: 12450,
   772|//   scamDomainsTracked: 8901,
   773|//   avgResponseTime: "1.2s"
   774|// }
   775|```
   776|
   777|---
   778|
   779|### `GET /leaderboard`
   780|
   781|Retrieve the contributor leaderboard. Rankings are based on verified reports, community votes, and activity.
   782|
   783|**Query Parameters:**
   784|
   785|- `period` **`string`** *(optional)* — `"daily"` | `"weekly"` | `"monthly"` | `"all"` (default: `"weekly"`)
   786|- `limit` **`number`** *(optional)* — Results to return (default: `25`)
   787|
   788|```typescript
   789|const response = await fetch(
   790|  "https://api.sifix.io/v1/leaderboard?period=monthly&limit=10",
   791|  { headers }
   792|);
   793|
   794|const data = await response.json();
   795|// {
   796|//   leaderboard: [
   797|//     { rank: 1, address: "0xTopHunter...", reports: 87, reputation: 4200 },
   798|//     { rank: 2, address: "0xSecExpert...", reports: 64, reputation: 3800 },
   799|//     ...
   800|//   ],
   801|//   period: "monthly",
   802|//   updatedAt: "2026-05-09T18:00:00Z"
   803|// }
   804|```
   805|
   806|---
   807|
   808|### `GET /history`
   809|
   810|Retrieve the authenticated user's activity history across scans, reports, and votes.
   811|
   812|**Query Parameters:**
   813|
   814|- `type` **`string`** *(optional)* — `"scan"` | `"report"` | `"vote"` | `"all"` (default: `"all"`)
   815|- `page` **`number`** — Page number (default: `1`)
   816|- `limit` **`number`** — Results per page (default: `20`)
   817|
   818|```typescript
   819|const response = await fetch(
   820|  "https://api.sifix.io/v1/history?type=scan&limit=10",
   821|  { headers }
   822|);
   823|
   824|const data = await response.json();
   825|// {
   826|//   history: [
   827|//     { id: "scan_abc123", type: "scan", address: "0x...", riskScore: 72, timestamp: "..." },
   828|//     ...
   829|//   ],
   830|//   pagination: { page: 1, limit: 10, total: 234 }
   831|// }
   832|```
   833|
   834|---
   835|
   836|### `GET /scan-history`
   837|
   838|Retrieve the authenticated user's scan history specifically (a focused version of `/history`).
   839|
   840|**Query Parameters:**
   841|
   842|- `page` **`number`** — Page number (default: `1`)
   843|- `limit` **`number`** — Results per page (default: `20`)
   844|
   845|```typescript
   846|const response = await fetch(
   847|  "https://api.sifix.io/v1/scan-history?limit=5",
   848|  { headers }
   849|);
   850|
   851|const data = await response.json();
   852|// {
   853|//   scans: [
   854|//     {
   855|//       id: "scan_abc123",
   856|//       address: "0xScanned...",
   857|//       riskScore: 72,
   858|//       timestamp: "2026-05-09T12:00:00Z"
   859|//     },
   860|//     ...
   861|//   ],
   862|//   pagination: { page: 1, limit: 5, total: 120 }
   863|// }
   864|```
   865|
   866|---
   867|
   868|## Settings
   869|
   870|### `GET /settings/ai-provider`
   871|
   872|Retrieve the current AI provider configuration for the authenticated user.
   873|
   874|```typescript
   875|const response = await fetch("https://api.sifix.io/v1/settings/ai-provider", {
   876|  headers,
   877|});
   878|
   879|const data = await response.json();
   880|// {
   881|//   provider: "galileo",
   882|//   fallback: "openai",
   883|//   model: "sifix-security-v1",
   884|//   availableProviders: ["galileo", "openai"]
   885|// }
   886|```
   887|
   888|---
   889|
   890|## Storage
   891|
   892|### `GET /storage/:hash/download`
   893|
   894|Download a previously stored on-chain analysis by its 0G Storage root hash.
   895|
   896|**Path Parameters:**
   897|
   898|- `hash` **`string`** — The storage root hash returned by `analyzeTransaction` or `storeAnalysis`
   899|
   900|```typescript
   901|const response = await fetch(
   902|  "https://api.sifix.io/v1/storage/0xdef456.../download",
   903|  { headers }
   904|);
   905|
   906|const data = await response.json();
   907|// {
   908|//   hash: "0xdef456...",
   909|//   analysis: {
   910|//     riskScore: 15,
   911|//     recommendation: "allow",
   912|//     reasoning: "Standard ERC-20 transfer...",
   913|//     threats: []
   914|//   },
   915|//   metadata: { analyzedBy: "0x...", version: "1.5.0" },
   916|//   storedAt: "2026-05-08T09:15:00Z"
   917|// }
   918|```
   919|
   920|---
   921|
   922|## Identity
   923|
   924|### `GET /agentic-id`
   925|
   926|Retrieve the agentic identity information for the authenticated user. Returns on-chain identity data, reputation score, and verifiable credentials linked to ERC-7857.
   927|
   928|```typescript
   929|const response = await fetch("https://api.sifix.io/v1/agentic-id", {
   930|  headers,
   931|});
   932|
   933|const data = await response.json();
   934|// {
   935|//   address: "0xYourWallet...",
   936|//   agenticId: "agent_xyz789",
   937|//   reputation: 4200,
   938|//   reportsSubmitted: 87,
   939|//   reportsConfirmed: 72,
   940|//   joinedAt: "2025-08-15T...",
   941|//   credentials: [
   942|//     { type: "ThreatHunter", level: 3, issuedAt: "2026-01-01T..." }
   943|//   ]
   944|// }
   945|```
   946|
   947|---
   948|
   949|## Health
   950|
   951|### `GET /health`
   952|
   953|Public endpoint to check API health and uptime status. **No authentication required.**
   954|
   955|```typescript
   956|const response = await fetch("https://api.sifix.io/v1/health");
   957|
   958|const data = await response.json();
   959|// {
   960|//   status: "ok",
   961|//   version: "1.5.0",
   962|//   uptime: 86400,
   963|//   services: {
   964|//     database: "ok",
   965|//     galileo: "ok",
   966|//     aiProvider: "ok",
   967|//     storage: "ok"
   968|//   },
   969|//   timestamp: "2026-05-09T18:06:00Z"
   970|// }
   971|```
   972|
   973|---
   974|
   975|## Error Handling
   976|
   977|All REST API endpoints follow a consistent error response format:
   978|
   979|```typescript
   980|interface ApiError {
   981|  error: {
   982|    code: string;        // e.g. "UNAUTHORIZED", "NOT_FOUND", "VALIDATION_ERROR"
   983|    message: string;     // Human-readable error description
   984|    details?: unknown;   // Additional context (e.g. validation errors)
   985|  };
   986|  statusCode: number;    // HTTP status code
   987|}
   988|```
   989|
   990|**Common error codes:**
   991|
   992|- **`400`** `VALIDATION_ERROR` — Missing or invalid parameters
   993|- **`401`** `UNAUTHORIZED` — Missing or invalid JWT
   994|- **`403`** `FORBIDDEN` — Insufficient permissions
   995|- **`404`** `NOT_FOUND` — Resource not found
   996|- **`409`** `CONFLICT` — Duplicate resource or state conflict
   997|- **`429`** `RATE_LIMITED` — Rate limit exceeded
   998|- **`500`** `INTERNAL_ERROR` — Internal server error
   999|- **`503`** `SERVICE_UNAVAILABLE` — AI provider or network issue
  1000|
  1001|```typescript
  1002|const response = await fetch("https://api.sifix.io/v1/scan/invalid-address", {
  1003|  headers,
  1004|});
  1005|
  1006|if (!response.ok) {
  1007|  const error: ApiError = await response.json();
  1008|  console.error(`[${error.statusCode}] ${error.error.code}: ${error.error.message}`);
  1009|}
  1010|```
  1011|
  1012|---
  1013|
  1014|## Rate Limits
  1015|
  1016|- **Free tier:** 30 requests/min · 1,000 requests/day
  1017|- **Pro tier:** 120 requests/min · 10,000 requests/day
  1018|- **Enterprise:** Custom limits
  1019|
  1020|Rate limit headers are included in every response:
  1021|
  1022|```
  1023|X-RateLimit-Limit: 30
  1024|X-RateLimit-Remaining: 27
  1025|X-RateLimit-Reset: 1715270400
  1026|```
  1027|
  1028|```typescript
  1029|const response = await fetch("https://api.sifix.io/v1/scan/0x...", { headers });
  1030|
  1031|const limit = response.headers.get("X-RateLimit-Limit");
  1032|const remaining = response.headers.get("X-RateLimit-Remaining");
  1033|const reset = response.headers.get("X-RateLimit-Reset");
  1034|
  1035|console.log(`${remaining}/${limit} requests remaining (resets at ${reset})`);
  1036|```
  1037|
  1038|---
  1039|
  1040|## Endpoint Summary
  1041|
  1042|All endpoints organized by domain:
  1043|
  1044|**Scanning (3)**
  1045|- `GET /check-domain` — Check domain scam status (public)
  1046|- `GET /scan/:address` — Get cached scan or trigger new scan
  1047|- `POST /scan` — Batch scan addresses
  1048|
  1049|**Analysis (2)**
  1050|- `POST /analyze` — Full AI security analysis
  1051|- `POST /extension/analyze` — Lightweight extension analysis
  1052|
  1053|**Threats (2)**
  1054|- `GET /threats` — List known threats
  1055|- `POST /threats/report` — Submit threat report
  1056|
  1057|**Reports (3)**
  1058|- `GET /reports` — List user reports
  1059|- `POST /reports` — Create report
  1060|- `POST /reports/:id/vote` — Vote on report
  1061|
  1062|**Tags (3)**
  1063|- `GET /address-tags` — List address tags
  1064|- `POST /address-tags` — Tag an address
  1065|- `GET /address/:address/tags` — Get tags for address
  1066|
  1067|**Watchlist (3)**
  1068|- `GET /watchlist` — List watched addresses
  1069|- `POST /watchlist` — Add to watchlist
  1070|- `DELETE /watchlist/:address` — Remove from watchlist
  1071|
  1072|**Scam Domains (3)**
  1073|- `GET /scam-domains` — List scam domains
  1074|- `GET /scam-domains/check` — Quick domain check
  1075|- `GET /scam-domains/:domain` — Domain details
  1076|
  1077|**Auth (3)**
  1078|- `POST /auth/nonce` — Request SIWE nonce (public)
  1079|- `POST /auth/verify` — Verify signature, get JWT (public)
  1080|- `GET /auth/verify-token` — Validate existing JWT
  1081|
  1082|**System (4)**
  1083|- `GET /stats` — Platform statistics
  1084|- `GET /leaderboard` — Contributor rankings
  1085|- `GET /history` — User activity history
  1086|- `GET /scan-history` — User scan history
  1087|
  1088|**Settings (1)**
  1089|- `GET /settings/ai-provider` — AI provider config
  1090|
  1091|**Storage (1)**
  1092|- `GET /storage/:hash/download` — Download on-chain analysis
  1093|
  1094|**Identity (1)**
  1095|- `GET /agentic-id` — User agentic identity
  1096|
  1097|**Health (1)**
  1098|- `GET /health` — API health check (public)
  1099|
  1100|---
  1101|
  1102|## Related
  1103|
  1104|- [@sifix/agent SDK](./agent-sdk) — TypeScript SDK for programmatic access
  1105|- [Extension API](./extension-api) — Chrome extension message API
  1106|- [0G Storage API](./0g-storage-api) — 0G Storage integration details
  1107|