---
title: Contributing
description: How to contribute to SIFIX
---

# Contributing

We welcome contributions to SIFIX. This guide covers everything you need to get started.

## Code of Conduct

Be respectful, inclusive, and constructive. We are building security tools for the Web3 community.

## Quick Start

### 1. Fork and Clone

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/sifix-agent.git
cd sifix-agent

# Add upstream remote
git remote add upstream https://github.com/sifix-ai/sifix-agent.git
```

### 2. Install and Build

```bash
pnpm install
pnpm build
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

## Development Workflow

### sifix-agent (SDK)

```bash
cd sifix-agent

# Run tests
pnpm test

# Build
pnpm build

# Type check
npx tsc --noEmit
```

### sifix-dapp (Dashboard + API)

```bash
cd sifix-dapp

# Start dev server (hot reload)
pnpm dev

# Database operations
pnpm db:push       # Push schema to SQLite
pnpm db:studio     # Open Prisma Studio

# Build for production
pnpm build

# Lint
pnpm lint
```

### sifix-extension (Chrome Extension)

```bash
cd sifix-extension

# Start dev server (hot reload, opens Chrome)
pnpm dev

# Build for production
pnpm build

# Load in Chrome:
# 1. Open chrome://extensions
# 2. Enable Developer mode
# 3. Load unpacked → build/chrome-mv3-prod/
```

### sifix-docs (Documentation)

```bash
cd sifix-docs

# Start dev server (hot reload)
pnpm dev

# Build static site
pnpm build

# Preview production build
pnpm preview
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use `async/await` over `.then()`
- Add JSDoc comments for all public APIs

```typescript
/**
 * Analyzes a transaction for security risks.
 *
 * @param params - Transaction parameters
 * @param params.from - Sender address
 * @param params.to - Recipient address
 * @returns Analysis result with risk level and explanation
 */
export async function analyzeTransaction(params: {
  from: Address;
  to: Address;
}): Promise<AnalysisResult> {
  // ...
}
```

### Formatting

```bash
# Format code
pnpm format

# Lint
pnpm lint
pnpm lint:fix
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add ERC-721 transaction analysis support
fix: handle reverted transactions correctly
docs: update API reference for v1.5.0
test: add tests for token approval detection
chore: update dependencies
refactor: extract risk scoring into separate module
```

## Pull Request Process

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/master
```

### 2. Run Checks

```bash
pnpm test
pnpm lint
pnpm build
```

### 3. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a Pull Request on GitHub with:
- Clear title following conventional commits
- Description of what changed and why
- Screenshots/videos for UI changes
- Link to related issues

### 4. Code Review

- Address review comments promptly
- Keep commits clean (squash if needed)
- Be responsive and respectful

## Areas to Contribute

### Bug Fixes

- Check [Issues](https://github.com/sifix-ai/sifix-agent/issues) for open bugs
- Reproduce the issue
- Write a failing test first
- Fix the bug
- Verify test passes

### Features

- Start a [Discussion](https://github.com/orgs/sifix-ai/discussions) first
- Get feedback on the approach
- Implement with tests
- Update documentation

### Documentation

- Fix typos and unclear explanations
- Add code examples and use cases
- Improve API documentation
- Write tutorials

### Testing

- Increase test coverage
- Add edge case tests
- Improve test reliability
- Add integration tests

## Security Issues

**Do NOT open public issues for security vulnerabilities.**

Email security@sifix.ai with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours.

## Repository Structure

| Repository | Purpose | Tech Stack |
|---|---|---|
| [sifix-agent](https://github.com/sifix-ai/sifix-agent) | AI Security Agent SDK | TypeScript, 0G SDK, OpenAI, viem |
| [sifix-dapp](https://github.com/sifix-ai/sifix-dapp) | Web Dashboard + API Backend | Next.js 16, Prisma, React 19 |
| [sifix-extension](https://github.com/sifix-ai/sifix-extension) | Chrome Extension (MV3) | Plasmo, React 18, Dexie |
| [sifix-docs](https://github.com/sifix-ai/sifix-docs) | Documentation Site | DocMD |

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
