---
title: API Reference
description: Complete API documentation for SIFIX
---

# API Reference

## SecurityAgent

Main class for analyzing transaction security.

### Constructor

```typescript
new SecurityAgent(config: SecurityAgentConfig)
```

**Parameters:**

```typescript
interface SecurityAgentConfig {
  rpcUrl: string;              // 0G Chain RPC endpoint
  openaiApiKey: string;        // OpenAI API key
  contractAddress: string;     // SifixReputation contract address
  riskThresholds?: {           // Optional custom thresholds
    safe: number;              // Default: 20
    low: number;               // Default: 40
    medium: number;            // Default: 60
    high: number;              // Default: 80
  };
}
```

**Example:**

```typescript
import { SecurityAgent } from '@sifix/agent';

const agent = new SecurityAgent({
  rpcUrl: 'https://rpc-testnet.0g.ai',
  openaiApiKey: process.env.OPENAI_API_KEY,
  contractAddress: '0x544a39149d5169E4e1bDf7F8492804224CB70152'
});
```

### Methods

#### analyzeTransaction()

Analyzes a transaction for security risks.

```typescript
async analyzeTransaction(tx: Transaction): Promise<AnalysisResult>
```

**Parameters:**

```typescript
interface Transaction {
  from: string;      // Sender address
  to: string;        // Recipient address
  data: string;      // Transaction data (hex)
  value: string;     // Value in wei (hex)
  gas?: string;      // Gas limit (optional)
  gasPrice?: string; // Gas price (optional)
}
```

**Returns:**

```typescript
interface AnalysisResult {
  riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;              // 0-100
  explanation: string;            // AI-generated explanation
  simulationResult: {
    success: boolean;
    gasUsed: bigint;
    logs: Log[];
    stateChanges: StateChange[];
  };
  threatIntel?: {
    knownThreats: number;
    communityReports: number;
  };
}
```

**Example:**

```typescript
const result = await agent.analyzeTransaction({
  from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  to: '0x1234567890123456789012345678901234567890',
  data: '0xa9059cbb000000000000000000000000...',
  value: '0x0'
});

if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
  console.warn('⚠️ High risk detected:', result.explanation);
}
```

## Extension API

### Message Types

The extension communicates via Chrome runtime messages.

#### ANALYZE_TX

Request transaction analysis from background worker.

```typescript
chrome.runtime.sendMessage({
  type: 'ANALYZE_TX',
  transaction: {
    from: string,
    to: string,
    data: string,
    value: string
  }
}, (response: AnalysisResult) => {
  // Handle response
});
```

#### GET_REPUTATION

Query on-chain reputation for an address.

```typescript
chrome.runtime.sendMessage({
  type: 'GET_REPUTATION',
  address: string
}, (response: ReputationData) => {
  // Handle response
});
```

**Response:**

```typescript
interface ReputationData {
  totalReports: number;
  averageRisk: number;
  lastReportTime: number;
}
```

## Smart Contract

### SifixReputation

On-chain reputation system deployed at `0x544a39149d5169E4e1bDf7F8492804224CB70152` (0G Testnet).

#### reportThreat()

Report a threat to the on-chain reputation system.

```solidity
function reportThreat(
    address target,
    uint8 riskLevel,
    string memory txHash,
    string memory explanation
) external
```

**Parameters:**
- `target` - Address of the malicious contract/wallet
- `riskLevel` - Risk score (0-100)
- `txHash` - Transaction hash that triggered the threat
- `explanation` - AI-generated explanation

**Events:**

```solidity
event ThreatReported(
    address indexed reporter,
    address indexed target,
    uint8 riskLevel,
    string txHash,
    uint256 timestamp
);
```

#### getReputation()

Query reputation data for an address.

```solidity
function getReputation(address target) 
    external 
    view 
    returns (
        uint256 totalReports,
        uint256 averageRisk,
        uint256 lastReportTime
    )
```

**Example (ethers.js):**

```typescript
import { ethers } from 'ethers';

const contract = new ethers.Contract(
  '0x544a39149d5169E4e1bDf7F8492804224CB70152',
  SifixReputationABI,
  provider
);

const [totalReports, averageRisk, lastReportTime] = 
  await contract.getReputation('0x...');

console.log(`Reports: ${totalReports}, Avg Risk: ${averageRisk}`);
```

## Error Handling

### Common Errors

#### SimulationError

Thrown when transaction simulation fails.

```typescript
try {
  const result = await agent.analyzeTransaction(tx);
} catch (error) {
  if (error instanceof SimulationError) {
    console.error('Simulation failed:', error.message);
    // Transaction would revert
  }
}
```

#### AIAnalysisError

Thrown when AI analysis fails.

```typescript
try {
  const result = await agent.analyzeTransaction(tx);
} catch (error) {
  if (error instanceof AIAnalysisError) {
    console.error('AI analysis failed:', error.message);
    // Fallback to basic heuristics
  }
}
```

#### RateLimitError

Thrown when API rate limit is exceeded.

```typescript
try {
  const result = await agent.analyzeTransaction(tx);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, retry after:', error.retryAfter);
    // Wait and retry
  }
}
```

## Rate Limits

| Service | Limit | Window |
|---------|-------|--------|
| OpenAI GPT-4 | 10,000 tokens/min | Per API key |
| 0G RPC | 100 req/sec | Per IP |
| Contract Writes | Gas-limited | Per block |

## Next Steps

- [Examples](./examples) - Code examples and use cases
- [Architecture](./architecture) - Technical deep dive
- [Contributing](./contributing) - How to contribute
