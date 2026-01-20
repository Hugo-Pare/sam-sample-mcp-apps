# Sample MCP Servers Collection

A collection of sample Model Context Protocol (MCP) servers demonstrating different authentication patterns and transport implementations.

## Available Servers

### 1. WeatherFlow (No Authentication)
**Location**: [weather-mcp/](weather-mcp/)

Real-time weather data service providing current conditions, forecasts, and severe weather alerts.

**Features**:
- No authentication required (public access)
- SSE transport on port 3000
- HTTP transport on port 3001
- 5 weather tools
- 2 resources
- 3 prompts

**Use Cases**:
- Development and testing
- Public weather dashboards
- Educational purposes
- Open data applications

[View Documentation →](weather-mcp/README.md)

---

### 2. MetricsHub (API Key Authentication)
**Location**: [metrics-mcp/](metrics-mcp/)

Analytics dashboard platform with comprehensive API key authentication and role-based access control.

**Features**:
- **API Key Authentication** (header or query parameter)
- **Role-Based Access Control** (viewer/analyst/admin)
- SSE transport on port 4000
- HTTP transport on port 4001
- 7 analytics tools
- 3 resources with permission controls
- 3 prompts

**Authentication**:
```
Viewer:  mh_viewer_demo123  (read-only)
Analyst: mh_analyst_demo456 (read+write)
Admin:   mh_admin_demo789   (full access)
```

**Use Cases**:
- Private analytics platforms
- Business intelligence tools
- Multi-tenant SaaS applications
- Systems requiring access control

[View Documentation →](metrics-mcp/README.md)

---

### 3. SupportDesk (Basic Authentication)
**Location**: [support-mcp/](support-mcp/)

Customer support and helpdesk system with Basic Authentication (username/password) and role-based access control.

**Features**:
- **Basic Authentication** (HTTP Basic Auth - RFC 7617)
- **Role-Based Access Control** (agent/supervisor/admin)
- SSE transport on port 5000
- HTTP transport on port 5001
- 10 support tools
- 5 resources with permission controls
- 3 prompts

**Credentials**:
```
Agent:      agent1 / pass123       (basic support)
Supervisor: supervisor1 / super123 (+ assignment, stats)
Admin:      admin / admin123       (full access)
```

**Use Cases**:
- Customer support systems
- Helpdesk platforms
- Ticketing systems
- Systems requiring user authentication

[View Documentation →](support-mcp/README.md)

---

### 4. BankingFlow (OAuth 2.0 with PKCE)
**Location**: [banking-mcp/](banking-mcp/)

Comprehensive banking platform with OAuth 2.0 Authorization Code Grant + PKCE and Dynamic Client Registration (RFC 7591).

**Features**:
- **OAuth 2.0 Authorization Code Grant + PKCE** (RFC 7636)
- **Dynamic Client Registration** (RFC 7591)
- **Token Revocation** (RFC 7009)
- **Scope-Based Permissions** (accounts:read, transactions:read, payments:write, profile:read)
- **Multiple Client Authentication Methods** (Basic Auth, POST body, public clients)
- **JWT Access Tokens** with refresh tokens
- **Consolidated Architecture** - OAuth + MCP on port 6001
- SSE transport on port 6000
- HTTP transport on port 6001 (includes OAuth endpoints)
- 6 banking tools
- 3 resources with scope-based permissions
- 3 prompts

**Demo Users**:
```
user_basic:        accounts:read, profile:read
user_transactions: accounts:read, transactions:read, profile:read
user_full:         All scopes (full access)
```

**OAuth Flow**:
```
1. Register client via /oauth/register
2. Get authorization code via /oauth/authorize
3. Exchange code for access token via /oauth/token
4. Use Bearer token to access banking APIs
```

**Use Cases**:
- Banking and financial applications
- OAuth 2.0 server implementations
- Applications requiring dynamic client registration
- Scope-based permission systems
- Secure third-party API access

[View Documentation →](banking-mcp/README.md)

---

## Quick Start

### WeatherFlow (No Auth)

```bash
cd weather-mcp
npm install
npm run build

# Start SSE server
npm run start

# Or start HTTP server
node dist/streamable-http.js
```

Test it:
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_current_weather",
      "arguments": {"location": "Tokyo"}
    }
  }'
```

### MetricsHub (API Key Auth)

```bash
cd metrics-mcp
npm install
npm run build

# Start SSE server
npm run start

# Or start HTTP server
npm run start:http
```

Test it:
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mh_viewer_demo123" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_metrics",
      "arguments": {"metricId": "revenue_mrr"}
    }
  }'
```

### SupportDesk (Basic Auth)

```bash
cd support-mcp
npm install
npm run build

# Start SSE server
npm run start

# Or start HTTP server
npm run start:http
```

Test it:
```bash
curl -u agent1:pass123 -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_tickets",
      "arguments": {}
    }
  }'
```

### BankingFlow (OAuth 2.0)

```bash
cd banking-mcp
npm install
npm run build

# Start HTTP server (includes OAuth endpoints)
npm run start:http

# Or start SSE server
npm run start
```

Test OAuth flow:
```bash
# 1. Register a client
curl -X POST http://localhost:6001/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test App",
    "redirect_uris": ["http://localhost:8080/callback"]
  }'

# 2. Get authorization (open in browser, select user_full)
# http://localhost:6001/oauth/authorize?client_id=CLIENT_ID&redirect_uri=http://localhost:8080/callback&response_type=code&scope=accounts:read&state=test&code_challenge=CHALLENGE&code_challenge_method=S256

# 3. Exchange code for token
curl -X POST http://localhost:6001/oauth/token \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -d "grant_type=authorization_code&code=CODE&redirect_uri=http://localhost:8080/callback&code_verifier=VERIFIER"

# 4. Use the access token
curl -X POST http://localhost:6001/mcp \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_accounts",
      "arguments": {}
    }
  }'
```

## Server Comparison

| Feature | WeatherFlow | MetricsHub | SupportDesk | BankingFlow |
|---------|-------------|------------|-------------|-------------|
| **Authentication** | None | API Key | Basic Auth | OAuth 2.0 + PKCE |
| **Authorization** | N/A | RBAC (3 tiers) | RBAC (3 tiers) | Scope-based |
| **SSE Port** | 3000 | 4000 | 5000 | 6000 |
| **HTTP Port** | 3001 | 4001 | 5001 | 6001 (+ OAuth) |
| **Tools** | 5 | 7 | 10 | 6 |
| **Resources** | 2 | 3 | 5 | 3 |
| **Prompts** | 3 | 3 | 3 | 3 |
| **Access Control** | Public | RBAC | RBAC | Scope-based |
| **Token Type** | N/A | Static | N/A | JWT (access + refresh) |
| **Dynamic Registration** | N/A | N/A | N/A | ✅ RFC 7591 |
| **Error Codes** | 500 | 401, 403, 500 | 401, 403, 500 | 400, 401, 403, 500 |
| **Use Case** | Public APIs | Analytics/BI | Support/Helpdesk | Banking/Finance |

## Transport Support

All servers support:
- **SSE (Server-Sent Events)** - Persistent connection with real-time updates
- **HTTP (Streamable HTTP)** - Standard request/response
- **Stdio** - For local CLI testing

## Authentication Patterns Demonstrated

### WeatherFlow - No Authentication
- Open public access
- No credentials required
- No permission checks
- Ideal for public data and development

### MetricsHub - API Key Authentication
- Required API key for all operations
- Support for both header (`X-API-Key`) and query parameter (`?apiKey=`) auth
- Three-tier role-based access control (viewer/analyst/admin)
- Permission checks at tool and resource level
- Detailed error responses (401 vs 403)

### SupportDesk - Basic Authentication
- HTTP Basic Auth (username:password)
- RFC 7617 compliant
- Three-tier role-based access control (agent/supervisor/admin)
- Authorization header: `Authorization: Basic base64(username:password)`
- WWW-Authenticate header in 401 responses
- User identity tracking

### BankingFlow - OAuth 2.0 with PKCE
- OAuth 2.0 Authorization Code Grant with PKCE (RFC 7636)
- Dynamic Client Registration (RFC 7591)
- Token Revocation (RFC 7009)
- JWT access tokens with refresh tokens
- Scope-based permissions (accounts:read, transactions:read, payments:write, profile:read)
- Multiple client authentication methods (Basic Auth, POST body, public clients)
- OIDC-like discovery endpoint (`.well-known/oauth-protected-resource`)
- Authorization header: `Authorization: Bearer <jwt_token>`
- Consolidated OAuth + MCP server on single port

## Testing

Each server includes comprehensive test scripts:

### WeatherFlow
```bash
cd weather-mcp
# Manual curl tests documented in README
```

### MetricsHub
```bash
cd metrics-mcp

# Test different roles
./test-viewer.sh       # Read-only access
./test-analyst.sh      # Read+write access
./test-admin.sh        # Full access
./test-unauthorized.sh # Auth failure scenarios
```

### SupportDesk
```bash
cd support-mcp

# Test different roles
./test-agent.sh        # Basic support access
./test-supervisor.sh   # + assignment, stats
./test-admin.sh        # Full access
./test-unauthorized.sh # Auth failure scenarios
```

### BankingFlow
```bash
cd banking-mcp

# Test OAuth 2.0 flow
# 1. Discovery
curl http://localhost:6001/.well-known/oauth-protected-resource | jq .

# 2. Register client
curl -X POST http://localhost:6001/oauth/register \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Test","redirect_uris":["http://localhost:8080/callback"]}'

# 3. Full OAuth flow with PKCE (see README for complete examples)
# - Generate PKCE challenge
# - Authorization request (browser)
# - Token exchange
# - API calls with Bearer token
```

## Architecture

All servers follow a consistent architecture:

```
server-name/
├── src/
│   ├── index.ts             # SSE server
│   ├── streamable-http.ts   # HTTP server
│   ├── data.ts              # Mock data layer
│   ├── auth.ts              # Auth layer (MetricsHub, SupportDesk)
│   └── types.ts             # TypeScript types (MetricsHub, SupportDesk)
├── dist/                    # Compiled JavaScript
├── test-*.sh                # Test scripts (MetricsHub, SupportDesk)
├── package.json
├── tsconfig.json
├── README.md
└── TESTING.md
```

## Completed Servers

✅ **WeatherFlow** - No authentication (public access)
✅ **MetricsHub** - API Key authentication with RBAC
✅ **SupportDesk** - Basic Authentication with RBAC
✅ **BankingFlow** - OAuth 2.0 + PKCE with Dynamic Client Registration
