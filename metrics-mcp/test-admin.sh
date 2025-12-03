#!/bin/bash
# Test MetricsHub MCP Server - Admin Role
# API Key: mh_admin_demo789 (full access)

API_KEY="mh_admin_demo789"
URL="http://localhost:4001/mcp"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   MetricsHub - Testing Admin Role (Full Access)       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "1. Get Metrics (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_metrics","arguments":{"metricId":"revenue_arr"}}}' \
  | jq '.result.content[0].text | fromjson | {name, value, unit}'
echo ""

echo "2. Create Dashboard (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_dashboard","arguments":{"name":"Admin Dashboard","widgets":[]}}}' \
  | jq '.result.content[0].text | fromjson | {id, name, createdBy}'
echo ""

echo "3. Export Data (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"export_data","arguments":{"metricIds":["revenue_mrr","revenue_arr","users_total"],"format":"xlsx"}}}' \
  | jq '.result.content[0].text | fromjson | {format, filename}'
echo ""

echo "4. Manage Users - List (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"manage_users","arguments":{"action":"list"}}}' \
  | jq '.result.content[0].text | fromjson | map({name, role})'
echo ""

echo "5. Read All Resources (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":5,"method":"resources/read","params":{"uri":"metrics://data/sample"}}' \
  | jq '.result.contents[0].text | fromjson | {name, records}'
echo ""

echo "6. Run Complex Query (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"run_query","arguments":{"query":"SELECT category, AVG(value) FROM metrics GROUP BY category"}}}' \
  | jq '.result.content[0].text | fromjson | {rowCount, executionTime}'
echo ""

echo "════════════════════════════════════════════════════════"
echo "Admin Role Tests Complete - All Operations Authorized"
echo "════════════════════════════════════════════════════════"
