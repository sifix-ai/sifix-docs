     1|---
     2|title: "Dashboard"
     3|description: "SIFIX dApp dashboard — a Next.js 16 application with 12 pages for managing Web3 security"
     4|---
     5|
     6|# SIFIX Dashboard
     7|
     8|> **TL;DR** — A web app where you scan smart contracts, track threats, monitor your watchlist, and manage your AI security agent — all from one dark, glassmorphism-styled interface.
     9|
    10|The SIFIX Dashboard is the central command center for managing your Web3 security posture. Built with **Next.js 16**, it provides comprehensive tools for scanning, monitoring, and responding to threats across the Web3 ecosystem on **0G Galileo Testnet**.
    11|
    12|---
    13|
    14|## Architecture Overview
    15|
    16|```mermaid
    17|graph LR
    18|    LOGIN["SIWE Login"] --> OVERVIEW["Overview"]
    19|    OVERVIEW --> SCANNER["Scanner"]
    20|    OVERVIEW --> CHECKER["Checker"]
    21|    OVERVIEW --> THREATS["Threats"]
    22|
    23|    SCANNER --> REPORTS["Reports"]
    24|    CHECKER --> REPORTS
    25|    THREATS --> REPORTS
    26|
    27|    REPORTS --> TAGS["Tags"]
    28|    REPORTS --> WATCHLIST["Watchlist"]
    29|    REPORTS --> ANALYTICS["Analytics"]
    30|
    31|    ANALYTICS --> LEADERBOARD["Leaderboard"]
    32|    ANALYTICS --> HISTORY["History"]
    33|
    34|    SETTINGS["Settings"] -.->|"configures"| SCANNER
    35|    SETTINGS -.->|"configures"| CHECKER
    36|
    37|    AGENT["Agent"] -->|"autonomous"| SCANNER
    38|    AGENT -->|"autonomous"| THREATS
    39|```
    40|
    41|---
    42|
    43|## Design System
    44|
    45|The dashboard follows a consistent **glassmorphism** design language across all pages.
    46|
    47|### Color Palette
    48|
    49|| Token | Hex | Usage |
    50||-------|-----|-------|
    51|| **Background** | `#000000` | Pure black — all page backgrounds |
    52|| **Surface** | `rgba(255,255,255,0.05)` | Frosted glass panels |
    53|| **Border** | `rgba(255,255,255,0.1)` | Subtle glass borders |
    54|| **Accent Blue** | `#3b9eff` | Primary actions, links, highlights |
    55|| **Success** | `#22c55e` | Safe verdicts, positive metrics |
    56|| **Warning** | `#f59e0b` | Caution states, medium-risk items |
    57|| **Danger** | `#ef4444` | Critical threats, malicious domains |
    58|| **Text Primary** | `#ffffff` | Headings and body text |
    59|| **Text Secondary** | `#a1a1aa` | Muted labels and descriptions |
    60|
    61|### Typography
    62|
    63|- **Headings**: Playfair Display — elegant serif for page titles and section headers
    64|- **Body**: Inter — clean sans-serif for UI elements, data tables, and descriptions
    65|- **Code**: JetBrains Mono — monospace for addresses, hashes, and technical values
    66|
    67|### Glassmorphism Pattern
    68|
    69|All card and panel components use a consistent glass effect:
    70|
    71|- Semi-transparent background (`rgba(255,255,255,0.05)`)
    72|- Backdrop blur filter (`backdrop-filter: blur(12px)`)
    73|- Subtle white border (`1px solid rgba(255,255,255,0.1)`)
    74|- Soft box shadow (`0 8px 32px rgba(0,0,0,0.4)`)
    75|
    76|---
    77|
    78|## Pages
    79|
    80|Below is a brief, plain-English description of each of the dashboard pages:
    81|
    82|- **Overview** — Your security homepage at a glance: a score out of 100, active threat count, recent scans, and quick-action cards.
    83|- **Scanner** — The analysis workhorse. Paste a contract address, token, or domain and get a full security breakdown in seconds.
    84|- **Checker** — A pre-flight check for transactions. Paste raw calldata, simulate it on-chain, and see exactly what would happen *before* you sign.
    85|- **Threats** — A live feed of what's happening in Web3 right now: phishing campaigns, rug pulls, honeypots — filterable by severity.
    86|- **Reports** — Your library of past security reports. Search, filter, export to PDF, or verify on-chain evidence.
    87|- **Tags** — Color-coded labels you can slap on any address or contract (e.g. *suspicious*, *verified*, *personal*) for easy filtering later.
    88|- **Watchlist** — Proactive monitoring. Add addresses or domains and get alerts when risk scores change or new threats are detected.
    89|- **Analytics** — Live prediction review: recent AI decisions, false positives / false negatives, provider accuracy, action protection matrix, and outcome drill-down for demo and tuning.
    90|- **Leaderboard** — Community rankings. See who's contributing the most scans, reports, and verifications.
    91|- **History** — A full audit trail of everything you've done in SIFIX — scans, tags, logins, extension connections — searchable and exportable.
    92|- **Settings** — Your profile, notification preferences, API keys, extension management, and network configuration.
    93|- **Agent** — Command center for the SIFIX AI Agent. Toggle it on/off, configure scan frequency, view its activity log, and switch to mock mode for testing.
    94|
    95|---
    96|
    97|### 1. Overview
    98|
    99|The landing page after authentication. Provides a high-level summary of your security posture.
   100|
   101|**Features:**
   102|- Security score gauge (0–100) with animated arc
   103|- Active threats count with severity breakdown
   104|- Recent scan history (last 10 scans)
   105|- Watchlist status summary
   106|- Quick-action cards for common tasks
   107|- Network status indicator (0G Galileo Testnet connection)
   108|
   109|### 2. Scanner
   110|
   111|The core scanning interface for analyzing smart contracts, tokens, and dApp domains.
   112|
   113|**Features:**
   114|- **Contract Scanner** — Input any contract address for full security analysis
   115|- **Token Scanner** — Analyze ERC-20/ERC-721 tokens for honeypots, rug pulls, and malicious code
   116|- **Domain Scanner** — Check dApp URLs against threat databases
   117|- **Batch Scan** — Queue multiple targets for sequential analysis
   118|- Real-time progress indicator with stage breakdown:
   119|  1. Static analysis
   120|  2. Simulation (via viem)
   121|  3. AI risk assessment
   122|  4. Threat intelligence correlation
   123|  5. Report generation
   124|
   125|### 3. Checker
   126|
   127|Pre-transaction verification tool that simulates transactions before execution.
   128|
   129|**Features:**
   130|- Paste or upload transaction calldata for analysis
   131|- Simulate against current on-chain state
   132|- Preview token transfers and approval changes
   133|- Gas estimation with safety margins
   134|- Approval spender analysis (identify suspicious approvals)
   135|- Integration with the extension for real-time checking
   136|
   137|### 4. Threats
   138|
   139|Live threat intelligence feed showing current and emerging threats in the Web3 ecosystem.
   140|
   141|**Features:**
   142|- Real-time threat feed with auto-refresh
   143|- Severity filtering (Critical, High, Medium, Low, Info)
   144|- Threat categories:
   145|  - 🎯 Phishing campaigns
   146|  - 💰 Rug pulls
   147|  - 🪤 Honeypot contracts
   148|  - 🔓 Approval exploits
   149|  - 🧪 Flash loan attacks
   150|  - 🕵️ Impersonation scams
   151|- Threat details panel with affected contracts and addresses
   152|- One-click "Add to Watchlist" for monitoring
   153|
   154|### 5. Reports
   155|
   156|Comprehensive security reports generated from scans and analyses.
   157|
   158|**Features:**
   159|- Report library with search and filter
   160|- Report types:
   161|  - **Contract Audit Report** — Full smart contract analysis
   162|  - **Token Safety Report** — Token risk assessment
   163|  - **Domain Security Report** — dApp domain verification
   164|  - **Transaction Analysis Report** — Post-transaction forensic analysis
   165|- Export to PDF
   166|- On-chain evidence verification (0G Storage root hash)
   167|- Share reports via unique URL
   168|
   169|### 6. Tags
   170|
   171|Custom tagging system for organizing and categorizing addresses, contracts, and domains.
   172|
   173|**Features:**
   174|- Create, edit, and delete custom tags
   175|- Apply tags to any scanned entity
   176|- Color-coded tag categories
   177|- Tag-based filtering across all dashboard pages
   178|- Pre-built tag templates:
   179|  - `verified` — Known legitimate contracts
   180|  - `suspicious` — Requires monitoring
   181|  - `avoid` — Known malicious
   182|  - `personal` — User's own contracts
   183|  - `watching` — Under observation
   184|
   185|### 7. Watchlist
   186|
   187|Proactive monitoring system for tracking specific addresses, contracts, and domains.
   188|
   189|**Features:**
   190|- Add any address, contract, or domain to the watchlist
   191|- Automatic re-scanning at configurable intervals (1h, 6h, 24h)
   192|- Alert configuration:
   193|  - New threat detected
   194|  - Risk score change
   195|  - Contract modification
   196|  - Liquidity change
   197|- Notification channels: In-app, email (future), Telegram (future)
   198|- Watchlist overview dashboard with status grid
   199|
   200|### 8. Analytics
   201|
   202|Data visualization and trend analysis for security metrics over time.
   203|
   204|**Features:**
   205|- **Security Score Trend** — Historical security score over 7/30/90 days
   206|- **Threat Distribution** — Pie/bar charts of threat types encountered
   207|- **Scan Volume** — Number of scans performed over time
   208|- **Risk Heatmap** — Day/time analysis of when threats are most active
   209|- **Top Threats** — Most frequently encountered threat vectors
   210|- **Network Activity** — 0G Galileo Testnet interaction metrics
   211|- Date range selector with preset options
   212|
   213|### 9. Leaderboard
   214|
   215|Community-driven security contribution rankings.
   216|
   217|**Features:**
   218|- Top contributors by:
   219|  - Number of scans performed
   220|  - Threats identified
   221|  - Reports generated
   222|  - Community verification actions
   223|- Weekly and all-time views
   224|- User rank and score display
   225|- Badges and achievement icons
   226|- Community goals and progress tracking
   227|
   228|### 10. History
   229|
   230|Complete audit trail of all SIFIX activities for the authenticated user.
   231|
   232|**Features:**
   233|- Chronological activity log
   234|- Event types:
   235|  - Scans initiated and completed
   236|  - Threats detected
   237|  - Reports generated
   238|  - Tags created or applied
   239|  - Watchlist modifications
   240|  - Extension connection events
   241|  - Authentication events
   242|- Advanced filtering by event type, date range, and severity
   243|- Export activity log as JSON or CSV
   244|- Pagination with infinite scroll
   245|
   246|### 11. Settings
   247|
   248|User preferences and configuration management.
   249|
   250|**Features:**
   251|- **Profile** — Connected wallet address, display name, avatar
   252|- **Notifications** — Alert preferences for threats and watchlist items
   253|- **Security** — Session timeout, two-factor authentication
   254|- **Extension** — Manage connected extension instances
   255|- **API Keys** — Generate and manage API keys for programmatic access
   256|- **Preferences** — Theme settings, default scan parameters, language
   257|- **Network** — 0G Galileo Testnet connection status and RPC configuration
   258|- **Data** — Export all user data, delete account
   259|
   260|### 12. Agent
   261|
   262|Configuration and monitoring interface for the SIFIX AI Agent.
   263|
   264|**Features:**
   265|- Agent status (Active / Idle / Disabled)
   266|- Autonomous scan configuration:
   267|  - Scan frequency
   268|  - Target scope (watchlist only, all connected, custom)
   269|  - Risk threshold for auto-reporting
   270|- Agent activity log
   271|- AI model configuration (provider, parameters)
   272|- 0G Compute integration status
   273|- Mock mode toggle for development/testing
   274|- Historical learning statistics (scans analyzed, patterns learned)
   275|
   276|---
   277|
   278|## Authentication
   279|
   280|The dashboard uses **Sign-In with Ethereum (SIWE)** for authentication:
   281|
   282|1. User connects their wallet via the dashboard
   283|2. A SIWE message is generated and presented for signing
   284|3. The signed message is verified by the SIFIX backend
   285|4. A JWT token is issued and stored securely
   286|5. The token is refreshed automatically on expiry
   287|
   288|All authenticated requests include the JWT in the `Authorization` header.
   289|
   290|---
   291|
   292|## Technical Specifications
   293|
   294|| Property | Value |
   295||----------|-------|
   296|| Framework | Next.js 16 |
   297|| Rendering | App Router with SSR + Client Components |
   298|| Styling | Tailwind CSS 4 + custom glassmorphism utilities |
   299|| State Management | Zustand |
   300|| Data Fetching | TanStack Query (React Query) |
   301|| Authentication | SIWE (Sign-In with Ethereum) |
   302|| Network | 0G Galileo Testnet (Chain ID: 16602) |
   303|| Design Language | Glassmorphism on pure black (#000) |
   304|
   305|---
   306|
   307|## Related
   308|
   309|- [Chrome Extension](./extension) — Browser-based security companion
   310|- [AI Agent](./ai-agent) — The analysis engine behind the dashboard
   311|- [0G Integration](./0g-integration) — On-chain storage and compute infrastructure
   312|