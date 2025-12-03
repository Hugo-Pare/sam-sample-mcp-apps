#!/bin/bash
# Test MetricsHub MCP Server - Viewer Role
# API Key: mh_viewer_demo123 (read-only access)

API_KEY="mh_viewer_demo123"
URL="http://localhost:4001/mcp"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   MetricsHub - Testing Viewer Role (Read-Only)        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "1. Get Metrics (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_metrics","arguments":{"metricId":"revenue_mrr"}}}' \
  | jq '.result.content[0].text | fromjson | {id, name, value, trend}'
echo ""

echo "2. List Dashboards (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_dashboards","arguments":{}}}' \
  | jq '.result.content[0].text | fromjson | length'
echo " dashboards found"
echo ""

echo "3. Create Dashboard (should FAIL - 403) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"create_dashboard","arguments":{"name":"Test","widgets":[]}}}' \
  | jq '.error.message'
echo ""

echo "4. Export Data (should FAIL - 403) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"export_data","arguments":{"metricIds":["revenue_mrr"],"format":"csv"}}}' \
  | jq '.error.message'
echo ""

echo "5. Manage Users (should FAIL - 403) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"manage_users","arguments":{"action":"list"}}}' \
  | jq '.error.message'
echo ""

echo "6. Read Public Resource (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":6,"method":"resources/read","params":{"uri":"metrics://dashboards/all"}}' \
  | jq '.result.contents[0].text | fromjson | length'
echo " dashboards in resource"
echo ""

echo "7. Read Restricted Resource (should FAIL - 403) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":7,"method":"resources/read","params":{"uri":"metrics://data/sample"}}' \
  | jq '.error.message'
echo ""

echo "════════════════════════════════════════════════════════"
echo "Viewer Role Tests Complete"
echo "════════════════════════════════════════════════════════"
