---
title: Contributing
description: How to contribute to SIFIX
---

# Contributing

We welcome contributions to SIFIX! This guide will help you get started.

## Code of Conduct

Be respectful, inclusive, and constructive. We're building security tools for the Web3 community.

## Getting Started

### 1. Fork & Clone

```bash
# Fork on GitHub, then clone
git clone https://github.com/YOUR_USERNAME/sifix-agent
cd sifix-agent

# Add upstream remote
git remote add upstream https://github.com/sifix-ai/sifix-agent
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

## Development Workflow

### Agent Development

```bash
cd sifix-agent

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build
pnpm build

# Type check
pnpm typecheck
```

### Extension Development

```bash
cd sifix-extension

# Start dev server (hot reload)
pnpm dev

# Build for production
pnpm build

# Load in Chrome
# 1. Open chrome://extensions
# 2. Enable Developer mode
# 3. Load unpacked: build/chrome-mv3-prod/
```

### Contracts Development

```bash
cd sifix-contracts

# Compile contracts
pnpm hardhat compile

# Run tests
pnpm hardhat test

# Deploy to testnet
pnpm hardhat run scripts/deploy.ts --network zerog-testnet
```

## Testing

### Unit Tests

```typescript
// src/core/simulator.test.ts
import { describe, it, expect } from 'vitest';
import { simulateTransaction } from './simulator';

describe('simulateTransaction', () => {
  it('should simulate ETH transfer', async () => {
    const result = await simulateTransaction({
      from: '0x...',
      to: '0x...',
      data: '0x',
      value: '0x16345785d8a0000'
    });
    
    expect(result.success).toBe(true);
    expect(result.gasUsed).toBeGreaterThan(0n);
  });
});
```

### Integration Tests

```typescript
// tests/integration/agent.test.ts
import { SecurityAgent } from '../src';

describe('SecurityAgent Integration', () => {
  it('should analyze real transaction', async () => {
    const agent = new SecurityAgent({
      rpcUrl: process.env.RPC_URL,
      openaiApiKey: process.env.OPENAI_API_KEY,
      contractAddress: process.env.CONTRACT_ADDRESS
    });
    
    const result = await agent.analyzeTransaction({
      from: '0x...',
      to: '0x...',
      data: '0x...',
      value: '0x0'
    });
    
    expect(result.riskLevel).toBeDefined();
    expect(result.explanation).toBeTruthy();
  });
});
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use `async/await` over `.then()`
- Add JSDoc comments for public APIs

```typescript
/**
 * Analyzes a transaction for security risks.
 * 
 * @param tx - Transaction to analyze
 * @returns Analysis result with risk level and explanation
 * @throws {SimulationError} If simulation fails
 */
export async function analyzeTransaction(
  tx: Transaction
): Promise<AnalysisResult> {
  // Implementation
}
```

### Formatting

We use Prettier for code formatting:

```bash
pnpm format
```

### Linting

We use ESLint for code quality:

```bash
pnpm lint
pnpm lint:fix
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for ERC-721 analysis
fix: handle reverted transactions correctly
docs: update API reference
test: add tests for token approval detection
chore: update dependencies
```

## Pull Request Process

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Run Tests

```bash
pnpm test
pnpm lint
pnpm typecheck
```

### 3. Push & Create PR

```bash
git push origin feature/your-feature-name
```

Then create a PR on GitHub with:
- Clear title following conventional commits
- Description of what changed and why
- Screenshots/videos for UI changes
- Link to related issues

### 4. Code Review

- Address review comments
- Keep commits clean (squash if needed)
- Be responsive and respectful

### 5. Merge

Once approved, maintainers will merge your PR.

## Areas to Contribute

### 🐛 Bug Fixes

- Check [Issues](https://github.com/sifix-ai/sifix-agent/issues) for bugs
- Reproduce the bug
- Write a failing test
- Fix the bug
- Verify test passes

### ✨ Features

- Discuss in [Discussions](https://github.com/sifix-ai/sifix-agent/discussions) first
- Get feedback on approach
- Implement with tests
- Update documentation

### 📚 Documentation

- Fix typos and unclear explanations
- Add examples and use cases
- Improve API documentation
- Write tutorials

### 🧪 Testing

- Increase test coverage
- Add edge case tests
- Improve test reliability
- Add integration tests

### 🎨 UI/UX

- Improve extension popup design
- Better error messages
- Loading states and animations
- Accessibility improvements

## Security Issues

**Do NOT open public issues for security vulnerabilities.**

Email security@sifix.ai with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We'll respond within 48 hours.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- [Discussions](https://github.com/sifix-ai/sifix-agent/discussions) - Ask questions
- [Discord](https://discord.gg/sifix) - Chat with the community
- [Twitter](https://twitter.com/sifix_ai) - Follow for updates

Thank you for contributing to SIFIX! 🛡️
