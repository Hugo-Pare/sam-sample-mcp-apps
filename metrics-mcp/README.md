# MetricsHub MCP Server

MetricsHub is a Model Context Protocol (MCP) server that provides analytics dashboard capabilities with **API key authentication** and **role-based access control (RBAC)**. It demonstrates MCP implementation with both **SSE (Server-Sent Events)** and **Streamable HTTP** transports, requiring authentication for access.

## Features

### Authentication

**API Key Required**: All requests must include a valid API key.

**Authentication Methods**:
1. **HTTP Header** (recommended): `X-API-Key: YOUR_KEY`
2. **Query Parameter**: `?apiKey=YOUR_KEY`

**Demo API Keys**:
```
Viewer Role  (read-only):     mh_viewer_demo123
Analyst Role (read+write):    mh_analyst_demo456
Admin Role   (full access):   mh_admin_demo789
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **viewer** | Read-only access to metrics, dashboards, reports, and public resources |
| **analyst** | All viewer permissions + create dashboards, export data, access sample datasets |
| **admin** | All analyst permissions + user management and system configuration |

### Tools (7 total)

#### Public Tools (all roles)
- **get_metrics** - Retrieve specific metrics data with trends and comparisons
- **list_dashboards** - List all available analytics dashboards
- **run_query** - Execute analytics queries on metrics data
- **get_report** - Generate analytics reports from templates

#### Analyst+ Tools
- **create_dashboard** - Create custom analytics dashboards
- **export_data** - Export metrics in CSV, JSON, or XLSX format

#### Admin Only Tools
- **manage_users** - Manage API keys and user permissions

### Resources

- `metrics://dashboards/all` - All available dashboards (viewer+)
- `metrics://templates/reports` - Report templates (viewer+)
- `metrics://data/sample` - Sample analytics dataset (analyst+)

### Prompts

- **analyze_trends** - Analyze metric trends and identify patterns (all roles)
- **create_report_brief** - Generate executive summary reports (all roles)
- **optimization_recommendations** - Get optimization recommendations (analyst+)

## Installation

```bash
cd metrics-mcp
npm install
npm run build
```

## Usage

### SSE Transport (Port 4000)

Start the SSE server:

```bash
npm run start
```

Connect with API key via query parameter:
```
http://localhost:4000/sse?apiKey=mh_viewer_demo123
```

### Streamable HTTP Transport (Port 4001)

Start the HTTP server:

```bash
npm run start:http
```

Connect with API key via header or query parameter:
```bash
# Using header (recommended)
curl -X POST http://localhost:4001/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mh_viewer_demo123" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Using query parameter
curl -X POST http://localhost:4001/mcp?apiKey=mh_viewer_demo123 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Example Requests

### Authentication

#### Valid API Key (Success)
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

#### Missing API Key (401 Unauthorized)
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {"name": "get_metrics"}
  }'
```

### Permission Examples

#### Viewer - Can Read (Success)
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mh_viewer_demo123" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_dashboards",
      "arguments": {}
    }
  }'
```

#### Viewer - Cannot Write (403 Forbidden)
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mh_viewer_demo123" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "create_dashboard",
      "arguments": {"name": "Test", "widgets": []}
    }
  }'
```

#### Analyst - Can Create (Success)
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mh_analyst_demo456" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "create_dashboard",
      "arguments": {
        "name": "Sales Dashboard",
        "widgets": [
          {
            "id": "w1",
            "type": "chart",
            "title": "Revenue Trend"
          }
        ]
      }
    }
  }'
```

#### Admin - Full Access (Success)
```bash
curl -X POST http://localhost:4001/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mh_admin_demo789" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "manage_users",
      "arguments": {"action": "list"}
    }
  }'
```

## Permission Matrix

| Tool | Viewer | Analyst | Admin |
|------|--------|---------|-------|
| get_metrics | ✅ | ✅ | ✅ |
| list_dashboards | ✅ | ✅ | ✅ |
| run_query | ✅ | ✅ | ✅ |
| get_report | ✅ | ✅ | ✅ |
| create_dashboard | ❌ | ✅ | ✅ |
| export_data | ❌ | ✅ | ✅ |
| manage_users | ❌ | ❌ | ✅ |

| Resource | Viewer | Analyst | Admin |
|----------|--------|---------|-------|
| metrics://dashboards/all | ✅ | ✅ | ✅ |
| metrics://templates/reports | ✅ | ✅ | ✅ |
| metrics://data/sample | ❌ | ✅ | ✅ |

## Testing

Run the provided test scripts to verify authentication and authorization:

```bash
# Test viewer role (read-only)
./test-viewer.sh

# Test analyst role (read+write)
./test-analyst.sh

# Test admin role (full access)
./test-admin.sh

# Test unauthorized access scenarios
./test-unauthorized.sh
```

## Available Metrics

```
Revenue Metrics:
  revenue_mrr    - Monthly Recurring Revenue (USD)
  revenue_arr    - Annual Recurring Revenue (USD)
  revenue_churn  - Revenue Churn Rate (%)

User Metrics:
  users_dau       - Daily Active Users
  users_mau       - Monthly Active Users
  users_total     - Total Users
  users_retention - User Retention Rate (%)

Performance Metrics:
  perf_response_time - Average Response Time (ms)
  perf_uptime        - System Uptime (%)
  perf_throughput    - Request Throughput (req/s)

Engagement Metrics:
  engagement_session_duration - Average Session Duration (minutes)
  engagement_features         - Feature Usage (count)
```

## Available Dashboards

1. **Revenue Overview** - Track revenue metrics and financial performance
2. **User Engagement** - Monitor user activity and engagement metrics
3. **Performance Metrics** - System performance and response time monitoring
4. **Executive Summary** - High-level KPIs and business metrics

## Configuration

### MCP Client Configuration

#### SSE Transport (with API key)
```json
{
  "mcpServers": {
    "metricshub": {
      "url": "http://localhost:4000/sse?apiKey=mh_viewer_demo123",
      "transport": "sse"
    }
  }
}
```

#### HTTP Transport (API key in header)
```json
{
  "mcpServers": {
    "metricshub": {
      "url": "http://localhost:4001/mcp",
      "transport": "http",
      "headers": {
        "X-API-Key": "mh_viewer_demo123"
      }
    }
  }
}
```

## Error Responses

### 401 Unauthorized
Returned when:
- No API key provided
- Invalid API key provided
- API key format is incorrect

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Missing API key. Provide via X-API-Key header or apiKey query parameter."
  },
  "id": 1
}
```

### 403 Forbidden
Returned when:
- Valid API key but insufficient permissions for requested operation

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32002,
    "message": "Access denied. Tool 'create_dashboard' requires role: analyst or admin. Your role: viewer"
  },
  "id": 2
}
```

## Architecture

```
metrics-mcp/
├── src/
│   ├── auth.ts              # API key validation & permission checking
│   ├── types.ts             # TypeScript interfaces
│   ├── metrics-data.ts      # Mock analytics data generator
│   ├── index.ts             # SSE server with session-based auth
│   └── streamable-http.ts   # HTTP server with request-based auth
├── dist/                    # Compiled JavaScript
├── test-*.sh                # Test scripts for each role
├── package.json
├── tsconfig.json
└── README.md
```

## Security Features

- **API Key Authentication**: All non-initialize requests require valid API key
- **Role-Based Access Control**: Three-tier permission system (viewer/analyst/admin)
- **Flexible Auth Methods**: Support both header and query parameter authentication
- **Session Security**: SSE sessions authenticated at connection time
- **Permission Validation**: Every tool and resource checked before execution
- **Detailed Error Messages**: Clear feedback on authentication and authorization failures

## Development

### Build
```bash
npm run build
```

### Run SSE Server
```bash
npm run start
```

### Run HTTP Server
```bash
npm run start:http
```

### Watch Mode
```bash
npm run watch
```

## Transport Comparison

| Feature | SSE | HTTP |
|---------|-----|------|
| Port | 4000 | 4001 |
| Connection | Persistent | Request/Response |
| Auth Method | Query Parameter | Header or Query |
| Session | Yes | No |
| Real-time | Yes | No |

## Production Considerations

For production deployment:

1. **Environment Variables**: Store API keys in environment variables, not hardcoded
2. **HTTPS**: Use HTTPS for both transports to encrypt API keys in transit
3. **Rate Limiting**: Implement per-key rate limiting to prevent abuse
4. **API Key Rotation**: Implement key expiration and rotation mechanisms
5. **Audit Logging**: Log all authenticated requests with user identity
6. **Database Storage**: Store API keys in secure database with hashing
7. **CORS Configuration**: Configure CORS headers for web clients

## License

MIT

## Contributing

This is a sample MCP server demonstrating API key authentication and RBAC patterns.
