---
title: Contributing
description: How to contribute to SIFIX — code of conduct, development setup, code style, PR process, and contribution areas
---

# Contributing to SIFIX

We welcome contributions to SIFIX — AI-Powered Wallet Security for Web3. This guide covers everything you need to get started, from forking the repo to landing your first pull request.

---

## Code of Conduct

SIFIX is a community-driven security project, and we expect all contributors to uphold the following principles:

- **Be respectful** — Treat every contributor with courtesy and professionalism
- **Be inclusive** — Welcome developers of all experience levels, backgrounds, and perspectives
- **Be constructive** — Critique ideas, not people. Frame feedback in terms of improvements, not shortcomings
- **Be collaborative** — Share knowledge, help others debug, and celebrate contributions
- **Be responsible** — Remember that SIFIX is a security tool. Report vulnerabilities privately (see [Security Issues](#security-issues)), never publicly disclose exploits

Violations of the code of conduct can be reported to **security@sifix.ai**.

---

## Fork and Clone Workflow

All SIFIX repositories follow the same fork-based contribution model:

### 1. Fork the Repository

Navigate to the repository on GitHub and click **Fork** in the top-right corner. This creates a copy under your GitHub account.

### 2. Clone Your Fork

```bash
# Clone your fork (replace YOUR_USERNAME and REPO_NAME)
git clone https://github.com/YOUR_USERNAME/sifix-agent.git
cd sifix-agent

# Add the upstream remote to stay in sync
git remote add upstream https://github.com/sifix-ai/sifix-agent.git

# Verify remotes
git remote -v
# origin    https://github.com/YOUR_USERNAME/sifix-agent.git (fetch)
# upstream  https://github.com/sifix-ai/sifix-agent.git (fetch)
```

### 3. Keep Your Fork Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Switch to main branch and rebase
git checkout master
git rebase upstream/master

# Push updated main to your fork
git push origin master
```

### 4. Create a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

---

## Development Setup

SIFIX is organized across four repositories, each with its own setup steps.

### sifix-agent (Core SDK)

The AI security analysis engine — simulation, AI routing, risk scoring, and 0G Storage integration.

```bash
git clone https://github.com/sifix-ai/sifix-agent.git
cd sifix-agent

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
# Edit .env with your API keys (OpenAI, Groq, 0G RPC, etc.)

# Run tests
pnpm test

# Type check
npx tsc --noEmit

# Build the SDK
pnpm build
```

**Key dependencies:** TypeScript, viem, OpenAI SDK, 0G SDK

### sifix-dapp (Dashboard + API)

The Next.js 16 web dashboard with 12 pages and 35 API routes for transaction history, risk reports, and portfolio insights.

```bash
git clone https://github.com/sifix-ai/sifix-dapp.git
cd sifix-dapp

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
# Configure DATABASE_URL, 0G RPC, JWT secret, etc.

# Push database schema to SQLite
pnpm db:push

# (Optional) Open Prisma Studio to inspect data
pnpm db:studio

# Start dev server with hot reload
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint
```

**Key dependencies:** Next.js 16, React 19, Prisma, Tailwind CSS, Lucide Icons

### sifix-extension (Chrome Extension)

The Plasmo-powered Manifest V3 browser extension for real-time wallet protection.

```bash
git clone https://github.com/sifix-ai/sifix-extension.git
cd sifix-extension

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
# Configure SIFIX_API_URL, etc.

# Start dev server (opens Chrome with extension loaded)
pnpm dev

# Build for production
pnpm build
```

**Loading the extension manually:**

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `build/chrome-mv3-prod/` directory

**Key dependencies:** Plasmo 0.88, React 18, Dexie (IndexedDB)

### sifix-docs (Documentation)

The documentation site you're reading right now.

```bash
git clone https://github.com/sifix-ai/sifix-docs.git
cd sifix-docs

# Install dependencies
pnpm install

# Start dev server with hot reload
pnpm dev

# Build static site
pnpm build

# Preview production build
pnpm preview
```

**Key dependencies:** DocMD, Markdown

---

## Code Style

### TypeScript

All SIFIX repositories use **TypeScript in strict mode**. Follow these conventions:

- **Strict mode** — Always enabled. No `any` types in production code
- **Interfaces over types** — Prefer `interface` for object shapes; use `type` for unions and utilities
- **async/await** — Always prefer `async/await` over `.then()` chains
- **JSDoc for public APIs** — Every exported function, class, and interface must have JSDoc documentation

```typescript
/**
 * Analyzes a transaction for security risks using AI-powered simulation.
 *
 * @param params - Transaction parameters to analyze
 * @param params.from - Sender address (EIP-55 checksummed)
 * @param params.to - Recipient address or contract
 * @param params.value - ETH value in wei
 * @param params.data - Calldata (hex-encoded)
 * @returns Analysis result with risk score, verdict, and evidence
 *
 * @example
 * ```typescript
 * const result = await analyzeTransaction({
 *   from: '0x1234...',
 *   to: '0x5678...',
 *   value: parseEther('1.0'),
 *   data: '0x...'
 * });
 * ```
 */
export async function analyzeTransaction(params: {
  from: Address;
  to: Address;
  value?: bigint;
  data?: Hex;
}): Promise<AnalysisResult> {
  const simulation = await simulateTransaction(params);
  const aiVerdict = await analyzeWithAI(simulation);
  return scoreRisk(aiVerdict);
}
```

### Formatting and Linting

All repos use Prettier and ESLint with shared configuration:

```bash
# Format code
pnpm format

# Check for lint errors
pnpm lint

# Auto-fix lint errors
pnpm lint:fix
```

### General Guidelines

- Use descriptive variable names — `riskScore` over `rs`
- Keep functions small and focused — one function, one responsibility
- Use `const` by default; `let` only when reassignment is needed
- Prefer early returns over nested if-else blocks
- Group related logic with blank lines and comments

---

## Commit Convention

SIFIX follows [Conventional Commits](https://www.conventionalcommits.org/) for clean, machine-readable history:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `test:` — Adding or updating tests
- `refactor:` — Code restructuring without behavior change
- `perf:` — Performance improvements
- `chore:` — Build, dependencies, tooling
- `style:` — Formatting, semicolons, whitespace (no logic change)

### Examples

```
feat(agent): add ERC-721 transaction analysis support
fix(extension): handle reverted transactions correctly in popup
docs(api): update REST API reference for v1.5.0
test(agent): add tests for token approval detection
chore(deps): update viem to v2.21.32
refactor(scorer): extract risk scoring into separate module
```

### Scopes

Common scopes across repositories:

- **agent:** `sdk`, `simulator`, `analyzer`, `scorer`, `storage`
- **dapp:** `api`, `dashboard`, `auth`, `components`
- **extension:** `popup`, `background`, `content-script`, `badge`
- **docs:** `guide`, `api-reference`, `community`

---

## Pull Request Process

### 1. Update Your Branch

Before opening a PR, ensure your branch is up to date with the latest `master`:

```bash
git fetch upstream
git rebase upstream/master

# Resolve any conflicts, then
git push origin feature/your-feature-name --force-with-lease
```

### 2. Run All Checks

Every PR must pass these checks before review:

```bash
# Run the full test suite
pnpm test

# Lint all files
pnpm lint

# Build the project (no errors)
pnpm build

# Type check (agent SDK only)
npx tsc --noEmit
```

### 3. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Open a Pull Request on GitHub with:

- **Title** — Follows conventional commit format (e.g., `feat(agent): add ERC-721 analysis`)
- **Description** — Explain what changed and why. Reference related issues (e.g., `Closes #42`)
- **Screenshots/Video** — Required for any UI/UX changes
- **Testing** — Describe how you tested the change. Include edge cases

### 4. Code Review

- **Address comments promptly** — Respond to every review comment, even if just "Done"
- **Keep commits clean** — Squash related commits if asked; use interactive rebase
- **Push fixes incrementally** — Don't force-push after review unless requested
- **Be responsive and respectful** — Review is a collaborative process, not a gate

### 5. Merge

Once approved and all CI checks pass, a maintainer will squash-merge your PR into `master`.

---

## Areas to Contribute

### Bug Fixes

- Browse open [Issues](https://github.com/sifix-ai/sifix-agent/issues) tagged `bug`
- Reproduce the issue locally
- Write a failing test that demonstrates the bug
- Fix the bug and verify the test passes
- Submit a PR with `fix(scope): ...` commit

### Features

- Start a [Discussion](https://github.com/orgs/sifix-ai/discussions) before coding
- Get feedback on the proposed approach
- Implement with comprehensive tests
- Update relevant documentation
- Submit a PR with `feat(scope): ...` commit

### Documentation

- Fix typos and unclear explanations across all docs pages
- Add code examples and real-world use cases
- Improve API reference documentation with better parameter descriptions
- Write tutorials and guides for new users
- Translate documentation into additional languages

### Testing

- Increase test coverage in `sifix-agent` (unit and integration)
- Add edge case tests for risk scoring thresholds
- Write end-to-end tests for the extension's content scripts
- Test API route error handling in `sifix-dapp`
- Improve test reliability (reduce flaky tests)

### UI/UX

- Improve the dashboard layout and information architecture
- Enhance the extension popup design for better readability
- Add animations and micro-interactions for better feedback
- Improve accessibility (keyboard navigation, screen readers, contrast)
- Optimize for different screen sizes and resolutions

---

## Security Issues

**Do NOT open public GitHub issues for security vulnerabilities.**

If you discover a security vulnerability in SIFIX, report it responsibly:

📧 **Email:** security@sifix.ai

Include in your report:

- **Description** — Clear explanation of the vulnerability
- **Steps to reproduce** — Detailed walkthrough with inputs
- **Potential impact** — What an attacker could achieve
- **Suggested fix** — If you have one (optional but appreciated)

**Response timeline:**

- **Acknowledgment** — Within 48 hours
- **Initial assessment** — Within 5 business days
- **Resolution plan** — Communicated after assessment
- **Disclosure** — Coordinated after fix is deployed

We credit responsible disclosure in our changelog (with your permission).

---

## Repository Overview

- **[sifix-agent](https://github.com/sifix-ai/sifix-agent)** — AI Security Agent SDK (TypeScript, viem, 0G SDK, OpenAI)
- **[sifix-dapp](https://github.com/sifix-ai/sifix-dapp)** — Web Dashboard + API Backend (Next.js 16, Prisma, React 19)
- **[sifix-extension](https://github.com/sifix-ai/sifix-extension)** — Chrome Extension MV3 (Plasmo, React 18, Dexie)
- **[sifix-docs](https://github.com/sifix-ai/sifix-docs)** — Documentation Site (DocMD)

---

## License

By contributing to SIFIX, you agree that your contributions will be licensed under the **MIT License**. All source code in the SIFIX repositories is open-source under MIT terms.
