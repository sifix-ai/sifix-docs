---
title: Problem Statement
description: The Web3 security crisis — why $3.8 billion was lost in 2022 and why traditional wallets can't protect users
---

# Problem Statement

## The Web3 Security Crisis

Web3 was designed to give users financial sovereignty — but sovereignty without security is a liability. Every year, billions of dollars are drained from wallets through attacks that exploit the fundamental opacity of blockchain transactions. Users sign payloads they don't understand, interact with contracts they can't audit, and trust interfaces that can be spoofed in seconds.

The numbers tell the story:

- **$3.8 billion** lost to crypto scams and exploits in 2022 (Chainalysis)
- **$1.7 billion** stolen in 2023 across 60+ major hacks (DeFiLlama)
- **303 million** malicious transactions detected by leading security firms in 2023
- **67%** of crypto investors have experienced at least one security incident
- Average loss per phishing victim: **$7,000+**

This isn't a user education problem — it's an **infrastructure problem**. The tools don't exist at the wallet layer to give users meaningful, real-time protection.

---

## Threat Landscape

### 🎣 Phishing Attacks ($3.8B+ Total Losses)

Phishing remains the most effective attack vector in Web3. Attackers clone popular dApp interfaces (Uniswap, OpenSea,Blur) and lure users into signing malicious transactions. The payloads look identical to legitimate operations but silently drain wallets.

**How it works:**
1. Attacker creates a pixel-perfect clone of a trusted dApp
2. User connects wallet and initiates what appears to be a normal action (swap, listing, claim)
3. The actual transaction is a `transferFrom` or `approve` call that grants the attacker full token access
4. Funds are drained within seconds — often before the user notices

**Real example:** In 2022, a single phishing ring operating through fake airdrop campaigns drained over **$15 million** from hundreds of wallets in a matter of weeks. The transactions looked like standard ERC-20 approvals.

---

### 💀 Malicious Smart Contracts

Attackers deploy contracts with hidden logic — functions that appear benign but contain backdoors, hidden fee mechanisms, or rug pull triggers. Even experienced developers struggle to audit contract interaction at the point of signing.

**Common patterns:**
- **Honeypots** — Tokens that can be bought but not sold
- **Hidden mint functions** — Contracts that can mint unlimited tokens to the creator, diluting value
- **Reentrancy traps** — Contracts that exploit call ordering to drain funds during interaction
- **Proxy manipulation** — Upgradeable contracts that switch implementation post-audit

---

### 🏃 Rug Pulls

Developers build seemingly legitimate projects, accumulate TVL, then drain liquidity. These aren't always obvious — many rug pulls occur through gradual mechanisms:

- **Liquidity removal** — Developer pulls LP tokens from the pool
- **Token unlock dumps** — Team tokens vest and are sold simultaneously
- **Fee escalation** — Smart contract fees silently increase to 100%
- **Governance takeover** — Malicious proposals pass during low participation

**Impact:** Rug pulls accounted for over **$1.3 billion** in losses across 2022–2023, making them the single largest category of DeFi exploits.

---

### ✅ Approval / Permit Scams

ERC-20 `approve()` and EIP-2612 `permit()` signatures are the most dangerous blind spots in wallet security. A single approval can grant unlimited token access to any address — and users have no way to understand what they're approving from the wallet interface alone.

**The permit problem is especially severe:**
- EIP-2612 permits are **off-chain signatures** — they don't even appear as transactions until the attacker submits them
- Users see "Sign this message to claim your airdrop" — the actual permit grants unlimited spending allowance
- Permits can be **submitted at any time** — attackers often wait days or weeks before exploiting collected permits

**Real example:** The "Uniswap exploit" phishing campaign in late 2022 collected over **4,000 permit signatures** through a fake airdrop site, resulting in **$14.3 million** in token drains over the following month.

---

### 🌫️ Dusting Attacks

Attackers send tiny amounts of tokens ("dust") to thousands of addresses. These tokens often contain malicious metadata or are part of address-poisoning schemes that trick users into sending funds to look-alike addresses.

**How it works:**
1. Attacker sends dust tokens with a fake token name/contract that mimics a legitimate project
2. The dust appears in the user's wallet with a misleading name and "value"
3. Users attempt to swap or interact with the dust token, triggering a malicious contract
4. Alternatively, the attacker creates a send address that looks similar to one the user has previously transacted with, relying on the dust to appear in history

---

## Why Traditional Wallets Fail

### No Transaction Preview

When a user clicks "Sign" in MetaMask, they see a hex-encoded `data` field and a gas estimate. There is no human-readable breakdown of what the transaction will actually do. For complex DeFi interactions (multicall, proxy contracts, permit2), the calldata is completely opaque.

### Static Blocklists Don't Scale

Most wallet security relies on maintain lists of known-bad addresses and contract hashes. This approach:
- Can't detect **zero-day** attacks (new contracts, new phishing domains)
- Requires **constant manual updates** with hours-to-days of lag
- Is trivially bypassed by deploying a **new contract address** for each attack campaign
- Produces **high false-negative rates** — novel attacks pass through undetected

### No Semantic Understanding

Traditional tools analyze transaction structure — they don't understand transaction **intent**. A legitimate swap and a malicious drain can have identical function signatures. Without AI, there's no way to distinguish "user is approving Uniswap router to spend 100 USDC for a swap" from "user is approving attacker address to spend unlimited USDC."

### Reactive, Not Proactive

Most security tools alert users **after** a transaction is confirmed. By then, the funds are gone. The protection window is the moment **before** the signature — and that's exactly where current wallets provide the least information.

---

## Why AI is the Answer

The fundamental insight behind SIFIX is that **transaction security is a classification problem** — and modern AI is exceptionally good at classification when given the right inputs.

**AI provides what static analysis cannot:**

- **Semantic understanding** — AI models can interpret the *intent* of a transaction, not just its structure. "This approval is giving unlimited access to an unknown address" vs. "This approval is a standard Uniswap router interaction."
- **Pattern recognition** — Models trained on millions of transactions can identify attack patterns that no rule set could enumerate: novel reentrancy, disguised proxy calls, unusual token flows.
- **Adaptive threat detection** — AI doesn't need a blocklist. It can identify suspicious behavior based on characteristics, not just identity. A brand-new contract deploying and immediately receiving approvals? Flagged.
- **Natural language explanation** — Instead of showing hex calldata, AI can tell users in plain English: *"This transaction will transfer 2.5 ETH to an address you've never interacted with before. This address has been associated with 47 reported scams."*

**The challenge is putting AI in the right place** — directly in the transaction signing flow, with access to simulation data, before the user clicks confirm. That's exactly what SIFIX does.

---

## Summary

| Factor | Current State | SIFIX Approach |
|---|---|
| Transaction visibility | Hex calldata, no interpretation | Human-readable simulation + AI analysis |
| Threat detection | Static blocklists, hours of lag | Real-time AI classification, zero-day capable |
| Protection timing | Post-transaction alerts | Pre-signature interception |
| User understanding | "Approve this transaction" | "This transaction will drain your USDC — here's why" |
| Attack coverage | Known exploits only | Novel + zero-day + social engineering patterns |

---

→ **Next:** [Solution](./solution.md) — How SIFIX's AI-powered pipeline solves each of these problems.
