# SIFIX Documentation

Official documentation for SIFIX - AI-Powered Wallet Security for Web3.

## Latest Progress (May 2026)

- Added documentation for onchain relay and reconcile pipeline (`report -> relay -> indexer -> reconcile`).
- Standardized network references to **0G Galileo Testnet (Chain ID: 16602)**.
- Added internal sync/reconcile endpoint reference for indexer integration.
- Added notes for dual-status threat lifecycle (`localStatus`, `onchainStatus`).
- Added dedicated **sifix-indexer (Ponder)** documentation links and run flow.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Structure

```
docs/
├── index.md              # Homepage
├── getting-started.md    # Installation & setup
├── architecture.md       # Technical architecture
├── api.md               # API reference
├── examples.md          # Code examples
└── contributing.md      # Contribution guide
```

## Deployment

Automatically deployed to Vercel on push to `main`.

## License

MIT
