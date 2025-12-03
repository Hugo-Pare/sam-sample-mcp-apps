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

## Server Comparison

| Feature | WeatherFlow | MetricsHub |
|---------|-------------|------------|
| **Authentication** | None | API Key Required |
| **Authorization** | N/A | Role-Based (3 tiers) |
| **SSE Port** | 3000 | 4000 |
| **HTTP Port** | 3001 | 4001 |
| **Tools** | 5 | 7 |
| **Resources** | 2 | 3 |
| **Prompts** | 3 | 3 |
| **Access Control** | Public | RBAC (viewer/analyst/admin) |
| **Error Codes** | 500 | 401, 403, 500 |
| **Use Case** | Public APIs | Private/Enterprise |

## Transport Support

Both servers support:
- **SSE (Server-Sent Events)** - Persistent connection with real-time updates
- **HTTP (Streamable HTTP)** - Standard request/response
- **Stdio** - For local CLI testing

## Authentication Patterns Demonstrated

### WeatherFlow - No Authentication
- Open public access
- No API keys required
- No permission checks
- Ideal for public data and development

### MetricsHub - API Key Authentication
- Required API key for all operations
- Support for both header and query parameter auth
- Three-tier role-based access control
- Permission checks at tool and resource level
- Detailed error responses (401 vs 403)

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
./test-viewer.sh      # Read-only access
./test-analyst.sh     # Read+write access
./test-admin.sh       # Full access
./test-unauthorized.sh # Auth failure scenarios
```

## Architecture

Both servers follow a consistent architecture:

```
server-name/
├── src/
│   ├── index.ts             # SSE server
│   ├── streamable-http.ts   # HTTP server
│   ├── data.ts              # Mock data layer
│   ├── auth.ts              # Auth layer (MetricsHub only)
│   └── types.ts             # TypeScript types (MetricsHub only)
├── dist/                    # Compiled JavaScript
├── test-*.sh                # Test scripts (MetricsHub)
├── package.json
├── tsconfig.json
├── README.md
└── TESTING.md
```

## Key Learnings

### SSE Transport
- **Must NOT use `express.json()`** middleware
- SSE transport parses request body internally
- Session management via Map<sessionId, transport>
- Auth can be validated once at connection time

### HTTP Transport
- **Must use `express.json()`** for body parsing
- Auth must be validated per request
- Pass auth context to handler functions
- Standard REST API patterns apply

### MCP Request Handlers
- Use schema-based handler registration
- Return `{content: [], isError?: boolean}` format
- Permission checks before execution
- Clear error messages for auth/permission failures

## Future Servers

Planned additional authentication patterns:

1. **OAuth 2.0** - Token-based with refresh
2. **JWT** - Stateless token authentication
3. **Basic Auth** - Username/password
4. **mTLS** - Certificate-based authentication
5. **SAML** - Enterprise SSO

## Technology Stack

- **MCP SDK**: @modelcontextprotocol/sdk v1.0.0
- **Server Framework**: Express.js v4.18.2
- **Language**: TypeScript 5.3.0
- **Runtime**: Node.js 20+
- **Protocol**: JSON-RPC 2.0

## License

MIT

## Contributing

These are sample MCP servers for demonstration and educational purposes. Feel free to use them as templates for your own MCP server implementations.
