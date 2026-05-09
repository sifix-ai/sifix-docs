---
title: Extension Setup
description: Detailed guide to building, loading, and configuring the SIFIX Chrome extension — build instructions, Chrome loading steps, content script injection, API endpoint configuration, and troubleshooting.
---

# Extension Setup

The SIFIX Chrome Extension is the real-time protection layer that intercepts wallet transactions, scans domains, and delivers instant security verdicts. This guide covers building from source, loading into Chrome, understanding content script injection, and troubleshooting common issues.

**Extension specs:** Plasmo 0.88 · Chrome Manifest V3 · 5 content scripts · 340×440 popup

---

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** (or npm/yarn)
- **Chrome** ≥ 116 (required for Manifest V3)
- **MetaMask** installed and configured for **0G Galileo Testnet** (Chain ID: `16602`, RPC: `https://evmrpc-testnet.0g.ai`)
- **SIFIX dApp** running (for full activation — see [Installation](./installation.md))

---

## Build Instructions

### 1. Clone the repository

```bash
git clone https://github.com/sifix-xyz/sifix-extension.git
cd sifix-extension
```

### 2. Install dependencies

```bash
pnpm install
```

This installs Plasmo 0.88, React 19, Dexie (IndexedDB), viem, and all required dependencies.

### 3. Build for production

```bash
pnpm build
```

This command:

1. Runs `plasmo build` to compile the extension
2. Bundles all React components (popup, options, content scripts)
3. Generates the `manifest.json` from Plasmo annotations
4. Copies the pre-compiled `tx-interceptor.js` into the build output
5. Outputs the production build to `build/chrome-mv3-prod/`

**Verify the build:**

```bash
ls build/chrome-mv3-prod/
# Should show: manifest.json  popup.html  background.js  content-scripts/  assets/  ...
```

### Development build (with hot-reload)

For active development with automatic reloading:

```bash
pnpm dev
```

This starts Plasmo's dev server and outputs to `build/chrome-mv3-dev/`. Changes to `src/` files trigger an automatic extension reload.

---

## Loading in Chrome

### Step-by-step instructions

1. **Open Chrome's extension page**

   Type in the address bar:
   ```
   chrome://extensions/
   ```
   Press Enter.

2. **Enable Developer mode**

   In the top-right corner of the extensions page, toggle **Developer mode** ON.

   > **Text description of the UI:** The Developer mode toggle is a switch in the upper-right area of the chrome://extensions page. When enabled, a new toolbar appears with buttons for "Load unpacked", "Pack extension", and "Update".

3. **Load the extension**

   Click **"Load unpacked"** (appears after enabling Developer mode).

   > **Text description of the UI:** A file picker dialog opens. Navigate to and select the `build/chrome-mv3-prod/` directory (or `build/chrome-mv3-dev/` for development). Do NOT select the root `sifix-extension/` folder — select the specific build output folder.

4. **Verify the extension loaded**

   The SIFIX shield icon appears in your Chrome toolbar (top-right, near the puzzle piece icon).

   > **Text description of the UI:** In the extension list at chrome://extensions/, you'll see "SIFIX - AI Wallet Security" with its icon, version number, and toggles for enabling/disabling. A blue "Service Worker" link indicates the background worker is active.

5. **Pin the extension (recommended)**

   Click the **puzzle piece icon** in Chrome's toolbar → find **SIFIX** → click the **pin icon** to keep it visible.

### Updating after code changes

**Production build:**
```bash
pnpm build
# Then go to chrome://extensions/ → click the refresh icon on the SIFIX card
```

**Development build:**
```bash
pnpm dev
# Extension auto-reloads when source files change
```

---

## Content Script Injection

The extension injects **five content scripts** into every web page, each with a specific security role. Understanding these helps with debugging and customization.

### 1. tx-interceptor (MAIN World)

**Injection target:** `MAIN` world — runs in the page's JavaScript context, not the extension's isolated world.

**What it does:**
- Proxies `window.ethereum` to intercept all wallet RPC calls
- Captures `eth_sendTransaction`, `eth_signTypedData`, and `personal_sign` requests
- Forwards transaction parameters to the background service worker for analysis
- Blocks or allows based on the returned security verdict

**Why MAIN world:** The page's `window.ethereum` object (injected by MetaMask) is only accessible from the page's own JavaScript context. Content scripts running in the isolated world cannot directly access it. The `MAIN` world injection allows SIFIX to wrap the wallet provider before any dApp code runs.

**Key implementation detail:** The `tx-interceptor.js` is pre-compiled separately and copied into the build output. It must execute **before** any page scripts to ensure no wallet calls bypass the interceptor. This is achieved via `run_at: "document_start"` in the manifest.

### 2. api-bridge (Fetch Wrapper)

**Injection target:** `MAIN` world

**What it does:**
- Wraps the global `fetch` API and `XMLHttpRequest`
- Monitors outgoing HTTP requests from dApps
- Flags connections to known malicious endpoints
- Logs request patterns for anomaly detection

### 3. sifix-badge (Floating Shield)

**Injection target:** Isolated world with CSS injection

**What it does:**
- Renders a floating security shield in the page's bottom-right corner
- Updates in real-time as domain safety changes
- Three states: green ✅ (safe), yellow ⚠️ (caution), red 🚨 (danger)
- Click-through to open the extension popup

### 4. dapp-checker (Banner Overlays)

**Injection target:** Isolated world

**What it does:**
- Injects full-width banners at the top of dApp pages
- Shows detailed risk breakdowns for flagged domains
- Provides one-click "Leave Site" action for dangerous dApps
- Banner types: Verified (blue), Caution (yellow), Danger (red)

### 5. auth-bridge (SIWE Token)

**Injection target:** Isolated world

**What it does:**
- Manages Sign-In with Ethereum (SIWE) authentication between the dApp and extension
- Intercepts SIWE message signing requests
- Stores and refreshes JWT tokens securely
- Relays authentication state to the background service worker

### Injection order

Content scripts are injected in this order to ensure proper operation:

```
1. tx-interceptor  (MAIN world, document_start) — Wraps window.ethereum first
2. api-bridge      (MAIN world, document_start) — Wraps fetch/XHR second
3. auth-bridge     (Isolated, document_idle)    — Handles auth flow
4. sifix-badge     (Isolated, document_idle)    — Renders shield badge
5. dapp-checker    (Isolated, document_idle)    — Renders safety banners
```

---

## Configuring the API Endpoint

The extension communicates with the SIFIX dApp API for domain scans, transaction analysis, and authentication.

### Default configuration

By default, the extension connects to:

```
http://localhost:3000
```

This matches the local development server started by `pnpm dev` in `sifix-dapp`.

### Changing the API endpoint

**Via extension settings:**

1. Click the SIFIX shield icon to open the popup
2. Click the **gear icon** (settings) or navigate to the extension's options page
3. Update the **"API Endpoint"** field
4. Click **Save** — the extension reconnects immediately

**Via extension source code:**

Edit the API base URL in the extension's configuration:

```typescript
// src/config/api.ts (or equivalent)
export const API_BASE_URL = process.env.PLASMO_PUBLIC_API_URL || "http://localhost:3000";
```

For development with a custom port:

```bash
# In sifix-dapp
PORT=3001 pnpm dev

# In sifix-extension, update config
# API_BASE_URL = "http://localhost:3001"
```

### Production endpoint

When deploying the dApp to production (e.g., Vercel), update the extension's API endpoint to your production URL:

```
https://api.sifix.io
```

---

## Development vs Production Builds

| Aspect | Development (`pnpm dev`) | Production (`pnpm build`) |
|--------|--------------------------|---------------------------|
| Output directory | `build/chrome-mv3-dev/` | `build/chrome-mv3-prod/` |
| Hot-reload | ✅ Yes — auto-reloads on file changes | ❌ No — manual reload required |
| Source maps | ✅ Enabled | ❌ Disabled |
| Code minification | ❌ No | ✅ Yes |
| Console logging | Verbose (debug-level) | Minimal (errors only) |
| Build time | ~2s (incremental) | ~15s (full optimization) |
| Bundle size | Larger (unoptimized) | Smaller (tree-shaken, minified) |
| Intended use | Active development | Distribution / daily use |

### Development workflow

```bash
# Terminal 1: Start the dApp
cd sifix-dapp && pnpm dev

# Terminal 2: Start the extension with hot-reload
cd sifix-extension && pnpm dev
```

Load `build/chrome-mv3-dev/` in Chrome once. After that, all changes to `src/` files automatically rebuild and reload the extension.

**Debugging content scripts:**
- Right-click the page → **Inspect** → **Console** tab → filter by `sifix`
- Content scripts in the `MAIN` world appear in the page's DevTools console
- Isolated world content scripts also appear in the page's console
- Background service worker: Go to `chrome://extensions/` → click **"Service Worker"** link on the SIFIX card

---

## Troubleshooting

### Extension won't load

**Error: "Manifest file is missing or unreadable"**

You likely selected the wrong directory. Make sure to select:
- `build/chrome-mv3-prod/` (production) or
- `build/chrome-mv3-dev/` (development)

NOT the root `sifix-extension/` folder.

**Error: "Failed to load extension"**

```bash
# Clean and rebuild
rm -rf build/ node_modules/
pnpm install
pnpm build
```

### Extension shows "Disconnected" state

**The extension can't reach the dApp API.**

1. Verify the dApp is running: `curl http://localhost:3000/api/health`
2. Check the API endpoint in extension settings
3. Try a different port if 3000 is occupied
4. Ensure no CORS issues — the dApp configures CORS headers for `chrome-extension://` origins

**Fix:**
```bash
# Start the dApp first, then load the extension
cd sifix-dapp && pnpm dev
# Wait for "Ready" message, then open extension popup
```

### MetaMask not detected

**The extension popup says "No wallet detected."**

1. Ensure MetaMask is installed and enabled
2. Refresh the page after installing MetaMask
3. Check that `tx-interceptor` is properly injecting (see DevTools console for `[SIFIX]` prefixed logs)
4. Try disabling and re-enabling both MetaMask and SIFIX extensions

### Transactions not being intercepted

**Wallet transactions go through without SIFIX analysis.**

1. Open DevTools Console → look for `[SIFIX tx-interceptor]` log messages
2. If no logs appear, the content script isn't injecting:
   - Check `chrome://extensions/` → SIFIX → "Inspect views" for errors
   - Ensure the website is not on the extension's exclude list
3. If logs appear but interception fails:
   - The page may have loaded before the extension — refresh the page
   - Some dApps use alternative wallet injection methods — check the console for details

### Floating badge not appearing

1. Check if the `sifix-badge` content script is active in DevTools → Sources → Content Scripts
2. The badge may be hidden behind other UI — try scrolling down
3. Check the page's CSS for `z-index` conflicts (the badge uses `z-index: 2147483647`)

### Background service worker crashes

**Service worker shows errors in chrome://extensions/.**

1. Click the **"Service Worker"** link to open the dedicated DevTools
2. Check the Console for error messages
3. Common cause: the dApp API is unreachable
4. MV3 service workers can be terminated by Chrome after 5 minutes of inactivity — this is normal behavior. The extension re-activates via `chrome.alarms` for periodic tasks.

### Extension works in development but not production

**Hot-reload dev build works fine, but production build has issues.**

1. Check that `tx-interceptor.js` was copied to the build output:
   ```bash
   ls build/chrome-mv3-prod/tx-interceptor.js
   ```
2. If missing, the build script may have failed silently:
   ```bash
   pnpm build 2>&1 | grep -i error
   ```
3. Verify `manifest.json` references the correct content script paths:
   ```bash
   cat build/chrome-mv3-prod/manifest.json | grep -A 5 content_scripts
   ```

---

## Security Considerations

- **No private keys stored** — The extension never stores wallet private keys. Authentication is via SIWE JWT tokens.
- **MV3 isolation** — Manifest V3 enforces strict content security policies, preventing XSS in the extension itself.
- **Host permissions** — The `<all_urls>` host permission is required for MAIN world injection across all dApp pages. SIFIX only injects security-related content scripts.
- **Token storage** — JWT tokens are stored in `chrome.storage.local` (encrypted by Chrome) and expire after the configured session timeout.

---

## Next Steps

- **[Quick Start](./quick-start.md)** — Analyze your first transaction
- **[Configuration](./configuration.md)** — Environment variables and AI provider setup
- **[Deployment](./deployment.md)** — Deploy the full platform to production
- **[Chrome Extension Product Docs](/product/extension.md)** — Detailed product-level documentation
