     1|     1|---
     2|     2|title: Tech Stack
     3|     3|description: Complete technology breakdown — why every tool in the SIFIX stack was chosen
     4|     4|---
     5|     5|
     6|     6|# Tech Stack
     7|     7|
     8|     8|> **⚡ TL;DR**
     9|     9|> SIFIX is built with modern, battle-tested technologies across 3 repositories: a **Next.js** web dashboard, a **Chrome extension** for real-time wallet protection, and a **TypeScript SDK** for the core security engine. Everything runs on the **0G Galileo** blockchain, which provides built-in AI computing and data storage. Each technology was chosen for a specific reason — not because it's trendy, but because it's the right tool for the job.
    10|    10|
    11|    11|SIFIX is split into clear modules so each part can do one job well: browser protection, backend processing, and AI security analysis.
    12|    12|
    13|    13|---
    14|    14|
    15|    15|## Architecture Overview
    16|    16|
    17|    17|```mermaid
    18|    18|graph LR
    19|    19|    subgraph Frontend["🖥️ Frontend"]
    20|    20|        NextJS["Next.js 16"]
    21|    21|        React["React 19"]
    22|    22|        Tailwind["Tailwind CSS"]
    23|    23|        Lucide["Lucide Icons"]
    24|    24|    end
    25|    25|
    26|    26|    subgraph Extension["🧩 Browser Extension"]
    27|    27|        Plasmo["Plasmo 0.88"]
    28|    28|        MV3["Chrome MV3"]
    29|    29|        Dexie["Dexie IndexedDB"]
    30|    30|    end
    31|    31|
    32|    32|    subgraph SDK["⚙️ Core SDK"]
    33|    33|        TS["TypeScript"]
    34|    34|        Viem["viem"]
    35|    35|        OpenAI["OpenAI SDK"]
    36|    36|    end
    37|    37|
    38|    38|    subgraph Blockchain["⛓️ Blockchain"]
    39|    39|        OG["0G Galileo"]
    40|    40|        Storage["0G Storage"]
    41|    41|        Compute["0G Compute"]
    42|    42|        AGID["0G Agentic ID"]
    43|    43|    end
    44|    44|
    45|    45|    subgraph AI["🤖 AI Layer"]
    46|    46|        OGAI["0G Compute"]
    47|    47|        GPT["OpenAI"]
    48|    48|        GroqAI["Groq"]
    49|    49|        Router["OpenRouter"]
    50|    50|        OllamaAI["Ollama"]
    51|    51|    end
    52|    52|
    53|    53|    subgraph Data["💾 Data"]
    54|    54|        Prisma["Prisma"]
    55|    55|        PostgreSQL["PostgreSQL"]
    56|    56|    end
    57|    57|
    58|    58|    subgraph Auth["🔐 Auth"]
    59|    59|        SIWE["SIWE"]
    60|    60|    end
    61|    61|```
    62|    62|
    63|    63|---
    64|    64|
    65|    65|## Frontend — sifix-dapp
    66|    66|
    67|    67|The SIFIX dashboard is the primary interface for transaction history, risk reports, portfolio security insights, and account management.
    68|    68|
    69|    69|> **Why this matters:** The dashboard is where users review their security history and manage settings. It needs to be fast (risk reports load instantly), accessible (works on any device), and capable of displaying complex data (multi-layered transaction breakdowns) in a way that's easy to understand.
    70|    70|
    71|    71|- **Next.js 16** — App Router with Server Components
    72|    72|- **React 19** — Latest concurrent features for responsive UI
    73|    73|- **Tailwind CSS** — Utility-first styling with custom SIFIX theme
    74|    74|- **Lucide Icons** — Consistent, lightweight icon system
    75|    75|- **API Routes** — RESTful endpoints for simulation, analysis, history, and settings
    76|    76|- **Dashboard Pages** — Setup, history, reputation, analytics, settings, and extension flows
    77|    77|
    78|    78|### Why Next.js 16?
    79|    79|
    80|    80|Next.js provides the best balance of developer experience and performance for a full-stack dApp:
    81|    81|
    82|    82|- **Server Components** reduce client-side JavaScript for faster page loads
    83|    83|- **API Routes** eliminate the need for a separate backend — the route handlers handle data operations, simulation requests, and AI orchestration directly within the Next.js server layer
    84|    84|- **App Router** enables nested layouts for the dashboard structure (sidebar, header, content area) without prop drilling or complex state management
    85|    85|- **Built-in optimization** for images, fonts, and scripts keeps the dashboard performant even with complex risk visualization components
    86|    86|
    87|    87|### Why React 19?
    88|    88|
    89|    89|React 19's concurrent rendering and `useTransition` are critical for the dashboard's UX:
    90|    90|
    91|    91|- Risk analysis results stream in progressively — the UI doesn't freeze while waiting for AI inference
    92|    92|- `useOptimistic` enables instant feedback when users submit simulation requests
    93|    93|- Server Components reduce the hydration payload, improving time-to-interactive on the risk report pages
    94|    94|
    95|    95|### Why Tailwind CSS?
    96|    96|
    97|    97|Security dashboards need to display complex information hierarchies — risk tiers, severity indicators, nested transaction breakdowns. Tailwind's utility approach lets us build these components with precise control over spacing, color, and responsive behavior without fighting a CSS framework's opinionated defaults.
    98|    98|
    99|    99|The custom SIFIX theme maps directly to risk tiers: `risk-safe` (green), `risk-low` (teal), `risk-medium` (yellow), `risk-high` (orange), `risk-critical` (red).
   100|   100|
   101|   101|---
   102|   102|
   103|   103|## Browser Extension — sifix-extension
   104|   104|
   105|   105|The Chrome extension is the real-time protection layer, intercepting transactions at the wallet interface.
   106|   106|
   107|   107|> **Why this matters:** This is the "front line" of SIFIX's protection. The extension sits inside your browser and watches every transaction you're about to sign — like a security guard standing at the door of your wallet. If it detects something dangerous, it stops you before you can sign.
   108|   108|
   109|   109|- **Plasmo 0.88** — The framework for building Chrome extensions with React
   110|   110|- **Chrome Manifest V3** — Google's latest extension standard, required for Chrome Web Store
   111|   111|- **Dexie IndexedDB** — Client-side database for transaction history and settings
   112|   112|
   113|   113|### Why Plasmo?
   114|   114|
   115|   115|Building a Chrome extension with raw MV3 APIs involves managing background service workers, content scripts, popup UI, and messaging — all with different build configurations and lifecycle rules. Plasmo solves this:
   116|   116|
   117|   117|- **React-first development** — The popup, options page, and content scripts are all React components
   118|   118|- **HMR in the extension** — Live-reload during development without manually refreshing the extension
   119|   119|- **Automatic manifest generation** — Plasmo generates `manifest.json` from code annotations
   120|   120|- **Built-in messaging** — Type-safe communication between content scripts and background service worker
   121|   121|
   122|   122|### Why Manifest V3?
   123|   123|
   124|   124|MV3 is mandatory for all new Chrome extensions as of 2024:
   125|   125|
   126|   126|- **Service workers** replace persistent background pages — better resource efficiency
   127|   127|- **Stricter CSP** — Enhanced security for the extension itself (preventing XSS in the security tool would be embarrassing)
   128|   128|- **Action API** — Unified browser action and page action into a single `chrome.action` API
   129|   129|- **Offscreen documents** — Required for running simulation logic outside the main thread
   130|   130|
   131|   131|### Why Dexie?
   132|   132|
   133|   133|IndexedDB is the only persistent storage available to Chrome extensions, but its native API is callback-based and verbose. Dexie provides:
   134|   134|
   135|   135|- **Promise-based API** — `await db.transactions.add(tx)` instead of nested callbacks
   136|   136|- **Type-safe schemas** — Compile-time checking on transaction and report storage
   137|   137|- **Reactive queries** — `useLiveQuery` hooks that auto-update the popup UI when new transactions are intercepted
   138|   138|- **Multi-entry indexes** — Efficient queries on transaction history by address, date, risk tier, or token
   139|   139|
   140|   140|---
   141|   141|
   142|   142|## Core SDK — sifix-agent
   143|   143|
   144|   144|The SDK is the heart of SIFIX — the simulation engine, AI routing, and risk scoring logic.
   145|   145|
   146|   146|> **Why this matters:** The SDK is the "brain" of SIFIX. It takes a raw transaction, runs a simulation, sends the results to AI models for analysis, and produces a risk score. Every other part of the system (dashboard, extension) relies on this core engine to do the actual security work.
   147|   147|
   148|   148|- **TypeScript** — Full type safety across the entire pipeline
   149|   149|- **viem** — Modern TypeScript library for Ethereum interactions
   150|   150|- **OpenAI SDK** — AI model communication with structured output parsing
   151|   151|
   152|   152|### Why TypeScript?
   153|   153|
   154|   154|TypeScript is non-negotiable for a security tool:
   155|   155|
   156|   156|- **Transaction parsing** — viem's ABI decoder returns fully typed objects. No `any` types, no runtime surprises when parsing calldata
   157|   157|- **Risk scoring** — The scoring pipeline is a chain of typed functions where each step's output is the next step's input. TypeScript catches mismatches at compile time
   158|   158|- **Cross-repo consistency** — The SDK types are shared with the dApp and extension, ensuring all three layers agree on data structures
   159|   159|
   160|   160|### Why viem?
   161|   161|
   162|   162|viem was chosen over ethers.js for the SDK layer:
   163|   163|
   164|   164|- **Tree-shakeable** — The SDK only imports the functions it uses (ABICoder, `eth_call`, trace methods). In the extension where bundle size matters, this keeps the build small
   165|   165|- **No provider abstraction** — viem's `publicClient` is a thin wrapper over JSON-RPC. Direct access to `eth_call` and `debug_traceTransaction` without fighting a provider abstraction layer
   166|   166|- **Better TypeScript inference** — ABI-typed contract methods return exact types, not `BigNumber` or `string`
   167|   167|- **Modular** — Can import just the simulation utilities without pulling in wallet/signing code
   168|   168|
   169|   169|### Why OpenAI SDK?
   170|   170|
   171|   171|The OpenAI SDK is used as the primary client for **all** AI providers — not just OpenAI:
   172|   172|
   173|   173|- **Structured outputs** — The `zod` integration ensures AI responses conform to the `RiskAnalysis` schema at parse time
   174|   174|- **Streaming** — Progressive display of analysis results in the dashboard while inference is running
   175|   175|- **Provider-agnostic interface** — The SDK's chat completion API maps cleanly to Groq, OpenRouter, and Ollama endpoints with minimal adaptation
   176|   176|
   177|   177|---
   178|   178|
   179|   179|## Blockchain — 0G Galileo Testnet
   180|   180|
   181|   181|SIFIX is built natively on the **0G Galileo Testnet** — not deployed as a generic EVM dApp.
   182|   182|
   183|   183|> **Why this matters:** Most blockchains only process transactions. 0G is different — it has AI computing built directly into the network. This means SIFIX can run its AI analysis *on the blockchain itself* rather than relying entirely on external servers, making the results more trustworthy and harder to tamper with. It's like having a built-in security lab instead of shipping samples to an outside lab.
   184|   184|
   185|- **0G Galileo Testnet** — Chain ID `16602`
   186|- **0G Chain** — Hosts the live SIFIX contract and on-chain reporting state
   187|- **0G Storage** — Verifiable evidence storage for simulation reports and risk data
   188|- **0G Compute** — Primary AI inference layer
   189|- **0G Agentic ID** — Identity layer for agent provenance and gated access flows
   190|- **SIFIX Contract:** `0xBBa8b030D80113e50271a2bbEeDBE109D9f1C42e`
   191|- **Agentic ID Contract:** `0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F`
   192|- **Agentic ID Token ID:** `99`
   193|   192|### Why 0G Galileo?
   194|   193|
   195|   194|0G is not just another EVM chain — it's built for AI-native applications:
   196|   195|
   197|   196|- **0G Compute** provides on-chain AI inference that SIFIX uses as its primary analysis engine. This means the AI model runs within the 0G infrastructure, reducing latency and eliminating the need for external API calls for most analyses
   198|   197|- **0G Storage** provides a data availability layer where SIFIX can persist simulation reports, risk assessments, and threat intelligence in a verifiable, on-chain manner
   199|   198|- **EVM compatibility** means SIFIX can use standard Ethereum tooling (viem, Foundry) while accessing AI-native infrastructure in the 0G ecosystem
   200|   199|- **Agentic ID support** gives SIFIX a native identity layer for agent provenance and gated access flows
   201|   200|
   202|   201|**Network details:**
   203|   202|- **Chain ID:** `16602`
   204|   203|- **RPC:** Available through 0G Galileo testnet endpoints
   205|   204|- **Explorer:** 0G Galileo block explorer
   206|   205|- **Faucet:** Available through the 0G community for testnet tokens
   207|   206|
   208|   207|---
   209|   208|
   210|   209|## AI Layer
   211|   210|
   212|   211|SIFIX uses a **tiered AI architecture** with intelligent model routing:
   213|   212|
   214|   213|> **Why this matters:** Different transactions need different levels of scrutiny. A simple token transfer can be checked in milliseconds by a fast, lightweight model. A complex DeFi swap involving multiple contracts needs a more powerful model that can reason through the entire execution path. SIFIX automatically picks the right AI for each job — like routing a simple question to a receptionist and a complex diagnosis to a specialist.
   215|   214|
   216|   215|- **0G Compute** — Primary inference engine for on-chain analysis
   217|   216|- **OpenAI** (GPT-4 class) — Deep reasoning fallback for complex patterns
   218|   217|- **Groq** — Ultra-low latency LPU inference for real-time scoring
   219|   218|- **OpenRouter** — Multi-model routing for specialized tasks
   220|   219|- **Ollama** — Local model fallback for privacy-sensitive scenarios
   221|   220|
   222|   221|### Why Multi-Model?
   223|   222|
   224|   223|No single AI model is optimal for every transaction type:
   225|   224|
   226|   225|- **Simple transfers** need fast, cheap analysis — Groq's LPU inference handles these in under 200ms
   227|   226|- **Complex DeFi interactions** need deep reasoning about multi-step execution paths — GPT-4 class models on OpenAI or OpenRouter provide the analysis depth
   228|   227|- **Known attack patterns** can be classified efficiently by 0G Compute's on-chain models without any external API call
   229|   228|- **Privacy scenarios** — Some users prefer that no transaction data leaves their device. Ollama runs analysis locally using open-source models
   230|   229|
   231|   230|The SDK's AI router automatically selects the optimal model based on:
   232|   231|1. Transaction complexity (calldata depth, number of internal calls)
   233|   232|2. User privacy preferences
   234|   233|3. Model availability (fallback chain if primary is down)
   235|   234|4. Latency requirements (timeout budget per analysis step)
   236|   235|
   237|   236|---
   238|   237|
   239|   238|## Database
   240|   239|
   241|   240|- **Prisma** — Type-safe ORM with migration support
   242|   241|- **PostgreSQL** — Production-ready relational database for shared app state
   243|   242|
   244|   243|> **Why this matters:** SIFIX needs durable shared state for transaction history, threat reports, sync cursors, and user settings. PostgreSQL gives production-ready concurrency and reliable persistence, while Prisma keeps the application layer type-safe and maintainable.
   245|   244|
   246|   245|### Why Prisma + PostgreSQL?
   247|   246|
   248|   247|The SIFIX dApp needs structured storage for transaction history, user preferences, risk reports, analysis metadata, and sync state:
   249|   248|
   250|   249|- **PostgreSQL supports shared state** — Suitable for Vercel, Docker, and multi-service deployments where dApp and indexer need durable concurrent access
   251|   250|- **Prisma provides type safety** — The schema definition in `schema.prisma` generates TypeScript types that flow through the entire application
   252|   251|- **Migrations are declarative** — `prisma migrate dev` handles schema changes without manual SQL
   253|   252|- **Prisma Studio** — Built-in admin UI for inspecting data during development
   254|   253|
   255|   254|---
   256|   255|
   257|   256|## Authentication
   258|   257|
   259|   258|- **SIWE (Sign-In with Ethereum)** — Wallet-based authentication
   260|   259|
   261|   260|> **Why this matters:** In Web3, your wallet *is* your identity. SIWE lets users log in by simply signing a message with their crypto wallet — no passwords, no email, no personal data collected. It's like showing your ID at the door instead of filling out a registration form.
   262|   261|
   263|   262|### Why SIWE?
   264|   263|
   265|   264|SIFIX is a Web3-native tool — traditional email/password authentication is antithetical to the product's philosophy:
   266|   265|
   267|   266|- **Wallet = identity** — Users authenticate by signing a message with their wallet. No passwords, no email verification, no account recovery flows
   268|   267|- **EIP-4361 standard** — SIWE is the emerging standard for wallet-based auth, supported by every major wallet
   269|   268|- **Session management** — The dApp creates a server-side session from the SIWE signature, enabling authenticated API calls to the route handlers
   270|   269|- **No personal data** — SIWE requires nothing beyond a wallet address. No email, no name, no personal information collected
   271|   270|
   272|   271|---
   273|   272|
   274|   273|## Complete Dependency Map
   275|   274|
   276|   275|```
   277|   276|sifix-dapp/
   278|   277|├── next@16
   279|   278|├── react@19
   280|   279|├── tailwindcss
   281|   280|├── lucide-react
   282|   281|├── prisma
   283|   282|├── better-postgresql3
   284|   283|├── siwe (Sign-In with Ethereum)
   285|   284|├── viem
   286|   285|└── @sifix/sdk (workspace link)
   287|   286|
   288|   287|sifix-extension/
   289|   288|├── plasmo@0.88
   290|   289|├── react@19
   291|   290|├── dexie (IndexedDB)
   292|   291|├── viem
   293|   292|└── @sifix/sdk (workspace link)
   294|   293|
   295|   294|sifix-agent/ (SDK)
   296|   295|├── typescript@5.x
   297|   296|├── viem
   298|   297|├── openai (multi-provider client)
   299|   298|├── zod (schema validation)
   300|   299|└── 0g-sdk (0G Galileo integration)
   301|   300|```
   302|   301|
   303|   302|---
   304|   303|
   305|   304|→ **Next:** [System Architecture](../architecture/system-overview) — How these technologies connect in the system design.
   306|   305|