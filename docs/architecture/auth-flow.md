---
title: Authentication Flow
description: Complete guide to SIFIX authentication — SIWE (Sign-In with Ethereum) for extension and dashboard, JWT token lifecycle, API authentication, token refresh, expiry, and revocation.
---

# Authentication Flow

SIFIX uses **Sign-In with Ethereum (SIWE)** for authentication across both the browser extension and the web dashboard. SIWE replaces traditional email/password authentication with cryptographic wallet signatures — users prove ownership of their Ethereum address by signing a structured EIP-4361 message.

---

## SIWE Authentication Sequence

```mermaid
sequenceDiagram
    participant User
    participant Popup as Extension Popup
    participant Page as dApp Page<br/>/dashboard/extension
    participant API as dApp API<br/>/api/v1/auth/*
    participant Bridge as auth-bridge.ts<br/>(ISOLATED world)
    participant Storage as chrome.storage.local
    participant BG as Background Worker

    rect rgb(26, 26, 46)
        Note over User, API: Phase 1 — Extension Activation
        User->>Popup: 1. Clicks "Activate via dApp"
        Popup->>Page: 2. Opens new tab<br/>http://localhost:3000/dashboard/extension
    end

    rect rgb(22, 33, 62)
        Note over Page, API: Phase 2 — SIWE Flow on dApp
        Page->>API: 3a. GET /api/v1/auth/nonce
        API-->>Page: 3b. { nonce, message }
        Note over Page: SIWE message constructed:<br/>domain, address, nonce, chainId, expiration
        Page->>User: 3c. Prompts wallet signature (MetaMask)
        User->>Page: 3d. Signs SIWE message
        Page->>API: 3e. POST /api/v1/auth/verify<br/>{ message, signature }
        API->>API: 3f. Verify signature → validate nonce → check expiry → create JWT
        API-->>Page: 3g. { token, expiresAt }
    end

    rect rgb(15, 52, 96)
        Note over Page, Storage: Phase 3 — Token Transfer to Extension
        Page->>Bridge: 4. postMessage({<br/>type: "SIFIX_EXTENSION_TOKEN",<br/>token, walletAddress, expiresAt<br/>})
        Bridge->>Bridge: 5a. Validate message origin<br/>(must match dApp URL)
        Bridge->>Storage: 5b. Store { token, walletAddress, expiresAt }
        Storage-->>BG: 6a. chrome.storage.onChanged event
        BG->>BG: 6b. Update badge state → ACTIVE
        BG-->>Popup: 6c. chrome.runtime.sendMessage → "AUTH_SUCCESS"
    end

    rect rgb(55, 65, 81)
        Note over Popup, API: Phase 4 — Authenticated API Calls
        Popup->>BG: 7. User triggers scan / analysis
        BG->>Storage: 8a. Retrieve JWT token
        BG->>API: 8b. fetch(url, {<br/>headers: { Authorization: "Bearer JWT" }<br/>})
        API->>API: 8c. Verify JWT → extract walletAddress
        API-->>BG: 8d. Response with analysis data
    end
```

---

## SIWE Message Construction

The dApp constructs an EIP-4361 compliant SIWE message with the following fields:

```typescript
import { generateNonce } from "siwe";

const message = new SiweMessage({
  // Required fields
  domain: "localhost:3000",           // dApp origin
  address: "0xABCDEF...",             // User's wallet address
  uri: "http://localhost:3000",       // Full dApp URI
  version: "1",                       // SIWE version

  // Security fields
  nonce: generateNonce(),             // Random nonce (prevents replay)
  chainId: 16602,                     // 0G Galileo Testnet

  // Time bounds
  issuedAt: new Date().toISOString(),
  expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
  notBefore: undefined,               // Optional: message not valid before

  // Optional
  statement: "Sign in to SIFIX — AI-Powered Wallet Security for Web3",
  requestId: undefined,               // Optional: correlation ID
  resources: undefined,               // Optional: EIP-5553 resources
});
```

**Produced message (example):**

```
sifix-ai.github.io wants you to sign in with your Ethereum account:
0xABCDEF1234567890ABCDEF1234567890ABCDEF1

Sign in to SIFIX — AI-Powered Wallet Security for Web3

URI: http://localhost:3000
Version: 1
Chain ID: 16602
Nonce: kJ3bN8xP2mQ
Issued At: 2026-05-09T20:00:00.000Z
Expiration Time: 2026-05-10T20:00:00.000Z
```

---

## API Endpoints

### GET /api/v1/auth/nonce

Generates a unique nonce and constructs the SIWE message for the client to sign.

**Request:**

```http
GET /api/v1/auth/nonce?address=0xABCDEF...
```

**Response:**

```json
{
  "success": true,
  "data": {
    "nonce": "kJ3bN8xP2mQ7rT9vW",
    "message": "sifix-ai.github.io wants you to sign in...",
    "expiresIn": 86400
  }
}
```

**Nonce properties:**
- Cryptographically random, 8+ characters
- Stored server-side with a 5-minute TTL
- Single-use — consumed after successful verification
- Prevents replay attacks

---

### POST /api/v1/auth/verify

Verifies the signed SIWE message and issues a JWT token.

**Request:**

```http
POST /api/v1/auth/verify
Content-Type: application/json

{
  "message": "sifix-ai.github.io wants you to sign in...",
  "signature": "0x1234567890abcdef..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-05-10T20:00:00.000Z",
    "walletAddress": "0xABCDEF..."
  }
}
```

**Verification steps (server-side):**

1. Parse the SIWE message from the raw string
2. Verify the signature matches the address using `siwe.verify()`
3. Validate the nonce matches a previously issued nonce (and mark it as consumed)
4. Check the message hasn't expired (`expirationTime`)
5. Verify the `chainId` matches 0G Galileo (16602)
6. Verify the `domain` matches the expected dApp origin
7. Create or update the `UserProfile` record
8. Create an `ExtensionSession` record with the new JWT
9. Return the JWT token

---

### POST /api/v1/auth/verify-token

Validates an existing JWT token without re-authenticating. Used by the extension to check session validity.

**Request:**

```http
POST /api/v1/auth/verify-token
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (valid):**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "walletAddress": "0xABCDEF...",
    "expiresAt": "2026-05-10T20:00:00.000Z"
  }
}
```

**Response (invalid/expired):**

```json
{
  "success": false,
  "error": {
    "code": "TOKEN_INVALID",
    "message": "JWT token has expired"
  }
}
```

---

## JWT Token Specification

### Structure

The JWT token uses the HS256 algorithm and contains the following claims:

```typescript
interface SifixJwtPayload {
  // Standard JWT claims
  iat: number;            // Issued at (Unix timestamp)
  exp: number;            // Expiration (Unix timestamp)
  iss: "sifix-dapp";      // Issuer

  // SIFIX custom claims
  walletAddress: string;  // Authenticated wallet address (checksummed)
  sessionId: string;      // ExtensionSession.id for DB lookup
  chainId: number;        // 16602 (0G Galileo)
}
```

### Generation

```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET; // Server-side only, never exposed

function createToken(walletAddress: string, sessionId: string): string {
  return jwt.sign(
    {
      walletAddress,
      sessionId,
      chainId: 16602,
      iss: "sifix-dapp",
    },
    JWT_SECRET,
    {
      expiresIn: "24h",
      algorithm: "HS256",
    }
  );
}
```

### Validation

Every authenticated API request passes through the auth middleware:

```typescript
function authenticateRequest(request: Request): SifixJwtPayload {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing Authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "sifix-dapp",
    }) as SifixJwtPayload;

    // Verify the session is still active in the database
    const session = await prisma.extensionSession.findUnique({
      where: { token, isActive: true },
    });

    if (!session) {
      throw new AuthError("Session revoked");
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new AuthError("Session expired");
    }

    return payload;
  } catch (err) {
    throw new AuthError("Invalid token");
  }
}
```

---

## Extension Auth Flow

### Step-by-Step Flow

1. **User clicks "Activate via dApp"** in the extension popup
2. **Popup opens a new tab** to `http://localhost:3000/dashboard/extension`
3. **dApp page loads** and detects it's the extension activation route
4. **dApp requests a nonce** from `GET /api/v1/auth/nonce?address=0x...`
5. **dApp prompts wallet signature** via Wagmi/`eth_signTypedData` (MetaMask popup)
6. **User signs** the SIWE message in MetaMask
7. **dApp verifies** the signature via `POST /api/v1/auth/verify`
8. **dApp receives JWT** and transfers it to the extension via `postMessage`
9. **`auth-bridge.ts`** (ISOLATED world content script) receives the message
10. **auth-bridge validates** the message origin (must match dApp URL)
11. **auth-bridge stores** the JWT in `chrome.storage.local`
12. **Background worker** detects the storage change via `chrome.storage.onChanged`
13. **Background worker** updates the extension badge to ACTIVE state
14. **Popup receives** `AUTH_SUCCESS` message and shows connected state

### Token Transfer Security

The token transfer from dApp page to extension uses `window.postMessage` with strict validation:

```typescript
// dApp page sends the token
window.postMessage(
  {
    type: "SIFIX_EXTENSION_TOKEN",
    token: jwtToken,
    walletAddress: address,
    expiresAt: expiresAt,
  },
  "*" // Target origin — the auth-bridge validates the source
);

// auth-bridge.ts (ISOLATED world) receives and validates
window.addEventListener("message", (event) => {
  // Strict origin validation
  if (event.origin !== "http://localhost:3000") return;

  // Strict type validation
  if (event.data?.type !== "SIFIX_EXTENSION_TOKEN") return;

  // Validate required fields
  if (!event.data.token || !event.data.walletAddress) return;

  // Store in extension's local storage
  chrome.storage.local.set({
    sifixToken: event.data.token,
    sifixWalletAddress: event.data.walletAddress,
    sifixTokenExpiry: event.data.expiresAt,
    sifixIsActive: true,
  });
});
```

---

## Dashboard Auth Flow

The dashboard uses the same SIWE flow but keeps the session entirely server-side:

1. **User clicks "Connect Wallet"** on the dApp landing page or dashboard
2. **Wagmi v3** opens the wallet connection dialog (MetaMask)
3. **User connects** their wallet on the 0G Galileo network
4. **Dashboard requests** a nonce from `GET /api/v1/auth/nonce`
5. **Dashboard constructs** the SIWE message
6. **User signs** via MetaMask (triggered by Wagmi's `signMessage`)
7. **Dashboard verifies** via `POST /api/v1/auth/verify`
8. **JWT is stored** in an HTTP-only cookie or client-side state (Wagmi + React Query)
9. **All subsequent API calls** include the JWT as a Bearer token

**Dashboard session differences from extension:**

- Dashboard sessions are managed by the React client state (Wagmi + TanStack React Query)
- Extension sessions are tracked in the `ExtensionSession` database model
- Dashboard sessions don't use `postMessage` — the token stays in the page context
- Both use the same JWT format and server-side verification

---

## API Authentication

All authenticated API endpoints require one of two auth methods:

### Bearer Token (SIWE JWT)

Used by both the extension and dashboard for all `/api/v1/*` endpoints.

```http
GET /api/v1/watchlist
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

POST /api/v1/extension/analyze
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
{ ... }
```

**Unauthenticated endpoints:**

- `GET /api/health` — Service health check
- `GET /api/v1/auth/nonce` — Nonce generation (pre-auth)

All other endpoints require a valid Bearer token. Invalid or expired tokens return:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

### Extension API Key (Internal)

In addition to the Bearer token, extension-specific endpoints may validate additional context:

- The `walletAddress` in the JWT must match the requesting session
- The `ExtensionSession.isActive` flag must be `true`
- The `ExtensionSession.expiresAt` must be in the future

---

## Token Refresh

### Automatic Refresh

The extension implements token refresh logic in the background service worker:

```typescript
// Background worker token refresh check (runs every hour)
chrome.alarms.create("token-refresh", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "token-refresh") return;

  const { sifixToken, sifixTokenExpiry } =
    await chrome.storage.local.get([
      "sifixToken",
      "sifixTokenExpiry",
    ]);

  if (!sifixToken) return;

  const expiresAt = new Date(sifixTokenExpiry);
  const now = new Date();
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();

  // If token expires in less than 2 hours, attempt refresh
  if (timeUntilExpiry < 2 * 60 * 60 * 1000) {
    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/auth/verify-token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: sifixToken }),
        }
      );

      if (!response.ok) {
        // Token is invalid or expired — deactivate
        await chrome.storage.local.remove([
          "sifixToken",
          "sifixWalletAddress",
          "sifixTokenExpiry",
        ]);
        await chrome.storage.local.set({ sifixIsActive: false });
        // Update badge to show disconnected state
        updateBadge("disconnected");
      }
    } catch (err) {
      console.error("Token refresh check failed:", err);
    }
  }
});
```

### Manual Re-Authentication

When the token expires or becomes invalid:

1. The extension popup shows **"Session expired — Re-authenticate"** status
2. User clicks **"Activate via dApp"** again
3. The full SIWE flow repeats (Steps 1–14 above)
4. The old `ExtensionSession` record is deactivated (`isActive = false`)
5. A new JWT and `ExtensionSession` are created

---

## Token Expiry

| Parameter | Value | Notes |
|-----------|-------|-------|
| JWT lifetime | 24 hours | Configurable server-side via `JWT_EXPIRY` env var |
| Nonce TTL | 5 minutes | Nonce must be used within 5 minutes of generation |
| Session check interval | 60 minutes | Background worker checks token validity hourly |
| Refresh threshold | 2 hours | Token is refreshed if expiring within 2 hours |
| ExtensionSession cleanup | 7 days | Inactive sessions are pruned after 7 days |

---

## Token Revocation

Tokens can be revoked through several mechanisms:

### Server-Side Revocation

```typescript
// Deactivate a session by marking it inactive
async function revokeSession(token: string): Promise<void> {
  await prisma.extensionSession.update({
    where: { token },
    data: {
      isActive: false,
      updatedAt: new Date(),
    },
  });
}
```

**Revocation triggers:**

- **User logs out** from the dashboard — deactivates all sessions for the wallet address
- **User disconnects** in the extension popup — removes the token from `chrome.storage.local`
- **Admin action** — Emergency revocation of any session via database update
- **Suspicious activity** — Automatic revocation if rate limits are exceeded

### Client-Side Revocation

The extension can locally revoke its own token:

```typescript
// Extension popup "Disconnect" button
async function disconnect(): Promise<void> {
  // Clear local storage
  await chrome.storage.local.remove([
    "sifixToken",
    "sifixWalletAddress",
    "sifixTokenExpiry",
  ]);
  await chrome.storage.local.set({ sifixIsActive: false });

  // Notify background worker
  chrome.runtime.sendMessage({ type: "AUTH_DISCONNECTED" });

  // Optionally notify server
  const token = await chrome.storage.local.get("sifixToken");
  if (token.sifixToken) {
    fetch("http://localhost:3000/api/v1/auth/revoke", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.sifixToken}`,
      },
    }).catch(() => {}); // Best effort — ignore failures
  }
}
```

### Bulk Revocation

All sessions for a wallet address can be revoked at once:

```sql
UPDATE ExtensionSession
SET isActive = 0, updatedAt = CURRENT_TIMESTAMP
WHERE walletAddress = ? AND isActive = 1;
```

---

## Security Considerations

- **JWT_SECRET** is never exposed to the client — it exists only in the dApp's `.env` file
- **Nonce is single-use** — prevents replay attacks even if the signed message is intercepted
- **Origin validation** — `auth-bridge.ts` only accepts `postMessage` from the configured dApp origin
- **No token in URLs** — JWT is never passed as a query parameter (only in `Authorization` header)
- **Short-lived sessions** — 24-hour expiry limits the window of exposure if a token is compromised
- **Database session tracking** — Every JWT has a corresponding `ExtensionSession` record, allowing server-side revocation
- **No shared secrets** — The extension never stores API keys; all authentication is via SIWE-derived JWTs

---

## See Also

- **[System Overview](/architecture/system-overview)** — How auth fits into the full architecture
- **[Security Model](/architecture/security-model)** — Extension isolation and API key protection
- **[Database Schema](/architecture/database-schema)** — ExtensionSession and UserProfile models
