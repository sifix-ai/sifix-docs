---
title: SIFIX Docs
description: AI-Powered Wallet Security for Web3
---

<div align="center">

# 🛡️ SIFIX

**AI-Powered Wallet Security for Web3**

*Every 14 seconds, a Web3 user falls victim to a scam. SIFIX stops it before it happens.*

<p class="hero-badges" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0 0;">
  <a href="https://chainscan-galileo.0g.ai"><img src="https://img.shields.io/badge/Network-0G%20Galileo-3b9eff?style=flat-square" alt="0G Galileo" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/Language-TypeScript-3178c6?style=flat-square" alt="TypeScript" /></a>
  <a href="https://github.com/sifix-ai/sifix-agent"><img src="https://img.shields.io/badge/SDK-v1.5.0-22c55e?style=flat-square" alt="SDK v1.5.0" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-a855f7?style=flat-square" alt="MIT License" /></a>
</p>

</div>

---

## The Problem

Web3 was supposed to set us free. Instead, it created a $9 billion problem.

In 2024 alone, users lost **$9 billion** to phishing attacks, rug pulls, and malicious smart contracts. Traditional wallets are blind — they sign whatever you ask them to, with no understanding of *what* they're signing or *why* it might be dangerous.

The result? A broken trust model where one wrong click can wipe out a lifetime of savings.

**We built SIFIX to fix this.**

## Meet SIFIX

SIFIX is an **autonomous AI security agent** that sits between you and the blockchain. Before any transaction reaches the network, SIFIX:

1. **Intercepts** the transaction from your wallet
2. **Simulates** it in a safe sandbox environment
3. **Analyzes** the risk using AI-powered intelligence
4. **Scores** the transaction on a clear 0–100 risk scale
5. **Stores** cryptographic evidence on-chain for accountability

Think of it as a **real-time security checkpoint** for every Web3 transaction — powered by AI, backed by immutable on-chain proof.

> 💡 **Non-technical?** Here's the simple version: SIFIX is like having a security expert look over your shoulder every time you click "Approve" in your wallet, warning you *before* you do something dangerous — and keeping a tamper-proof record of every analysis.

---

## Documentation

### 📖 Overview

*Start here if you're new to SIFIX or Web3 security.*

Understand the problem we're solving, how SIFIX works at a high level, and the technology behind it.

- **[Introduction](./overview/introduction)** — What is SIFIX, key capabilities, system overview
- **[Problem Statement](./overview/problem-statement)** — Web3 threat landscape and why traditional wallets fail
- **[Solution](./overview/solution)** — 5-step protection pipeline and risk scoring
- **[Tech Stack](./overview/tech-stack)** — Technologies used and why

### 🧩 Product

*Explore the components that make up SIFIX — for product managers, designers, and curious minds.*

Each component is independently useful. Together, they form a complete security system.

- **[Browser Extension](./product/extension)** — Chrome MV3 extension, content scripts, domain safety
- **[Dashboard](./product/dashboard)** — Web dashboard, 12 pages, design system
- **[AI Agent SDK](./product/ai-agent)** — Core security engine, 6 modules, historical learning
- **[Agentic Identity](./product/agentic-identity)** — ERC-7857 on-chain identity for AI agent verification
- **[0G Integration](./product/0g-integration)** — Storage, Compute, and EVM on 0G Galileo

### 🏗️ Architecture

*For developers, security auditors, and technical evaluators.*

Dive into how the system is designed — data flows, security models, and database schemas.

- **[System Overview](./architecture/system-overview)** — Full system architecture diagram
- **[Data Flow](./architecture/data-flow)** — 6-step analysis pipeline with interfaces
- **[Security Model](./architecture/security-model)** — Security considerations and threat model
- **[Database Schema](./architecture/database-schema)** — 13 Prisma models with ER diagram
- **[Auth Flow](./architecture/auth-flow)** — SIWE authentication deep dive

### 🚀 Guides

*Get SIFIX running in 5 minutes — for developers and hackathon evaluators.*

Step-by-step instructions to install, configure, and deploy every component.

- **[Installation](./guides/installation)** — Install and set up all components
- **[Configuration](./guides/configuration)** — Environment variables and provider config
- **[Quick Start](./guides/quick-start)** — 5-minute quick start guide
- **[Extension Setup](./guides/extension-setup)** — Build and load the Chrome extension
- **[Deployment](./guides/deployment)** — Deploy to production (Vercel, GitHub Pages)

### 🔌 API Reference

*For developers integrating SIFIX — complete API documentation.*

- **[Agent SDK](./api-reference/agent-sdk)** — @sifix/agent v1.5.0 TypeScript API
- **[REST API](./api-reference/rest-api)** — 35 dApp API endpoints
- **[Extension API](./api-reference/extension-api)** — Chrome message API
- **[0G Storage API](./api-reference/0g-storage-api)** — On-chain evidence storage

### 💡 Examples

*Working code you can run right now — for developers who learn by doing.*

- **[Basic Analysis](./examples/basic-analysis)** — ETH transfer, token approval, NFT analysis
- **[AI Providers](./examples/ai-providers)** — 0G Compute, OpenAI, Groq, OpenRouter, Ollama
- **[Storage](./examples/storage)** — 0G Storage upload, retrieve, verify, mock mode
- **[Advanced](./examples/advanced)** — Batch analysis, custom providers, webhooks, extension integration

### 🤝 Community

*Join us — contributors, integrators, and the curious are all welcome.*

- **[Contributing](./community/contributing)** — How to contribute, code style, PR process
- **[Changelog](./community/changelog)** — Version history and roadmap
- **[FAQ](./community/faq)** — Frequently asked questions

---

## Repositories

**sifix-agent** — AI Security Agent SDK (TypeScript)
🔗 [github.com/sifix-ai/sifix-agent](https://github.com/sifix-ai/sifix-agent)

**sifix-dapp** — Web Dashboard + REST API (Next.js 16)
🔗 [github.com/sifix-ai/sifix-dapp](https://github.com/sifix-ai/sifix-dapp)

**sifix-extension** — Chrome Extension (Plasmo MV3)
🔗 [github.com/sifix-ai/sifix-extension](https://github.com/sifix-ai/sifix-extension)

**sifix-docs** — Documentation (DocMD)
🔗 [github.com/sifix-ai/sifix-docs](https://github.com/sifix-ai/sifix-docs)

---

## 🏆 Built for 0G Chain APAC Hackathon 2026

SIFIX is built on [0G Chain](https://0g.ai) infrastructure — the decentralized AI network that makes trustless security analysis possible.

- **0G Storage** — Decentralized immutable evidence storage
- **0G Compute** — On-chain AI inference
- **0G EVM** — Smart contracts and SIWE authentication
- **ERC-7857** — Agentic Identity for AI agent verification

## License

MIT License — build freely, protect everyone.
