---
title: Examples
description: Code examples and use cases
---

# Examples

## Basic Usage

### Analyze a Simple Transfer

```typescript
import { SecurityAgent } from '@sifix/agent';

const agent = new SecurityAgent({
  rpcUrl: 'https://rpc-testnet.0g.ai',
  openaiApiKey: process.env.OPENAI_API_KEY,
  contractAddress: '0x544a39149d5169E4e1bDf7F8492804224CB70152'
});

// Analyze ETH transfer
const result = await agent.analyzeTransaction({
  from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  to: '0x1234567890123456789012345678901234567890',
  data: '0x',
  value: '0x16345785d8a0000' // 0.1 ETH
});

console.log(`Risk: ${result.riskLevel}`);
console.log(`Explanation: ${result.explanation}`);
```

### Analyze Token Approval

```typescript
// ERC20 approve() call
const approvalTx = {
  from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  data: '0x095ea7b3' + // approve(address,uint256)
        '000000000000000000000000' + '1234567890123456789012345678901234567890' + // spender
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // unlimited
  value: '0x0'
};

const result = await agent.analyzeTransaction(approvalTx);

if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
  console.warn('⚠️ Dangerous approval detected!');
  console.warn(result.explanation);
}
```

## Advanced Usage

### Batch Analysis

```typescript
// Analyze multiple transactions in parallel
const transactions = [
  { from: '0x...', to: '0x...', data: '0x...', value: '0x0' },
  { from: '0x...', to: '0x...', data: '0x...', value: '0x0' },
  { from: '0x...', to: '0x...', data: '0x...', value: '0x0' }
];

const results = await Promise.all(
  transactions.map(tx => agent.analyzeTransaction(tx))
);

// Filter high-risk transactions
const highRisk = results.filter(r => 
  r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL'
);

console.log(`${highRisk.length} high-risk transactions detected`);
```

### Custom Risk Thresholds

```typescript
// More conservative thresholds
const agent = new SecurityAgent({
  rpcUrl: 'https://rpc-testnet.0g.ai',
  openaiApiKey: process.env.OPENAI_API_KEY,
  contractAddress: '0x544a39149d5169E4e1bDf7F8492804224CB70152',
  riskThresholds: {
    safe: 10,    // 0-10: SAFE
    low: 25,     // 10-25: LOW
    medium: 50,  // 25-50: MEDIUM
    high: 75     // 50-75: HIGH, 75-100: CRITICAL
  }
});
```

### Error Handling

```typescript
import { 
  SecurityAgent, 
  SimulationError, 
  AIAnalysisError,
  RateLimitError 
} from '@sifix/agent';

async function analyzeWithRetry(tx: Transaction, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await agent.analyzeTransaction(tx);
    } catch (error) {
      if (error instanceof SimulationError) {
        // Transaction would revert, return safe result
        return {
          riskLevel: 'SAFE',
          riskScore: 0,
          explanation: 'Transaction would revert (simulation failed)',
          simulationResult: null
        };
      }
      
      if (error instanceof RateLimitError) {
        // Wait and retry
        await new Promise(resolve => 
          setTimeout(resolve, error.retryAfter * 1000)
        );
        continue;
      }
      
      if (error instanceof AIAnalysisError) {
        // Fallback to basic heuristics
        console.warn('AI analysis failed, using fallback');
        return basicHeuristicAnalysis(tx);
      }
      
      throw error; // Unknown error
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

## Extension Integration

### Intercept MetaMask Transactions

```typescript
// Content script
const originalProvider = window.ethereum;

window.ethereum = new Proxy(originalProvider, {
  get(target, prop) {
    if (prop === 'request') {
      return async (args) => {
        if (args.method === 'eth_sendTransaction') {
          const tx = args.params[0];
          
          // Ask user if they want to simulate
          const userChoice = await showPopup({
            title: 'SIFIX Protection',
            message: 'Simulate this transaction before sending?',
            options: ['Simulate', 'Trust & Send']
          });
          
          if (userChoice === 'Simulate') {
            // Send to background worker
            const result = await chrome.runtime.sendMessage({
              type: 'ANALYZE_TX',
              transaction: tx
            });
            
            // Show results
            await showResults(result);
            
            // Block if critical
            if (result.riskLevel === 'CRITICAL') {
              throw new Error('Transaction blocked by SIFIX: ' + result.explanation);
            }
          }
        }
        
        return target[prop](args);
      };
    }
    return target[prop];
  }
});
```

### Background Worker

```typescript
// Background service worker
import { SecurityAgent } from '@sifix/agent';

const agent = new SecurityAgent({
  rpcUrl: process.env.PLASMO_PUBLIC_RPC_URL,
  openaiApiKey: process.env.PLASMO_PUBLIC_OPENAI_API_KEY,
  contractAddress: process.env.PLASMO_PUBLIC_CONTRACT_ADDRESS
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_TX') {
    agent.analyzeTransaction(message.transaction)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    
    return true; // Keep channel open for async response
  }
});
```

## Smart Contract Integration

### Query Reputation

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://rpc-testnet.0g.ai');
const contract = new ethers.Contract(
  '0x544a39149d5169E4e1bDf7F8492804224CB70152',
  [
    'function getReputation(address) view returns (uint256, uint256, uint256)'
  ],
  provider
);

async function checkReputation(address: string) {
  const [totalReports, averageRisk, lastReportTime] = 
    await contract.getReputation(address);
  
  console.log(`Address: ${address}`);
  console.log(`Total Reports: ${totalReports}`);
  console.log(`Average Risk: ${averageRisk}`);
  console.log(`Last Report: ${new Date(Number(lastReportTime) * 1000)}`);
  
  if (totalReports > 10 && averageRisk > 60) {
    console.warn('⚠️ High-risk address detected!');
  }
}
```

### Report Threat

```typescript
import { ethers } from 'ethers';

const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(
  '0x544a39149d5169E4e1bDf7F8492804224CB70152',
  [
    'function reportThreat(address, uint8, string, string)'
  ],
  wallet
);

async function reportThreat(result: AnalysisResult, tx: Transaction) {
  if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
    const txResponse = await contract.reportThreat(
      tx.to,
      result.riskScore,
      tx.hash || '0x0',
      result.explanation
    );
    
    await txResponse.wait();
    console.log('Threat reported on-chain');
  }
}
```

## Testing

### Mock Agent for Testing

```typescript
import { SecurityAgent } from '@sifix/agent';

class MockSecurityAgent extends SecurityAgent {
  async analyzeTransaction(tx: Transaction) {
    // Return mock result for testing
    return {
      riskLevel: 'SAFE',
      riskScore: 5,
      explanation: 'Mock analysis for testing',
      simulationResult: {
        success: true,
        gasUsed: 21000n,
        logs: [],
        stateChanges: []
      }
    };
  }
}

// Use in tests
const agent = new MockSecurityAgent({
  rpcUrl: 'http://localhost:8545',
  openaiApiKey: 'test-key',
  contractAddress: '0x0000000000000000000000000000000000000000'
});
```

## Next Steps

- [API Reference](./api) - Complete API documentation
- [Architecture](./architecture) - Technical deep dive
- [Contributing](./contributing) - How to contribute
