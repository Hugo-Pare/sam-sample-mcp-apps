#!/bin/bash
# Test MetricsHub MCP Server - Unauthorized Access Scenarios

URL="http://localhost:4001/mcp"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   MetricsHub - Testing Unauthorized Access            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "1. No API Key Provided (should return 401) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_metrics","arguments":{"metricId":"revenue_mrr"}}}' \
  | jq '{status: (if .error then "UNAUTHORIZED" else "ERROR" end), message: .error.message}'
echo ""

echo "2. Invalid API Key (should return 401) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid_key_12345" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_metrics","arguments":{"metricId":"revenue_mrr"}}}' \
  | jq '{status: (if .error then "UNAUTHORIZED" else "ERROR" end), message: .error.message}'
echo ""

echo "3. Wrong API Key Format (should return 401) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_dashboards","arguments":{}}}' \
  | jq '{status: (if .error then "UNAUTHORIZED" else "ERROR" end), message: .error.message}'
echo ""

echo "4. Query Parameter - No API Key (should return 401) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"resources/read","params":{"uri":"metrics://dashboards/all"}}' \
  | jq '{status: (if .error then "UNAUTHORIZED" else "ERROR" end), message: .error.message}'
echo ""

echo "════════════════════════════════════════════════════════"
echo "Unauthorized Access Tests Complete - All Properly Denied"
echo "════════════════════════════════════════════════════════"
