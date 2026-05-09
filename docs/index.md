---
title: SIFIX Docs
description: AI-Powered Wallet Security for Web3
---

<div align="center">

# SIFIX

**AI-Powered Wallet Security for Web3**

[![0G Galileo](https://img.shields.io/badge/Network-0G%20Galileo-3b9eff?style=flat-square)](https://chainscan-galileo.0g.ai)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6?style=flat-square)](https://www.typescriptlang.org)
[![SDK v1.5.0](https://img.shields.io/badge/SDK-v1.5.0-22c55e?style=flat-square)](https://github.com/sifix-ai/sifix-agent)
[![MIT License](https://img.shields.io/badge/License-MIT-a855f7?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

---

SIFIX is an autonomous AI security agent that protects Web3 users by intercepting wallet transactions, simulating them in a sandbox, analyzing risks with AI, and storing evidence on-chain.

## Documentation

### Overview

Start here to understand what SIFIX is and why it matters.

- **[Introduction](./overview/introduction)** — What is SIFIX, key capabilities, system overview
- **[Problem Statement](./overview/problem-statement)** — Web3 threat landscape and why traditional wallets fail
- **[Solution](./overview/solution)** — 5-step protection pipeline and risk scoring
- **[Tech Stack](./overview/tech-stack)** — Technologies used and why

### Product

Deep dive into each SIFIX component.

- **[Browser Extension](./product/extension)** — Chrome MV3 extension, content scripts, domain safety
- **[Dashboard](./product/dashboard)** — Web dashboard, 12 pages, design system
- **[AI Agent SDK](./product/ai-agent)** — Core security engine, 6 modules, historical learning
- **[Agentic Identity](./product/agentic-identity)** — ERC-7857 on-chain identity
- **[0G Integration](./product/0g-integration)** — Storage, Compute, and EVM on 0G Galileo

### Architecture

Technical architecture for developers and auditors.

- **[System Overview](./architecture/system-overview)** — Full system architecture diagram
- **[Data Flow](./architecture/data-flow)** — 6-step analysis pipeline with interfaces
- **[Security Model](./architecture/security-model)** — Security considerations and threat model
- **[Database Schema](./architecture/database-schema)** — 13 Prisma models with ER diagram
- **[Auth Flow](./architecture/auth-flow)** — SIWE authentication deep dive

### Guides

Step-by-step guides to get started.

- **[Installation](./guides/installation)** — Install and set up all components
- **[Configuration](./guides/configuration)** — Environment variables and provider config
- **[Quick Start](./guides/quick-start)** — 5-minute quick start guide
- **[Extension Setup](./guides/extension-setup)** — Build and load the Chrome extension
- **[Deployment](./guides/deployment)** — Deploy to production (Vercel, GitHub Pages)

### API Reference

Complete API documentation.

- **[Agent SDK](./api-reference/agent-sdk)** — @sifix/agent v1.5.0 TypeScript API
- **[REST API](./api-reference/rest-api)** — 35 dApp API endpoints
- **[Extension API](./api-reference/extension-api)** — Chrome message API
- **[0G Storage API](./api-reference/0g-storage-api)** — On-chain evidence storage

### Examples

Working code examples for common use cases.

- **[Basic Analysis](./examples/basic-analysis)** — ETH transfer, token approval, NFT analysis
- **[AI Providers](./examples/ai-providers)** — 0G Compute, OpenAI, Groq, OpenRouter, Ollama
- **[Storage](./examples/storage)** — 0G Storage upload, retrieve, verify, mock mode
- **[Advanced](./examples/advanced)** — Batch analysis, custom providers, webhooks, extension integration

### Community

- **[Contributing](./community/contributing)** — How to contribute, code style, PR process
- **[Changelog](./community/changelog)** — Version history and roadmap
- **[FAQ](./community/faq)** — Frequently asked questions

## Repositories

| Repository | Description |
|---|---|
| [sifix-agent](https://github.com/sifix-ai/sifix-agent) | AI Security Agent SDK (TypeScript) |
| [sifix-dapp](https://github.com/sifix-ai/sifix-dapp) | Web Dashboard + REST API (Next.js 16) |
| [sifix-extension](https://github.com/sifix-ai/sifix-extension) | Chrome Extension (Plasmo MV3) |
| [sifix-docs](https://github.com/sifix-ai/sifix-docs) | Documentation (DocMD) |

## Built for 0G Chain APAC Hackathon 2026

SIFIX is built on [0G Chain](https://0g.ai) infrastructure:
- **0G Storage** — Decentralized immutable evidence storage
- **0G Compute** — On-chain AI inference
- **0G EVM** — Smart contracts and SIWE authentication
- **ERC-7857** — Agentic Identity for AI agent verification

## License

MIT License
