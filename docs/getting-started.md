---
title: Getting Started
description: Install and configure SIFIX
---

# Getting Started

## Installation

### Extension (For Users)

1. **Download from Chrome Web Store** (coming soon)
   
   Or install manually:

2. **Clone repository**
   ```bash
   git clone https://github.com/sifix-ai/sifix-extension
   cd sifix-extension
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Build extension**
   ```bash
   pnpm build
   ```

6. **Load in Chrome**
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `build/chrome-mv3-prod/` folder

### Agent (For Developers)

```bash
# Install package
npm install @sifix/agent
# or
pnpm add @sifix/agent
```

## Configuration

### Environment Variables

**Extension (.env)**
```bash
PLASMO_PUBLIC_OPENAI_API_KEY=sk-...
PLASMO_PUBLIC_RPC_URL=https://rpc-testnet.0g.ai
PLASMO_PUBLIC_CONTRACT_ADDRESS=0x544a39149d5169E4e1bDf7F8492804224CB70152
```

**Agent**
```typescript
import { SecurityAgent } from '@sifix/agent';

const agent = new SecurityAgent({
  rpcUrl: process.env.RPC_URL,
  openaiApiKey: process.env.OPENAI_API_KEY,
  contractAddress: process.env.CONTRACT_ADDRESS
});
```

## Usage

### Basic Example

```typescript
const result = await agent.analyzeTransaction({
  from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  to: '0x1234567890123456789012345678901234567890',
  data: '0xa9059cbb...',
  value: '0x0'
});

console.log(result.riskLevel); // 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
console.log(result.explanation); // AI-generated explanation
console.log(result.simulationResult); // Transaction simulation details
```

### Advanced Usage

```typescript
// Custom risk thresholds
const agent = new SecurityAgent({
  rpcUrl: process.env.RPC_URL,
  openaiApiKey: process.env.OPENAI_API_KEY,
  contractAddress: process.env.CONTRACT_ADDRESS,
  riskThresholds: {
    safe: 20,
    low: 40,
    medium: 60,
    high: 80
  }
});

// Batch analysis
const results = await Promise.all([
  agent.analyzeTransaction(tx1),
  agent.analyzeTransaction(tx2),
  agent.analyzeTransaction(tx3)
]);
```

## Next Steps

- [Architecture](./architecture) - Understand how SIFIX works
- [API Reference](./api) - Detailed API documentation
- [Examples](./examples) - Code examples and use cases
