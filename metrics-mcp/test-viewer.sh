#!/bin/bash
# Test MetricsHub MCP Server - Viewer Role
# API Key: mh_viewer_demo123 (read-only access)

API_KEY="mh_viewer_demo123"
URL="http://localhost:4001/mcp"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   MetricsHub - Testing Viewer Role (Read-Only)        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "1. List Tools (should return only 4 viewer tools) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  | jq '.result.tools | {count: length, names: map(.name)}'
echo ""

echo "2. List Resources (should return only 2 viewer resources) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":2,"method":"resources/list"}' \
  | jq '.result.resources | {count: length, uris: map(.uri)}'
echo ""

echo "3. Get Metrics (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_metrics","arguments":{"metricId":"revenue_mrr"}}}' \
  | jq '.result.content[0].text | fromjson | {id, name, value, trend}'
echo ""

echo "4. List Dashboards (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"list_dashboards","arguments":{}}}' \
  | jq '.result.content[0].text | fromjson | length'
echo " dashboards found"
echo ""

echo "5. Create Dashboard (should FAIL - 403) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"create_dashboard","arguments":{"name":"Test","widgets":[]}}}' \
  | jq '.error.message'
echo ""

echo "6. Export Data (should FAIL - 403) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"export_data","arguments":{"metricIds":["revenue_mrr"],"format":"csv"}}}' \
  | jq '.error.message'
echo ""

echo "7. Manage Users (should FAIL - 403) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"manage_users","arguments":{"action":"list"}}}' \
  | jq '.error.message'
echo ""

echo "8. Read Public Resource (should SUCCEED) ✓"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":8,"method":"resources/read","params":{"uri":"metrics://dashboards/all"}}' \
  | jq '.result.contents[0].text | fromjson | length'
echo " dashboards in resource"
echo ""

echo "9. Read Restricted Resource (should FAIL - 403) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"jsonrpc":"2.0","id":9,"method":"resources/read","params":{"uri":"metrics://data/sample"}}' \
  | jq '.error.message'
echo ""

echo "════════════════════════════════════════════════════════"
echo "Viewer Role Tests Complete"
echo "════════════════════════════════════════════════════════"
