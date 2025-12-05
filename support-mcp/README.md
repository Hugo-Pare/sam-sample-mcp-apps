# SupportDesk MCP Server

SupportDesk is a Model Context Protocol (MCP) server that provides customer support and helpdesk capabilities with **Basic Authentication** (username/password) and **role-based access control**. It demonstrates MCP implementation with both **SSE (Server-Sent Events)** and **Streamable HTTP** transports.

## Features

### Authentication

**Basic Auth Required**: All requests must include valid username and password credentials.

**Authentication Format**:
```
Authorization: Basic base64(username:password)
```

**Demo Credentials**:
```
Agent Role:      agent1 / pass123       (basic support operations)
Supervisor Role: supervisor1 / super123 (+ ticket assignment, stats)
Admin Role:      admin / admin123       (full system access)
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **agent** | Handle tickets, search KB, view customers, close tickets |
| **supervisor** | All agent permissions + assign tickets, view stats, access all customers |
| **admin** | All supervisor permissions + manage agents, system configuration |

### Tools (10 total)

#### Agent Tools (all roles)
- **list_tickets** - List support tickets with filters
- **get_ticket** - Get detailed ticket information
- **create_ticket** - Create new support tickets
- **update_ticket** - Update ticket details
- **close_ticket** - Close resolved tickets
- **search_knowledge_base** - Search KB articles
- **get_customer_info** - Get customer information

#### Supervisor+ Tools
- **assign_ticket** - Assign tickets to agents
- **get_support_stats** - View performance statistics

#### Admin Only Tools
- **manage_agents** - Manage support team members

### Resources (5 total)

- `support://tickets/open` - All open tickets (agent+)
- `support://tickets/my-assigned` - Current user's assigned tickets (agent+)
- `support://knowledge-base/articles` - Knowledge base articles (agent+)
- `support://customers/all` - Complete customer list (supervisor+)
- `support://stats/performance` - Performance metrics (supervisor+)

### Prompts (3 total)

- **suggest_response** - AI-suggested response to ticket (agent+)
- **escalation_report** - Create escalation report (supervisor+)
- **performance_analysis** - Analyze team performance (supervisor+)

## Installation

```bash
cd support-mcp
npm install
npm run build
```

## Usage

### HTTP Transport (Port 5001) - Recommended

Start the HTTP server:

```bash
npm run start:http
```

Make requests using curl's `-u` flag:

```bash
# Using curl -u shorthand
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

# Or manually construct Authorization header
curl -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'agent1:pass123' | base64)" \
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

### SSE Transport (Port 5000)

Start the SSE server:

```bash
npm run start
```

Connect with Basic Auth credentials in Authorization header:

```bash
# SSE connection with Basic Auth
curl -H "Authorization: Basic $(echo -n 'agent1:pass123' | base64)" \
     http://localhost:5000/sse
```

## Example Requests

### Successful Authentication

#### List Tickets (Agent)
```bash
curl -u agent1:pass123 -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_tickets",
      "arguments": {"status": "open"}
    }
  }'
```

#### Search Knowledge Base
```bash
curl -u agent1:pass123 -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge_base",
      "arguments": {"query": "password reset"}
    }
  }'
```

#### Assign Ticket (Supervisor)
```bash
curl -u supervisor1:super123 -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "assign_ticket",
      "arguments": {
        "ticketId": "TKT-001",
        "assignedTo": "agent1"
      }
    }
  }'
```

#### Manage Agents (Admin Only)
```bash
curl -u admin:admin123 -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "manage_agents",
      "arguments": {"action": "list"}
    }
  }'
```

### Failed Authentication Examples

#### No Credentials (401)
```bash
curl -X POST http://localhost:5001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tickets"}}'
```

Response:
```json
{
  "error": {
    "code": -32001,
    "message": "Missing Authorization header. Provide Basic Auth credentials..."
  }
}
```

#### Invalid Credentials (401)
```bash
curl -u wronguser:wrongpass -X POST http://localhost:5001/mcp \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tickets"}}'
```

Response:
```json
{
  "error": {
    "message": "Invalid username or password"
  }
}
```

#### Insufficient Permissions (403)
```bash
curl -u agent1:pass123 -X POST http://localhost:5001/mcp \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"assign_ticket"}}'
```

Response:
```json
{
  "error": {
    "message": "Access denied. Tool 'assign_ticket' requires role: supervisor or admin. Your role: agent"
  }
}
```

## Permission Matrix

| Tool | Agent | Supervisor | Admin |
|------|-------|------------|-------|
| list_tickets | ✅ | ✅ | ✅ |
| get_ticket | ✅ | ✅ | ✅ |
| create_ticket | ✅ | ✅ | ✅ |
| update_ticket | ✅ | ✅ | ✅ |
| close_ticket | ✅ | ✅ | ✅ |
| search_knowledge_base | ✅ | ✅ | ✅ |
| get_customer_info | ✅ | ✅ | ✅ |
| assign_ticket | ❌ | ✅ | ✅ |
| get_support_stats | ❌ | ✅ | ✅ |
| manage_agents | ❌ | ❌ | ✅ |

| Resource | Agent | Supervisor | Admin |
|----------|-------|------------|-------|
| support://tickets/open | ✅ | ✅ | ✅ |
| support://tickets/my-assigned | ✅ | ✅ | ✅ |
| support://knowledge-base/articles | ✅ | ✅ | ✅ |
| support://customers/all | ❌ | ✅ | ✅ |
| support://stats/performance | ❌ | ✅ | ✅ |

## Available Tickets

Sample support tickets in the system:

```
TKT-001 - Cannot login to account (open, high priority)
TKT-002 - Billing question (in_progress, medium priority)
TKT-003 - Feature request: Dark mode (waiting, low priority)
TKT-004 - App crashes on iOS (resolved, urgent)
```

## Testing

Run the provided test scripts:

```bash
# Test agent role
./test-agent.sh

# Test supervisor role
./test-supervisor.sh

# Test admin role
./test-admin.sh

# Test unauthorized access
./test-unauthorized.sh
```

## Configuration

### MCP Client Configuration

#### HTTP Transport
```json
{
  "mcpServers": {
    "supportdesk": {
      "url": "http://localhost:5001/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Basic YWdlbnQxOnBhc3MxMjM="
      }
    }
  }
}
```

Note: `YWdlbnQxOnBhc3MxMjM=` is base64 encoding of `agent1:pass123`

#### SSE Transport
```json
{
  "mcpServers": {
    "supportdesk": {
      "url": "http://localhost:5000/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Basic YWdlbnQxOnBhc3MxMjM="
      }
    }
  }
}
```

## Error Responses

### 401 Unauthorized
Missing or invalid credentials:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Invalid username or password"
  },
  "id": 1
}
```

Includes `WWW-Authenticate` header:
```
WWW-Authenticate: Basic realm="SupportDesk MCP Server"
```

### 403 Forbidden
Valid credentials but insufficient permissions:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32002,
    "message": "Access denied. Tool 'assign_ticket' requires role: supervisor or admin. Your role: agent"
  },
  "id": 2
}
```

## Architecture

```
support-mcp/
├── src/
│   ├── auth.ts              # Basic Auth validation & RBAC
│   ├── types.ts             # TypeScript interfaces
│   ├── support-data.ts      # Mock support data
│   ├── index.ts             # SSE server (port 5000)
│   └── streamable-http.ts   # HTTP server (port 5001)
├── dist/                    # Compiled JavaScript
├── test-*.sh                # Role-based test scripts
├── package.json
├── tsconfig.json
└── README.md
```

## Security Features

- **Basic Authentication**: Standard HTTP Basic Auth (RFC 7617)
- **Password Validation**: Username/password verification (demo uses plaintext, production should use bcrypt)
- **Role-Based Access Control**: Three-tier permission system
- **WWW-Authenticate Header**: Proper 401 response with realm
- **Session Security**: SSE sessions authenticated at connection time
- **Permission Checks**: Every tool and resource validated before execution

## Comparison with Other Auth Types

| Feature | Basic Auth (SupportDesk) | API Key (MetricsHub) | No Auth (WeatherFlow) |
|---------|--------------------------|----------------------|-----------------------|
| Auth Type | Username/Password | API Key | None |
| Header | Authorization: Basic | X-API-Key | N/A |
| Encoding | Base64 | Plain text | N/A |
| Standard | RFC 7617 | Custom | N/A |
| User Identity | Yes (username) | Limited (key name) | No |
| Rotation | Change password | Revoke/issue keys | N/A |

## Production Considerations

For production deployment:

1. **Password Hashing**: Use bcrypt or similar for password storage
2. **HTTPS Required**: Basic Auth sends credentials in every request
3. **Password Policy**: Enforce strong passwords
4. **Account Lockout**: Implement failed login attempt limits
5. **Session Timeout**: Expire SSE sessions after inactivity
6. **Audit Logging**: Log all authentication attempts
7. **TLS/SSL**: Mandatory for Basic Auth to prevent credential exposure

## Advantages of Basic Auth

- **Widely Supported**: Built into all HTTP clients and browsers
- **Simple to Implement**: No token management or state
- **User-Friendly**: Username/password familiar to all users
- **Stateless**: Each request contains full credentials (HTTP transport)
- **Standards-Based**: RFC 7617 compliant

## Limitations

- **Requires HTTPS**: Credentials sent in every request
- **No Expiration**: Passwords don't expire automatically
- **Limited Metadata**: Less user context than tokens
- **Logout Complexity**: Browser-based logout can be tricky

## License

MIT

## Contributing

This is a sample MCP server demonstrating Basic Authentication patterns with role-based access control.
