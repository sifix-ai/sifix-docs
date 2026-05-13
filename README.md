# SIFIX Documentation

Official documentation for SIFIX - AI-Powered Wallet Security for Web3.

## Latest Progress (May 2026)

- Added documentation for **prediction accuracy tracking** and live analytics review flow.
- Added docs for **recent predictions API** and false-positive / false-negative review loop.
- Updated dashboard documentation to reflect **action protection matrix** and live prediction drill-down.
- Standardized network references to **0G Galileo Testnet (Chain ID: 16602)**.
- Added dedicated **sifix-indexer (Ponder)** documentation links and richer reconcile payload context.

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
