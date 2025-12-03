#!/bin/bash
# Test MetricsHub MCP Server - Analyst Role
# API Key: mh_analyst_demo456 (read+write access)

API_KEY="mh_analyst_demo456"
URL="http://localhost:4001/mcp"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   MetricsHub - Testing Analyst Role (Read+Write)      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "1. Get Metrics (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_metrics","arguments":{"metricId":"users_dau"}}}' \
  | jq '.result.content[0].text | fromjson | {id, name, value}'
echo ""

echo "2. Create Dashboard (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_dashboard","arguments":{"name":"Analyst Dashboard","widgets":[{"id":"w1","type":"chart","title":"Revenue"}]}}}' \
  | jq '.result.content[0].text | fromjson | {id, name, createdBy}'
echo ""

echo "3. Export Data (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"export_data","arguments":{"metricIds":["revenue_mrr","users_mau"],"format":"json"}}}' \
  | jq '.result.content[0].text | fromjson | {format, filename, size}'
echo ""

echo "4. Run Query (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"run_query","arguments":{"query":"SELECT * FROM metrics WHERE category = revenue"}}}' \
  | jq '.result.content[0].text | fromjson | {rowCount, executionTime}'
echo ""

echo "5. Read Restricted Resource (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":5,"method":"resources/read","params":{"uri":"metrics://data/sample"}}' \
  | jq '.result.contents[0].text | fromjson | {name, records}'
echo ""

echo "6. Manage Users (should FAIL - 403) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"manage_users","arguments":{"action":"list"}}}' \
  | jq '.error.message'
echo ""

echo "7. Test Query Parameter Auth (should SUCCEED) ✓"
curl -s -X POST "$URL?apiKey=$API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"get_metrics","arguments":{"metricId":"perf_uptime"}}}' \
  | jq '.result.content[0].text | fromjson | .name'
echo ""

echo "════════════════════════════════════════════════════════"
echo "Analyst Role Tests Complete"
echo "════════════════════════════════════════════════════════"
