---
title: Architecture
description: How SIFIX works under the hood
---

# Architecture

## Overview

SIFIX consists of four main components:

1. **Extension** - Browser extension that intercepts wallet transactions
2. **Agent** - AI-powered security engine
3. **Contracts** - On-chain reputation system
4. **0G Infrastructure** - Storage and compute layer

## Component Diagram

```
┌──────────────────────────────────────────────┐
│           Browser (Chrome/Firefox)           │
│                                              │
│  ┌────────────┐         ┌────────────────┐  │
│  │   dApp     │────────▶│ Wallet         │  │
│  │ (Uniswap)  │         │ (MetaMask)     │  │
│  └────────────┘         └────────┬───────┘  │
│                                  │          │
│                         ┌────────▼───────┐  │
│                         │ SIFIX Extension│  │
│                         │ (Interceptor)  │  │
│                         └────────┬───────┘  │
└──────────────────────────────────┼──────────┘
                                   │
                          ┌────────▼────────┐
                          │ SIFIX Agent     │
                          │                 │
                          │ ┌─────────────┐ │
                          │ │ Simulator   │ │
                          │ └─────────────┘ │
                          │ ┌─────────────┐ │
                          │ │ AI Analyzer │ │
                          │ └─────────────┘ │
                          │ ┌─────────────┐ │
                          │ │ Threat Intel│ │
                          │ └─────────────┘ │
                          └────────┬────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
            ┌───────▼────────┐          ┌────────▼────────┐
            │ 0G Chain       │          │ OpenAI GPT-4    │
            │                │          │                 │
            │ ┌────────────┐ │          │ Risk Analysis   │
            │ │ Reputation │ │          │ Explanation     │
            │ │ Contract   │ │          │ Generation      │
            │ └────────────┘ │          └─────────────────┘
            │ ┌────────────┐ │
            │ │ 0G Storage │ │
            │ │ (Threats)  │ │
            │ └────────────┘ │
            └────────────────┘
```

## Data Flow

### 1. Transaction Interception

```typescript
// Extension content script
window.ethereum = new Proxy(originalProvider, {
  get(target, prop) {
    if (prop === 'request') {
      return async (args) => {
        if (args.method === 'eth_sendTransaction') {
          // Show SIFIX popup
          const userChoice = await showPopup();
          
          if (userChoice === 'simulate') {
            // Send to background worker
            const result = await chrome.runtime.sendMessage({
              type: 'ANALYZE_TX',
              transaction: args.params[0]
            });
            
            // Show results to user
            await showResults(result);
          }
        }
        
        return target[prop](args);
      };
    }
    return target[prop];
  }
});
```

### 2. Transaction Simulation

```typescript
// Agent: simulator.ts
export async function simulateTransaction(tx: Transaction) {
  const client = createPublicClient({
    chain: zeroGTestnet,
    transport: http(rpcUrl)
  });
  
  // Simulate using eth_call
  const result = await client.call({
    account: tx.from,
    to: tx.to,
    data: tx.data,
    value: tx.value
  });
  
  return {
    success: result.status === 'success',
    gasUsed: result.gasUsed,
    logs: result.logs,
    stateChanges: analyzeStateChanges(result)
  };
}
```

### 3. AI Risk Analysis

```typescript
// Agent: analyzer.ts
export async function analyzeRisk(simulation: SimulationResult) {
  const prompt = `
Analyze this Web3 transaction for security risks:

Transaction: ${JSON.stringify(simulation.transaction)}
Simulation Result: ${JSON.stringify(simulation.result)}

Evaluate:
1. Contract legitimacy
2. Token approvals
3. Value transfers
4. State changes
5. Known attack patterns

Provide:
- Risk score (0-100)
- Risk level (SAFE/LOW/MEDIUM/HIGH/CRITICAL)
- Detailed explanation
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  });
  
  return parseAIResponse(response.choices[0].message.content);
}
```

### 4. On-Chain Reporting

```typescript
// Agent: reporter.ts
export async function reportThreat(analysis: AnalysisResult) {
  if (analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRITICAL') {
    const contract = new Contract(
      contractAddress,
      SifixReputationABI,
      signer
    );
    
    await contract.reportThreat(
      analysis.transaction.to,
      riskLevelToScore(analysis.riskLevel),
      analysis.transaction.hash,
      analysis.explanation
    );
  }
}
```

## Security Considerations

### Extension Security

- **Content Script Isolation** - Runs in isolated world, can't access page JS
- **Message Validation** - All messages validated before processing
- **API Key Protection** - Keys stored in extension storage, never exposed to page

### Agent Security

- **Simulation Sandbox** - Transactions simulated, never executed
- **Rate Limiting** - Prevents API abuse
- **Input Validation** - All inputs sanitized before processing

### Smart Contract Security

- **Access Control** - Only authorized agents can report
- **Data Validation** - Risk scores and addresses validated on-chain
- **Immutable Audit Trail** - All reports permanently recorded

## Performance

### Latency Breakdown

| Component | Time | Notes |
|-----------|------|-------|
| Interception | <10ms | Proxy overhead |
| Simulation | 100-500ms | RPC call + execution |
| AI Analysis | 1-3s | GPT-4 inference |
| On-Chain Report | 2-5s | Only for HIGH/CRITICAL |
| **Total** | **1-4s** | User sees results in 1-4s |

### Optimization Strategies

1. **Parallel Processing** - Simulation + threat intel lookup in parallel
2. **Caching** - Cache known safe contracts
3. **Batch Reporting** - Batch multiple reports to save gas
4. **Local Models** - Option to use local LLMs for faster analysis

## Scalability

### Current Limits

- **Extension**: Handles 1 transaction at a time per tab
- **Agent**: 10 concurrent analyses per instance
- **Contract**: Unlimited reports (gas-limited)

### Future Improvements

- **Agent Pool** - Multiple agent instances for load balancing
- **CDN Caching** - Cache threat intelligence globally
- **L2 Deployment** - Deploy reputation contract on L2 for lower gas

## Next Steps

- [API Reference](./api) - Detailed API documentation
- [Examples](./examples) - Code examples
- [Contributing](./contributing) - How to contribute
