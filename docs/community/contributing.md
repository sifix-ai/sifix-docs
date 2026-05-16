     1|---
     2|title: Contributing
     3|description: How to contribute to SIFIX — code of conduct, development setup, code style, PR process, and contribution areas
     4|---
     5|
     6|# Contributing to SIFIX
     7|
     8|We welcome contributions to SIFIX — AI-Powered Wallet Security for Web3. This guide covers everything you need to get started, from forking the repo to landing your first pull request.
     9|
    10|---
    11|
    12|## Code of Conduct
    13|
    14|SIFIX is a community-driven security project, and we expect all contributors to uphold the following principles:
    15|
    16|- **Be respectful** — Treat every contributor with courtesy and professionalism
    17|- **Be inclusive** — Welcome developers of all experience levels, backgrounds, and perspectives
    18|- **Be constructive** — Critique ideas, not people. Frame feedback in terms of improvements, not shortcomings
    19|- **Be collaborative** — Share knowledge, help others debug, and celebrate contributions
    20|- **Be responsible** — Remember that SIFIX is a security tool. Report vulnerabilities privately (see [Security Issues](#security-issues)), never publicly disclose exploits
    21|
    22|Violations of the code of conduct can be reported to **security@sifix.ai**.
    23|
    24|---
    25|
    26|## Fork and Clone Workflow
    27|
    28|All SIFIX repositories follow the same fork-based contribution model:
    29|
    30|### 1. Fork the Repository
    31|
    32|Navigate to the repository on GitHub and click **Fork** in the top-right corner. This creates a copy under your GitHub account.
    33|
    34|### 2. Clone Your Fork
    35|
    36|```bash
    37|# Clone your fork (replace YOUR_USERNAME and REPO_NAME)
    38|git clone https://github.com/YOUR_USERNAME/sifix-agent.git
    39|cd sifix-agent
    40|
    41|# Add the upstream remote to stay in sync
    42|git remote add upstream https://github.com/sifix-ai/sifix-agent.git
    43|
    44|# Verify remotes
    45|git remote -v
    46|# origin    https://github.com/YOUR_USERNAME/sifix-agent.git (fetch)
    47|# upstream  https://github.com/sifix-ai/sifix-agent.git (fetch)
    48|```
    49|
    50|### 3. Keep Your Fork Updated
    51|
    52|```bash
    53|# Fetch latest changes from upstream
    54|git fetch upstream
    55|
    56|# Switch to main branch and rebase
    57|git checkout master
    58|git rebase upstream/master
    59|
    60|# Push updated main to your fork
    61|git push origin master
    62|```
    63|
    64|### 4. Create a Feature Branch
    65|
    66|```bash
    67|# Create and switch to a new branch
    68|git checkout -b feature/your-feature-name
    69|
    70|# Or for bug fixes
    71|git checkout -b fix/issue-description
    72|```
    73|
    74|---
    75|
    76|## Development Setup
    77|
    78|SIFIX is organized across four repositories, each with its own setup steps.
    79|
    80|### sifix-agent (Core SDK)
    81|
    82|The AI security analysis engine — simulation, AI routing, risk scoring, and 0G Storage integration.
    83|
    84|```bash
    85|git clone https://github.com/sifix-ai/sifix-agent.git
    86|cd sifix-agent
    87|
    88|# Install dependencies
    89|pnpm install
    90|
    91|# Copy environment template
    92|cp .env.example .env
    93|# Edit .env with your API keys (OpenAI, Groq, 0G RPC, etc.)
    94|
    95|# Run tests
    96|pnpm test
    97|
    98|# Type check
    99|npx tsc --noEmit
   100|
   101|# Build the SDK
   102|pnpm build
   103|```
   104|
   105|**Key dependencies:** TypeScript, viem, OpenAI SDK, 0G SDK
   106|
   107|### sifix-dapp (Dashboard + API)
   108|
   109|The Next.js 16 web dashboard with 12 pages and 35 API routes for transaction history, risk reports, and portfolio insights.
   110|
   111|```bash
   112|git clone https://github.com/sifix-ai/sifix-dapp.git
   113|cd sifix-dapp
   114|
   115|# Install dependencies
   116|pnpm install
   117|
   118|# Copy environment template
   119|cp .env.example .env
   120|# Configure DATABASE_URL, 0G RPC, JWT secret, etc.
   121|
   122|# Push database schema to PostgreSQL
   123|pnpm db:push
   124|
   125|# (Optional) Open Prisma Studio to inspect data
   126|pnpm db:studio
   127|
   128|# Start dev server with hot reload
   129|pnpm dev
   130|
   131|# Build for production
   132|pnpm build
   133|
   134|# Lint
   135|pnpm lint
   136|```
   137|
   138|**Key dependencies:** Next.js 16, React 19, Prisma, Tailwind CSS, Lucide Icons
   139|
   140|### sifix-extension (Chrome Extension)
   141|
   142|The Plasmo-powered Manifest V3 browser extension for real-time wallet protection.
   143|
   144|```bash
   145|git clone https://github.com/sifix-ai/sifix-extension.git
   146|cd sifix-extension
   147|
   148|# Install dependencies
   149|pnpm install
   150|
   151|# Copy environment template
   152|cp .env.example .env
   153|# Configure SIFIX_API_URL, etc.
   154|
   155|# Start dev server (opens Chrome with extension loaded)
   156|pnpm dev
   157|
   158|# Build for production
   159|pnpm build
   160|```
   161|
   162|**Loading the extension manually:**
   163|
   164|1. Open `chrome://extensions` in Chrome
   165|2. Enable **Developer mode** (toggle in top-right)
   166|3. Click **Load unpacked**
   167|4. Select the `build/chrome-mv3-prod/` directory
   168|
   169|**Key dependencies:** Plasmo 0.88, React 18, Dexie (IndexedDB)
   170|
   171|### sifix-docs (Documentation)
   172|
   173|The documentation site you're reading right now.
   174|
   175|```bash
   176|git clone https://github.com/sifix-ai/sifix-docs.git
   177|cd sifix-docs
   178|
   179|# Install dependencies
   180|pnpm install
   181|
   182|# Start dev server with hot reload
   183|pnpm dev
   184|
   185|# Build static site
   186|pnpm build
   187|
   188|# Preview production build
   189|pnpm preview
   190|```
   191|
   192|**Key dependencies:** DocMD, Markdown
   193|
   194|---
   195|
   196|## Code Style
   197|
   198|### TypeScript
   199|
   200|All SIFIX repositories use **TypeScript in strict mode**. Follow these conventions:
   201|
   202|- **Strict mode** — Always enabled. No `any` types in production code
   203|- **Interfaces over types** — Prefer `interface` for object shapes; use `type` for unions and utilities
   204|- **async/await** — Always prefer `async/await` over `.then()` chains
   205|- **JSDoc for public APIs** — Every exported function, class, and interface must have JSDoc documentation
   206|
   207|```typescript
   208|/**
   209| * Analyzes a transaction for security risks using AI-powered simulation.
   210| *
   211| * @param params - Transaction parameters to analyze
   212| * @param params.from - Sender address (EIP-55 checksummed)
   213| * @param params.to - Recipient address or contract
   214| * @param params.value - ETH value in wei
   215| * @param params.data - Calldata (hex-encoded)
   216| * @returns Analysis result with risk score, verdict, and evidence
   217| *
   218| * @example
   219| * ```typescript
   220| * const result = await analyzeTransaction({
   221| *   from: '0x1234...',
   222| *   to: '0x5678...',
   223| *   value: parseEther('1.0'),
   224| *   data: '0x...'
   225| * });
   226| * ```
   227| */
   228|export async function analyzeTransaction(params: {
   229|  from: Address;
   230|  to: Address;
   231|  value?: bigint;
   232|  data?: Hex;
   233|}): Promise<AnalysisResult> {
   234|  const simulation = await simulateTransaction(params);
   235|  const aiVerdict = await analyzeWithAI(simulation);
   236|  return scoreRisk(aiVerdict);
   237|}
   238|```
   239|
   240|### Formatting and Linting
   241|
   242|All repos use Prettier and ESLint with shared configuration:
   243|
   244|```bash
   245|# Format code
   246|pnpm format
   247|
   248|# Check for lint errors
   249|pnpm lint
   250|
   251|# Auto-fix lint errors
   252|pnpm lint:fix
   253|```
   254|
   255|### General Guidelines
   256|
   257|- Use descriptive variable names — `riskScore` over `rs`
   258|- Keep functions small and focused — one function, one responsibility
   259|- Use `const` by default; `let` only when reassignment is needed
   260|- Prefer early returns over nested if-else blocks
   261|- Group related logic with blank lines and comments
   262|
   263|---
   264|
   265|## Commit Convention
   266|
   267|SIFIX follows [Conventional Commits](https://www.conventionalcommits.org/) for clean, machine-readable history:
   268|
   269|```
   270|<type>(<scope>): <description>
   271|
   272|[optional body]
   273|
   274|[optional footer(s)]
   275|```
   276|
   277|### Types
   278|
   279|- `feat:` — New feature
   280|- `fix:` — Bug fix
   281|- `docs:` — Documentation changes
   282|- `test:` — Adding or updating tests
   283|- `refactor:` — Code restructuring without behavior change
   284|- `perf:` — Performance improvements
   285|- `chore:` — Build, dependencies, tooling
   286|- `style:` — Formatting, semicolons, whitespace (no logic change)
   287|
   288|### Examples
   289|
   290|```
   291|feat(agent): add ERC-721 transaction analysis support
   292|fix(extension): handle reverted transactions correctly in popup
   293|docs(api): update REST API reference for v1.5.0
   294|test(agent): add tests for token approval detection
   295|chore(deps): update viem to v2.21.32
   296|refactor(scorer): extract risk scoring into separate module
   297|```
   298|
   299|### Scopes
   300|
   301|Common scopes across repositories:
   302|
   303|- **agent:** `sdk`, `simulator`, `analyzer`, `scorer`, `storage`
   304|- **dapp:** `api`, `dashboard`, `auth`, `components`
   305|- **extension:** `popup`, `background`, `content-script`, `badge`
   306|- **docs:** `guide`, `api-reference`, `community`
   307|
   308|---
   309|
   310|## Pull Request Process
   311|
   312|### 1. Update Your Branch
   313|
   314|Before opening a PR, ensure your branch is up to date with the latest `master`:
   315|
   316|```bash
   317|git fetch upstream
   318|git rebase upstream/master
   319|
   320|# Resolve any conflicts, then
   321|git push origin feature/your-feature-name --force-with-lease
   322|```
   323|
   324|### 2. Run All Checks
   325|
   326|Every PR must pass these checks before review:
   327|
   328|```bash
   329|# Run the full test suite
   330|pnpm test
   331|
   332|# Lint all files
   333|pnpm lint
   334|
   335|# Build the project (no errors)
   336|pnpm build
   337|
   338|# Type check (agent SDK only)
   339|npx tsc --noEmit
   340|```
   341|
   342|### 3. Push and Create PR
   343|
   344|```bash
   345|git push origin feature/your-feature-name
   346|```
   347|
   348|Open a Pull Request on GitHub with:
   349|
   350|- **Title** — Follows conventional commit format (e.g., `feat(agent): add ERC-721 analysis`)
   351|- **Description** — Explain what changed and why. Reference related issues (e.g., `Closes #42`)
   352|- **Screenshots/Video** — Required for any UI/UX changes
   353|- **Testing** — Describe how you tested the change. Include edge cases
   354|
   355|### 4. Code Review
   356|
   357|- **Address comments promptly** — Respond to every review comment, even if just "Done"
   358|- **Keep commits clean** — Squash related commits if asked; use interactive rebase
   359|- **Push fixes incrementally** — Don't force-push after review unless requested
   360|- **Be responsive and respectful** — Review is a collaborative process, not a gate
   361|
   362|### 5. Merge
   363|
   364|Once approved and all CI checks pass, a maintainer will squash-merge your PR into `master`.
   365|
   366|---
   367|
   368|## Areas to Contribute
   369|
   370|### Bug Fixes
   371|
   372|- Browse open [Issues](https://github.com/sifix-ai/sifix-agent/issues) tagged `bug`
   373|- Reproduce the issue locally
   374|- Write a failing test that demonstrates the bug
   375|- Fix the bug and verify the test passes
   376|- Submit a PR with `fix(scope): ...` commit
   377|
   378|### Features
   379|
   380|- Start a [Discussion](https://github.com/orgs/sifix-ai/discussions) before coding
   381|- Get feedback on the proposed approach
   382|- Implement with comprehensive tests
   383|- Update relevant documentation
   384|- Submit a PR with `feat(scope): ...` commit
   385|
   386|### Documentation
   387|
   388|- Fix typos and unclear explanations across all docs pages
   389|- Add code examples and real-world use cases
   390|- Improve API reference documentation with better parameter descriptions
   391|- Write tutorials and guides for new users
   392|- Translate documentation into additional languages
   393|
   394|### Testing
   395|
   396|- Increase test coverage in `sifix-agent` (unit and integration)
   397|- Add edge case tests for risk scoring thresholds
   398|- Write end-to-end tests for the extension's content scripts
   399|- Test API route error handling in `sifix-dapp`
   400|- Improve test reliability (reduce flaky tests)
   401|
   402|### UI/UX
   403|
   404|- Improve the dashboard layout and information architecture
   405|- Enhance the extension popup design for better readability
   406|- Add animations and micro-interactions for better feedback
   407|- Improve accessibility (keyboard navigation, screen readers, contrast)
   408|- Optimize for different screen sizes and resolutions
   409|
   410|---
   411|
   412|## Security Issues
   413|
   414|**Do NOT open public GitHub issues for security vulnerabilities.**
   415|
   416|If you discover a security vulnerability in SIFIX, report it responsibly:
   417|
   418|📧 **Email:** security@sifix.ai
   419|
   420|Include in your report:
   421|
   422|- **Description** — Clear explanation of the vulnerability
   423|- **Steps to reproduce** — Detailed walkthrough with inputs
   424|- **Potential impact** — What an attacker could achieve
   425|- **Suggested fix** — If you have one (optional but appreciated)
   426|
   427|**Response timeline:**
   428|
   429|- **Acknowledgment** — Within 48 hours
   430|- **Initial assessment** — Within 5 business days
   431|- **Resolution plan** — Communicated after assessment
   432|- **Disclosure** — Coordinated after fix is deployed
   433|
   434|We credit responsible disclosure in our changelog (with your permission).
   435|
   436|---
   437|
   438|## Repository Overview
   439|
   440|- **[sifix-agent](https://github.com/sifix-ai/sifix-agent)** — AI Security Agent SDK (TypeScript, viem, 0G SDK, OpenAI)
   441|- **[sifix-dapp](https://github.com/sifix-ai/sifix-dapp)** — Web Dashboard + API Backend (Next.js 16, Prisma, React 19)
   442|- **[sifix-extension](https://github.com/sifix-ai/sifix-extension)** — Chrome Extension MV3 (Plasmo, React 18, Dexie)
   443|- **[sifix-docs](https://github.com/sifix-ai/sifix-docs)** — Documentation Site (DocMD)
   444|
   445|---
   446|
   447|## License
   448|
   449|By contributing to SIFIX, you agree that your contributions will be licensed under the **MIT License**. All source code in the SIFIX repositories is open-source under MIT terms.
   450|