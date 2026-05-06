---
title: SIFIX
description: AI-Powered Wallet Security for Web3
---

# SIFIX

**AI-Powered Wallet Security for Web3**

SIFIX is an autonomous AI agent that protects Web3 users by intercepting wallet transactions, simulating them, analyzing risks using AI, and reporting threats to an on-chain reputation system.

## 🎯 Problem

Web3 users face constant threats:
- Phishing attacks
- Malicious smart contracts
- Rug pulls
- Approval scams
- Hidden risks in complex DeFi interactions

Traditional wallets only show raw transaction data. Users can't assess risks before signing.

## 💡 Solution

SIFIX adds an AI security layer between users and blockchain:

1. **Intercept** - Catches transactions before execution
2. **Simulate** - Runs transaction in safe environment
3. **Analyze** - AI evaluates risks and explains threats
4. **Report** - Shares threat intelligence on-chain
5. **Protect** - Users make informed decisions

## 🏗️ Architecture

```
┌─────────────────┐
│  Browser Wallet │
│   (MetaMask)    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ SIFIX    │
    │Extension │
    └────┬─────┘
         │
    ┌────▼─────────┐
    │ SIFIX Agent  │
    │ (AI + Sim)   │
    └────┬─────────┘
         │
    ┌────▼──────────┐
    │ 0G Chain      │
    │ (Reputation)  │
    └───────────────┘
```

## 📦 Repositories

- [sifix-agent](https://github.com/sifix-ai/sifix-agent) - Core AI security engine
- [sifix-extension](https://github.com/sifix-ai/sifix-extension) - Browser extension
- [sifix-contracts](https://github.com/sifix-ai/sifix-contracts) - Smart contracts
- [sifix-docs](https://github.com/sifix-ai/sifix-docs) - Documentation

## 🚀 Quick Start

### For Users

1. Install SIFIX Extension from Chrome Web Store
2. Connect your wallet (MetaMask, etc.)
3. Browse Web3 dApps normally
4. SIFIX automatically protects your transactions

### For Developers

```bash
# Clone repos
git clone https://github.com/sifix-ai/sifix-agent
git clone https://github.com/sifix-ai/sifix-extension
git clone https://github.com/sifix-ai/sifix-contracts

# Install dependencies
cd sifix-agent && pnpm install
cd sifix-extension && pnpm install
cd sifix-contracts && pnpm install

# Run tests
pnpm test
```

## 🛡️ Risk Levels

| Level | Score | Color | Action |
|-------|-------|-------|--------|
| SAFE | 0-20 | 🟢 Green | Auto-proceed |
| LOW | 20-40 | 🔵 Blue | Warn user |
| MEDIUM | 40-60 | 🟡 Yellow | Simulate recommended |
| HIGH | 60-80 | 🔴 Red | Block recommended |
| CRITICAL | 80-100 | 🚨 Dark Red | Block strongly |

## 🔗 Built on 0G Chain

SIFIX leverages 0G Chain's infrastructure:
- **0G Storage** - Decentralized threat intelligence database
- **0G Compute** - AI inference for risk analysis
- **Smart Contracts** - On-chain reputation system

## 📄 License

MIT

## 🤝 Contributing

We welcome contributions! See [Contributing Guide](./contributing) for guidelines.

## 📧 Contact

- Twitter: [@sifix_ai](https://twitter.com/sifix_ai)
- Discord: [Join our community](https://discord.gg/sifix)
- Email: team@sifix.ai
