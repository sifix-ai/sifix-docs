     1|---
     2|title: Configuration
     3|description: Complete configuration reference for SIFIX — all 14 environment variables, AI provider setup, storage options, and network settings for the 0G Galileo Testnet.
     4|---
     5|
     6|# Configuration
     7|
     8|> **TL;DR** — Copy `.env.example` to `.env`, set your `AI_API_KEY` and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, and you're ready for local development. Everything else has sensible defaults.
     9|
    10|This guide covers every configuration option in the SIFIX platform. The dApp reads all settings from environment variables — there are **14 variables** controlling database connections, AI providers, 0G Storage, 0G Compute, network endpoints, and agentic identity.
    11|
    12|---
    13|
    14|## Quick Config — Minimum Viable `.env`
    15|
    16|To get started locally, you only need **three required values**:
    17|
    18|```bash
    19|# Minimum viable configuration for local development
    20|DATABASE_URL="postgresql://user:password@127.0.0.1:5432/sifix"
    21|NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-id"
    22|AI_API_KEY="your-ai-api-key"
    23|
    24|# Everything below uses sensible defaults for local development:
    25|# NEXT_PUBLIC_ZG_RPC_URL → https://evmrpc-testnet.0g.ai
    26|# NEXT_PUBLIC_ZG_CHAIN_ID → 16602
    27|# AI_MODEL → glm/glm-5.1
    28|# STORAGE_MOCK_MODE → true (no funded wallet needed)
    29|# ZG_INDEXER_URL → https://indexer-storage-testnet-turbo.0g.ai
    30|# NEXT_PUBLIC_AGENTIC_ID_CONTRACT_ADDRESS → 0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F
    31|```
    32|
    33|See the [full reference below](#environment-variables-reference) for all 14 variables and their options.
    34|
    35|---
    36|
    37|## Environment Variables Reference
    38|
    39|All variables are defined in the `.env` file at the root of `sifix-dapp`.
    40|
    41|### Database
    42|
    43|**`DATABASE_URL`**
    44|- **Description:** PostgreSQL connection string for Prisma ORM
    45|- **Default:** `"postgresql://user:password@127.0.0.1:5432/sifix"`
    46|- **Required:** Yes
    47|- **Example:** `"postgresql://user:password@127.0.0.1:5432/sifix"` or `"file:./production.db"`
    48|- **Notes:** The database file is created relative to the `prisma/` directory. Prisma manages schema migrations automatically via `pnpm db:push`.
    49|
    50|---
    51|
    52|### WalletConnect
    53|
    54|**`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`**
    55|- **Description:** Your WalletConnect Cloud project ID for wallet connection in the dApp
    56|- **Default:** None
    57|- **Required:** Yes
    58|- **Example:** `"a1b2c3d4e5f6..."`
    59|- **How to get one:** Register at [cloud.walletconnect.com](https://cloud.walletconnect.com) and create a new project
    60|- **Notes:** The `NEXT_PUBLIC_` prefix makes this variable available in the browser. Required for the wagmi connector to function.
    61|
    62|---
    63|
    64|### 0G Network
    65|
    66|**`NEXT_PUBLIC_ZG_RPC_URL`**
    67|- **Description:** JSON-RPC endpoint for the 0G Galileo Testnet
    68|- **Default:** `"https://evmrpc-testnet.0g.ai"`
    69|- **Required:** No (has sensible default)
    70|- **Example:** `"https://evmrpc-testnet.0g.ai"`
    71|- **Notes:** Used by viem's `publicClient` for transaction simulation, gas estimation, and state queries. The `NEXT_PUBLIC_` prefix exposes this to the browser extension.
    72|
    73|**`NEXT_PUBLIC_ZG_CHAIN_ID`**
    74|- **Description:** Chain ID for the 0G Galileo Testnet
    75|- **Default:** `"16602"`
    76|- **Required:** No
    77|- **Example:** `"16602"`
    78|- **Notes:** Must match the chain ID configured in MetaMask. Used by wagmi for chain switching and transaction routing.
    79|
    80|---
    81|
    82|### AI Provider
    83|
    84|**`AI_API_KEY`**
    85|- **Description:** API key for the OpenAI-compatible AI provider (fallback when 0G Compute is unavailable)
    86|- **Default:** None
    87|- **Required:** Yes (for AI analysis when 0G Compute is not configured)
    88|- **Example:** `"sk-proj-abc123..."` (OpenAI) or `"gsk_xxx..."` (Groq)
    89|- **Notes:** This key is **server-side only** — never exposed to the browser. Works with any OpenAI-compatible provider.
    90|
    91|**`AI_BASE_URL`**
    92|- **Description:** Base URL for the OpenAI-compatible API endpoint
    93|- **Default:** `""` (uses OpenAI defaults)
    94|- **Required:** No
    95|- **Examples:**
    96|  - OpenAI: `""` or `"https://api.openai.com/v1"`
    97|  - Groq: `"https://api.groq.com/openai/v1"`
    98|  - OpenRouter: `"https://openrouter.ai/api/v1"`
    99|  - Ollama (local): `"http://localhost:11434/v1"`
   100|  - Together AI: `"https://api.together.xyz/v1"`
   101|- **Notes:** The SIFIX SDK uses the OpenAI SDK as a universal client. Any provider implementing the `/chat/completions` endpoint is compatible.
   102|
   103|**`AI_MODEL`**
   104|- **Description:** Model identifier for the AI provider
   105|- **Default:** `"glm/glm-5.1"`
   106|- **Required:** No
   107|- **Examples:**
   108|  - OpenAI: `"gpt-4o"`, `"gpt-4o-mini"`, `"gpt-4-turbo"`
   109|  - Groq: `"llama-3.1-70b-versatile"`, `"mixtral-8x7b-32768"`
   110|  - OpenRouter: `"anthropic/claude-3.5-sonnet"`, `"meta-llama/llama-3.1-70b-instruct"`
   111|  - Ollama: `"llama3.1:70b"`, `"codellama:34b"`
   112|- **Notes:** Larger models provide deeper analysis but with higher latency and cost. For production, `gpt-4o` or `llama-3.1-70b-versatile` are recommended.
   113|
   114|---
   115|
   116|### 0G Storage
   117|
   118|**`ZG_INDEXER_URL`**
   119|- **Description:** URL for the 0G Storage indexer service
   120|- **Default:** `"https://indexer-storage-testnet-turbo.0g.ai"`
   121|- **Required:** No (has sensible default)
   122|- **Example:** `"https://indexer-storage-testnet-turbo.0g.ai"`
   123|- **Notes:** The indexer is used to upload and retrieve analysis reports stored on 0G Storage. The turbo indexer provides faster upload confirmation.
   124|
   125|**`STORAGE_PRIVATE_KEY`**
   126|- **Description:** Private key of the wallet used for 0G Storage uploads (server-side only)
   127|- **Default:** None
   128|- **Required:** Only if `STORAGE_MOCK_MODE` is `"false"`
   129|- **Example:** `"0xabcdef1234567890..."`
   130|- **Notes:** This wallet must be funded with testnet A0GI tokens to pay for storage operations. **Never commit this value to git.** The `.env` file is excluded via `.gitignore`.
   131|
   132|**`STORAGE_MOCK_MODE`**
   133|- **Description:** Toggle between real 0G Storage uploads and mock mode
   134|- **Default:** `"true"`
   135|- **Required:** No
   136|- **Values:** `"true"` (mock — uses deterministic keccak256 hashes, no on-chain writes) | `"false"` (real uploads to 0G Storage)
   137|- **Notes:** Use `"true"` for local development and testing. Set to `"false"` only when you have a funded wallet in `STORAGE_PRIVATE_KEY`.
   138|
   139|---
   140|
   141|### 0G Compute
   142|
   143|**`COMPUTE_PRIVATE_KEY`**
   144|- **Description:** Private key for 0G Compute broker interactions (decentralized AI inference)
   145|- **Default:** None
   146|- **Required:** Only if using 0G Compute as the primary AI provider
   147|- **Example:** `"0x1234567890abcdef..."`
   148|- **Notes:** Must be funded with testnet A0GI and have deposits transferred to the compute provider. This is separate from `STORAGE_PRIVATE_KEY`.
   149|
   150|**`COMPUTE_PROVIDER_ADDRESS`**
   151|- **Description:** Address of the 0G Compute provider to use for AI inference
   152|- **Default:** None
   153|- **Required:** Only if using 0G Compute
   154|- **Example:** `"0xProviderAddress..."`
   155|- **How to find providers:** Run `0g-compute-cli inference list-providers`
   156|
   157|**Setting up 0G Compute (optional, for decentralized AI):**
   158|
   159|```bash
   160|# Step 1: List available compute providers
   161|0g-compute-cli inference list-providers
   162|
   163|# Step 2: Deposit funds to the compute broker
   164|0g-compute-cli deposit --amount 10
   165|
   166|# Step 3: Transfer funds to your chosen provider
   167|0g-compute-cli transfer-fund --provider <ADDRESS> --amount 5
   168|
   169|# Step 4: Set COMPUTE_PROVIDER_ADDRESS in .env
   170|```
   171|
   172|---
   173|
   174|### Agentic Identity (ERC-7857)
   175|
   176|**`NEXT_PUBLIC_AGENTIC_ID_CONTRACT_ADDRESS`**
   177|- **Description:** Address of the ERC-7857 Agentic ID contract on 0G Galileo
   178|- **Default:** `"0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F"`
   179|- **Required:** No (has sensible default)
   180|- **Notes:** This is the on-chain contract that mints and manages SIFIX's verifiable agent identity. The default value points to the deployed contract on 0G Galileo.
   181|
   182|**`NEXT_PUBLIC_AGENTIC_ID_TOKEN_ID`**
   183|- **Description:** Token ID of the minted agent identity NFT
   184|- **Default:** `""` (disabled)
   185|- **Required:** No
   186|- **Example:** `"99"`
   187|- **Notes:** Set this after minting an Agentic ID NFT. When empty, the Agentic Identity guard is disabled. When set to `"99"`, SIFIX uses the minted on-chain identity for verifiable security decisions.
   188|
   189|---
   190|
   191|## `.env.example` Template
   192|
   193|Copy this template to `.env` and fill in your values:
   194|
   195|```bash
   196|# ===========================================
   197|# SIFIX dApp — Environment Configuration
   198|# ===========================================
   199|
   200|# Database (Prisma + PostgreSQL)
   201|DATABASE_URL="postgresql://user:password@127.0.0.1:5432/sifix"
   202|
   203|# WalletConnect (required for wallet connection)
   204|NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-id"
   205|
   206|# 0G Galileo Network
   207|NEXT_PUBLIC_ZG_RPC_URL="https://evmrpc-testnet.0g.ai"
   208|NEXT_PUBLIC_ZG_CHAIN_ID="16602"
   209|
   210|# AI Provider (OpenAI-compatible endpoint)
   211|AI_API_KEY="your-ai-api-key"
   212|AI_BASE_URL=""
   213|AI_MODEL="glm/glm-5.1"
   214|
   215|# 0G Storage
   216|ZG_INDEXER_URL="https://indexer-storage-testnet-turbo.0g.ai"
   217|STORAGE_PRIVATE_KEY=""
   218|STORAGE_MOCK_MODE="true"
   219|
   220|# 0G Compute (optional — decentralized AI inference)
   221|COMPUTE_PRIVATE_KEY=""
   222|COMPUTE_PROVIDER_ADDRESS=""
   223|
   224|# Agentic Identity (ERC-7857)
   225|NEXT_PUBLIC_AGENTIC_ID_CONTRACT_ADDRESS="0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F"
   226|NEXT_PUBLIC_AGENTIC_ID_TOKEN_ID=""
   227|```
   228|
   229|---
   230|
   231|## AI Provider Configuration
   232|
   233|SIFIX supports five AI providers through the OpenAI-compatible SDK interface. The `AI_BASE_URL` and `AI_MODEL` variables control which provider is used.
   234|
   235|### 0G Compute (Primary — Recommended)
   236|
   237|0G Compute provides decentralized AI inference directly on the 0G infrastructure. This is the primary provider for production use.
   238|
   239|```bash
   240|# No AI_BASE_URL needed — 0G Compute is accessed via COMPUTE_* variables
   241|AI_API_KEY=""                        # Not used for 0G Compute
   242|COMPUTE_PRIVATE_KEY="0xYourKey..."   # Funded wallet for compute
   243|COMPUTE_PROVIDER_ADDRESS="0xProvider..."
   244|```
   245|
   246|**When to use:** Production deployments on 0G Galileo. Lowest latency, no external API dependency.
   247|
   248|### OpenAI
   249|
   250|```bash
   251|AI_API_KEY="sk-proj-abc123..."
   252|AI_BASE_URL=""                       # Uses default OpenAI endpoint
   253|AI_MODEL="gpt-4o"
   254|```
   255|
   256|**When to use:** Reliable fallback. Best reasoning quality for complex DeFi transaction analysis.
   257|
   258|### Groq
   259|
   260|```bash
   261|AI_API_KEY="gsk_abc123..."
   262|AI_BASE_URL="https://api.groq.com/openai/v1"
   263|AI_MODEL="llama-3.1-70b-versatile"
   264|```
   265|
   266|**When to use:** Ultra-low latency (under 200ms). Ideal for simple transfers and real-time scoring.
   267|
   268|### OpenRouter
   269|
   270|```bash
   271|AI_API_KEY="sk-or-abc123..."
   272|AI_BASE_URL="https://openrouter.ai/api/v1"
   273|AI_MODEL="anthropic/claude-3.5-sonnet"
   274|```
   275|
   276|**When to use:** Access to multiple models through a single API. Useful for A/B testing different models.
   277|
   278|### Ollama (Local)
   279|
   280|```bash
   281|AI_API_KEY="ollama"                  # Any non-empty value
   282|AI_BASE_URL="http://localhost:11434/v1"
   283|AI_MODEL="llama3.1:70b"
   284|```
   285|
   286|**When to use:** Privacy-sensitive scenarios where no transaction data should leave your machine. Requires [Ollama](https://ollama.ai) installed locally with the model pulled.
   287|
   288|**Model routing logic:** The SIFIX SDK automatically selects the optimal provider based on:
   289|1. Transaction complexity (calldata depth, number of internal calls)
   290|2. User privacy preferences
   291|3. Provider availability (fallback chain if primary is down)
   292|4. Latency requirements (timeout budget per analysis step)
   293|
   294|---
   295|
   296|## Storage Configuration
   297|
   298|### Real 0G Storage
   299|
   300|For production use, SIFIX stores analysis reports immutably on 0G Storage:
   301|
   302|```bash
   303|STORAGE_MOCK_MODE="false"
   304|STORAGE_PRIVATE_KEY="0xYourFundedWalletKey..."
   305|ZG_INDEXER_URL="https://indexer-storage-testnet-turbo.0g.ai"
   306|```
   307|
   308|**Requirements:**
   309|- The wallet must be funded with testnet A0GI tokens
   310|- Use the 0G faucet or community channels to obtain testnet tokens
   311|- Each storage upload consumes a small amount of A0GI for gas
   312|
   313|**What gets stored:**
   314|- Full analysis results (risk score, threats, AI reasoning)
   315|- Simulation state changes
   316|- Threat intelligence matches
   317|- Timestamp and metadata
   318|
   319|**Retrieval:** Stored analyses can be retrieved via the indexer URL and verified against the on-chain root hash.
   320|
   321|### Mock Mode
   322|
   323|For local development and testing:
   324|
   325|```bash
   326|STORAGE_MOCK_MODE="true"
   327|STORAGE_PRIVATE_KEY=""               # Not needed in mock mode
   328|```
   329|
   330|Mock mode skips all on-chain operations and returns deterministic keccak256 hashes. The analysis pipeline runs normally — only the final storage step is mocked.
   331|
   332|---
   333|
   334|## Network Configuration
   335|
   336|SIFIX is configured for the **0G Galileo Testnet**:
   337|
   338|| Property | Value |
   339||----------|-------|
   340|| Network Name | 0G Galileo Testnet |
   341|| Chain ID | `16602` |
   342|| RPC URL | `https://evmrpc-testnet.0g.ai` |
   343|| Block Explorer | `https://chainscan-galileo.0g.ai` |
   344|| Currency | A0GI (18 decimals) |
   345|| Agentic ID Contract | `0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F` |
   346|| Token ID | `99` |
   347|
   348|These values are set via `NEXT_PUBLIC_ZG_RPC_URL` and `NEXT_PUBLIC_ZG_CHAIN_ID`. Changing these is not recommended — SIFIX is purpose-built for the 0G Galileo Testnet.
   349|
   350|---
   351|
   352|## Tips and Common Pitfalls
   353|
   354|### Do's
   355|
   356|- **Copy `.env.example` to `.env`** — Never edit `.env.example` directly
   357|- **Use `STORAGE_MOCK_MODE="true"`** for local development — avoids needing funded wallets
   358|- **Set `AI_API_KEY`** even if you plan to use 0G Compute — it serves as the fallback provider
   359|- **Keep private keys out of git** — The `.env` file is in `.gitignore` by default
   360|- **Fund your compute wallet** before setting `COMPUTE_PROVIDER_ADDRESS`
   361|
   362|### Don'ts
   363|
   364|- **Don't commit `.env` to git** — Use `.env.example` for sharing configuration templates
   365|- **Don't use production private keys** on testnet — Generate separate keys for development
   366|- **Don't mix up storage and compute keys** — `STORAGE_PRIVATE_KEY` and `COMPUTE_PRIVATE_KEY` serve different purposes
   367|- **Don't change `NEXT_PUBLIC_ZG_CHAIN_ID`** — SIFIX only operates on 0G Galileo (Chain ID: 16602)
   368|
   369|### Common Issues
   370|
   371|**"AI analysis timeout"**
   372|- Check that `AI_API_KEY` is valid and the provider is reachable
   373|- If using Ollama, ensure the service is running: `ollama serve`
   374|- Increase timeout in the agent configuration if analyzing complex transactions
   375|
   376|**"Storage upload failed"**
   377|- Set `STORAGE_MOCK_MODE="true"` to bypass on-chain uploads
   378|- If using real storage, verify `STORAGE_PRIVATE_KEY` wallet has A0GI balance
   379|- Check `ZG_INDEXER_URL` is accessible: `curl https://indexer-storage-testnet-turbo.0g.ai/health`
   380|
   381|**"WalletConnect not connecting"**
   382|- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
   383|- Create a project at [cloud.walletconnect.com](https://cloud.walletconnect.com)
   384|- Remember that `NEXT_PUBLIC_` variables require a server restart to take effect
   385|
   386|**"Wrong chain" errors in MetaMask**
   387|- Ensure MetaMask is switched to 0G Galileo (Chain ID: 16602)
   388|- Verify `NEXT_PUBLIC_ZG_CHAIN_ID="16602"` in `.env`
   389|
   390|---
   391|
   392|## Next Steps
   393|
   394|- **[Quick Start](./quick-start)** — Analyze your first transaction in 5 minutes
   395|- **[Installation](./installation)** — Full platform setup guide
   396|- **[Extension Setup](./extension-setup)** — Detailed Chrome extension configuration
   397|- **[Deployment](./deployment)** — Production deployment guide
   398|