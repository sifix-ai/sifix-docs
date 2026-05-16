# SIFIX Documentation

Official documentation for SIFIX - intercept-first Web3 security built on 0G Chain, 0G Compute, 0G Storage, and 0G Agentic ID.

## Latest Progress (May 2026)

- Added documentation for **prediction accuracy tracking** and live analytics review flow.
- Added docs for **recent predictions API** and false-positive / false-negative review loop.
- Updated dashboard documentation to reflect **action protection matrix** and live prediction drill-down.
- Standardized network references to **0G Galileo Testnet (Chain ID: 16602)**.
- Added dedicated **sifix-indexer (Ponder)** documentation links and migrated reconcile flow to `POST /api/v1/sync/reconcile-batch` with `events + lastBlock + chainId` payload.
- Added deployment note for new SifixReputation contract `0xBBa8b030D80113e50271a2bbEeDBE109D9f1C42e`.
- Added sync state cursor key note: `sifix_reputation_indexer`.

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
├── overview/             # Product introduction/problem/solution/stack
├── guides/               # Install, quick-start, config, deployment
├── architecture/         # System overview, data flow, auth, security
├── api-reference/        # REST, extension, agent SDK, 0G storage
├── product/              # Dashboard, extension, AI agent, identity
├── examples/             # Integration examples
└── community/            # Changelog, FAQ, contributing
```

## Deployment

Automatically deployed to Vercel on push to `main`.

## License

MIT
