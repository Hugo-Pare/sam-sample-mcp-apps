# Banking MCP Server with OAuth 2.0

A comprehensive Model Context Protocol (MCP) server demonstrating OAuth 2.0 Authorization Code Grant with PKCE and **Dynamic Client Registration (RFC 7591)**. This server provides banking operations with scope-based permissions and supports programmatic client registration.

## Features

- ✅ **OAuth 2.0 Authorization Code Grant + PKCE** (RFC 7636)
- ✅ **Dynamic Client Registration** (RFC 7591) - Register clients programmatically
- ✅ **Token Revocation** (RFC 7009)
- ✅ **OAuth Protected Resource Metadata** - `.well-known/oauth-protected-resource` endpoint
- ✅ **Multiple Client Authentication Methods** - Basic Auth, POST body, or public clients
- ✅ **JWT Access Tokens** - Self-contained, stateless validation
- ✅ **Scope-Based Permissions** - Fine-grained access control
- ✅ **Consolidated Architecture** - OAuth + MCP on single port (6001)
- ✅ **Dual Transport** - SSE (port 6000) and HTTP (port 6001)
- ✅ **Banking Operations** - Accounts, transactions, payments, profiles
- ✅ **3 Demo Users** - Different scope access levels

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  External Application                                        │
│  ├─ Register via POST /oauth/register                       │
│  ├─ Receive client_id                                        │
│  └─ Use client_id in OAuth flow                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Banking MCP HTTP Server (Port 6001)                        │
│  ├─ OAuth 2.0 Authorization Server                          │
│  │  ├─ Dynamic Client Registration                          │
│  │  ├─ Authorization Endpoint (PKCE required)               │
│  │  ├─ Token Endpoint                                        │
│  │  ├─ Token Introspection & Revocation                     │
│  │  └─ OAuth Resource Metadata Discovery                    │
│  └─ MCP HTTP Endpoints (Per-request auth)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (JWT Access Token)
┌─────────────────────────────────────────────────────────────┐
│  Banking MCP SSE Server (Port 6000)                         │
│  └─ Session-based authentication                            │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Project

```bash
npm run build
```

### 3. Start Servers

Start both servers in separate terminals:

```bash
# Terminal 1: HTTP MCP Server (includes OAuth 2.0 endpoints)
npm run start:http

# Terminal 2: SSE MCP Server (optional)
npm run start
```

### Quick Reference

**Discovery Endpoint:**
```
GET http://localhost:6001/.well-known/oauth-protected-resource
```

**Register a Client:**
```bash
curl -X POST http://localhost:6001/oauth/register \
  -H "Content-Type: application/json" \
  -d '{"client_name":"My App","redirect_uris":["http://localhost:8080/callback"]}'
```

**Get Access Token:**
```bash
# 1. Open browser to authorize:
http://localhost:6001/oauth/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&response_type=code&scope=accounts:read&state=xyz&code_challenge=CHALLENGE&code_challenge_method=S256

# 2. Exchange code for token:
curl -X POST http://localhost:6001/oauth/token \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -d "grant_type=authorization_code&code=CODE&redirect_uri=REDIRECT_URI&code_verifier=VERIFIER"
```

**Call Banking API:**
```bash
curl -X POST http://localhost:6001/mcp \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_accounts","arguments":{}}}'
```

## Dynamic Client Registration

### Register a New Client

External applications can register themselves programmatically:

```bash
curl -X POST http://localhost:6001/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "My Banking App",
    "redirect_uris": ["https://myapp.example.com/callback"],
    "grant_types": ["authorization_code", "refresh_token"],
    "token_endpoint_auth_method": "none",
    "scope": "accounts:read transactions:read"
  }'
```

**Response:**

```json
{
  "client_id": "client_abc123xyz",
  "client_name": "My Banking App",
  "redirect_uris": ["https://myapp.example.com/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "scope": "accounts:read transactions:read",
  "client_id_issued_at": 1234567890
}
```

### Client Metadata Options

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `client_name` | ✅ Yes | - | Human-readable client name |
| `redirect_uris` | ✅ Yes | - | Array of valid redirect URIs |
| `grant_types` | No | `["authorization_code"]` | OAuth grant types |
| `response_types` | No | `["code"]` | OAuth response types |
| `token_endpoint_auth_method` | No | `"none"` | `"none"`, `"client_secret_post"`, or `"client_secret_basic"` |
| `scope` | No | - | Space-separated list of scopes |

**Authentication Methods:**
- `none` - Public client (no client secret, mobile/SPA apps)
- `client_secret_post` - Client secret in POST body
- `client_secret_basic` - Client secret via HTTP Basic Auth (most secure)

### Use Registered Client

After registration, use the `client_id` in the OAuth flow:

```bash
# Generate PKCE challenge
code_verifier=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')
code_challenge=$(echo -n "$code_verifier" | openssl dgst -sha256 -binary | base64 | tr -d '=' | tr '+/' '-_')

# Open authorization URL in browser
http://localhost:6001/oauth/authorize?\
client_id=client_abc123xyz&\
redirect_uri=https://myapp.example.com/callback&\
response_type=code&\
scope=accounts:read%20transactions:read&\
state=random_state&\
code_challenge=$code_challenge&\
code_challenge_method=S256
```

## Complete OAuth 2.0 Flow

### Step 1: Discovery

Fetch the OAuth 2.0 server metadata to discover available endpoints and supported features:

```bash
curl http://localhost:6001/.well-known/oauth-protected-resource | jq .
```

**Response:**
```json
{
  "resource": "http://localhost:6001",
  "authorization_servers": ["http://localhost:6001"],
  "scopes_supported": [
    "accounts:read",
    "transactions:read",
    "payments:write",
    "profile:read"
  ],
  "bearer_methods_supported": ["header"],
  "authorization_endpoint": "http://localhost:6001/oauth/authorize",
  "token_endpoint": "http://localhost:6001/oauth/token",
  "registration_endpoint": "http://localhost:6001/oauth/register",
  "introspection_endpoint": "http://localhost:6001/oauth/introspect",
  "revocation_endpoint": "http://localhost:6001/oauth/revoke",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": [
    "none",
    "client_secret_post",
    "client_secret_basic"
  ]
}
```

### Step 2: Generate PKCE Challenge

```bash
code_verifier=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')
code_challenge=$(echo -n "$code_verifier" | openssl dgst -sha256 -binary | base64 | tr -d '=' | tr '+/' '-_')
```

### Step 3: Authorization Request

Open in browser:

```
http://localhost:6001/oauth/authorize?\
client_id=banking-mcp-client&\
redirect_uri=http://localhost:8080/callback&\
response_type=code&\
scope=accounts:read%20transactions:read%20profile:read&\
state=test123&\
code_challenge=$code_challenge&\
code_challenge_method=S256
```

Select a demo user:
- **user_basic** - `accounts:read`, `profile:read`
- **user_transactions** - `accounts:read`, `transactions:read`, `profile:read`
- **user_full** - All scopes

### Step 4: Token Exchange

The token endpoint supports two client authentication methods:

**Option 1: HTTP Basic Authentication (Recommended)**

```bash
curl -X POST http://localhost:6001/oauth/token \
  -u "banking-mcp-client:client_secret" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=authz_..." \
  -d "redirect_uri=http://localhost:8080/callback" \
  -d "code_verifier=$code_verifier"
```

**Option 2: POST Body Authentication**

```bash
curl -X POST http://localhost:6001/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=authz_..." \
  -d "redirect_uri=http://localhost:8080/callback" \
  -d "client_id=banking-mcp-client" \
  -d "client_secret=client_secret" \
  -d "code_verifier=$code_verifier"
```

> **Note:** For clients with `token_endpoint_auth_method: "none"` (public clients), you can omit the client secret and just provide the `client_id`.

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "accounts:read transactions:read profile:read"
}
```

### Step 5: Call Banking API

```bash
ACCESS_TOKEN="<your_access_token>"

# Get accounts
curl -X POST http://localhost:6001/mcp \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_accounts",
      "arguments": {}
    }
  }' | jq .
```

### Step 6: Refresh Token

```bash
curl -X POST http://localhost:6001/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$REFRESH_TOKEN"
```

## OAuth Scopes

| Scope | Description | Tools | Resources |
|-------|-------------|-------|-----------|
| `accounts:read` | View account balances | `get_accounts`, `get_account_balance` | `banking://accounts/all` |
| `transactions:read` | View transaction history | `get_transactions` | `banking://transactions/recent` |
| `payments:write` | Initiate payments | `initiate_payment` | - |
| `profile:read` | View/update profile | `get_customer_profile`, `update_customer_profile` | `banking://profile` |

## Banking Tools

### 1. get_accounts

Get list of bank accounts for the authenticated user.

**Required Scope:** `accounts:read`

```json
{
  "name": "get_accounts",
  "arguments": {}
}
```

### 2. get_account_balance

Get balance for a specific account.

**Required Scope:** `accounts:read`

```json
{
  "name": "get_account_balance",
  "arguments": {
    "accountId": "acc_basic_001"
  }
}
```

### 3. get_transactions

Get transaction history for an account.

**Required Scope:** `transactions:read`

```json
{
  "name": "get_transactions",
  "arguments": {
    "accountId": "acc_basic_001",
    "limit": 50
  }
}
```

### 4. get_customer_profile

Get customer profile information.

**Required Scope:** `profile:read`

```json
{
  "name": "get_customer_profile",
  "arguments": {}
}
```

### 5. update_customer_profile

Update customer profile information.

**Required Scope:** `profile:read`

```json
{
  "name": "update_customer_profile",
  "arguments": {
    "phone": "+1-555-0199",
    "preferredLanguage": "en",
    "notifications": {
      "email": true,
      "sms": true,
      "push": false
    }
  }
}
```

### 6. initiate_payment

Initiate a payment to another account.

**Required Scope:** `payments:write`

```json
{
  "name": "initiate_payment",
  "arguments": {
    "fromAccountId": "acc_full_001",
    "toAccountNumber": "****5678",
    "amount": 100.00,
    "description": "Payment description"
  }
}
```

## Resources

### banking://accounts/all

List of all user bank accounts.

**Required Scope:** `accounts:read`

### banking://transactions/recent

Recent transactions across all accounts.

**Required Scope:** `transactions:read`

### banking://profile

Customer profile information.

**Required Scope:** `profile:read`

## Prompts

### financial_summary

Generate a financial summary with account balances and recent activity.

**Required Scope:** `accounts:read`

### spending_analysis

Analyze spending patterns across categories.

**Required Scope:** `transactions:read`

**Arguments:**
- `days` (optional): Number of days to analyze (default: 30)

### account_overview

Detailed overview of all accounts.

**Required Scope:** `accounts:read`

## Demo Users

| User | Username | Scopes |
|------|----------|--------|
| **user_basic** | john.doe | `accounts:read`, `profile:read` |
| **user_transactions** | jane.smith | `accounts:read`, `transactions:read`, `profile:read` |
| **user_full** | admin.user | All scopes |

## Token Revocation

Revoke an access or refresh token:

```bash
curl -X POST http://localhost:6001/oauth/revoke \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=$ACCESS_TOKEN" \
  -d "token_type_hint=access_token"
```

## Error Handling

### OAuth Errors

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `invalid_request` | Missing required parameter | 400 |
| `invalid_client` | Unknown client_id | 400 |
| `invalid_grant` | Invalid authorization code or PKCE failure | 400 |
| `invalid_token` | Invalid, expired, or revoked token | 401 |
| `insufficient_scope` | Insufficient permissions | 403 |

### MCP Errors

MCP servers return `WWW-Authenticate` header with error details:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="Banking MCP", error="invalid_token"
```

## Security Considerations

### Production Deployment

1. **Change JWT Secret**: Set `JWT_SECRET` environment variable to a strong random value
2. **Use HTTPS**: All endpoints must use TLS/SSL in production
3. **Validate Redirect URIs**: Strictly validate redirect_uris during registration
4. **Implement Rate Limiting**: Prevent abuse of registration and token endpoints
5. **Token Storage**: Use secure storage (Redis, database) instead of in-memory Maps
6. **Password Hashing**: Use bcrypt for user passwords (currently plain text for demo)
7. **CORS Configuration**: Configure appropriate CORS policies for your domain
8. **Logging**: Implement secure logging (avoid logging sensitive data like tokens)
9. **Client Secret Storage**: Store client secrets securely (hashed, not plain text)
10. **Token Expiration**: Adjust token expiration times based on your security requirements

### PKCE

- **S256 required**: Plain method is not supported
- **Code verifier**: 43-128 characters, base64url encoded
- **Code challenge**: SHA256 hash of code_verifier, base64url encoded

## Project Structure

```
banking-mcp/
├── src/
│   ├── types.ts              # TypeScript interfaces
│   ├── jwt-utils.ts          # JWT operations & PKCE validation
│   ├── oauth-storage.ts      # OAuth state management
│   ├── banking-data.ts       # Mock banking data
│   ├── auth.ts               # Token validation & permissions
│   ├── index.ts              # SSE MCP server (port 6000)
│   └── streamable-http.ts    # HTTP MCP server + OAuth 2.0 (port 6001)
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

**Note:** The OAuth 2.0 authorization server is integrated into `streamable-http.ts` for simplified deployment.

## API Endpoints

### HTTP Server (Port 6001)

**OAuth 2.0 Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/.well-known/oauth-protected-resource` | OAuth Resource Metadata |
| POST | `/oauth/register` | Dynamic Client Registration |
| GET | `/oauth/authorize` | Authorization endpoint |
| POST | `/oauth/token` | Token endpoint |
| POST | `/oauth/introspect` | Token introspection |
| POST | `/oauth/revoke` | Token revocation |

**MCP Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mcp` | MCP JSON-RPC endpoint (requires Bearer token) |
| GET | `/health` | Health check |

### SSE Server (Port 6000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sse` | SSE connection (requires Bearer token) |
| POST | `/message` | MCP message handler |

## License

MIT

## Contributing

This is a demonstration project showcasing OAuth 2.0 with Dynamic Client Registration in an MCP server. Contributions are welcome!
