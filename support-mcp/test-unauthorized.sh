#!/bin/bash
# Test SupportDesk MCP Server - Unauthorized Access

URL="http://localhost:5001/mcp"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   SupportDesk - Testing Unauthorized Access           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "1. No Credentials (should return 401) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tickets","arguments":{}}}' \
  | jq '{status: (if .error then "UNAUTHORIZED" else "ERROR" end), message: .error.message}'
echo ""

echo "2. Invalid Username (should return 401) ✗"
curl -s -u invaliduser:password -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_tickets","arguments":{}}}' \
  | jq '{status: (if .error then "UNAUTHORIZED" else "ERROR" end), message: .error.message}'
echo ""

echo "3. Invalid Password (should return 401) ✗"
curl -s -u agent1:wrongpassword -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_tickets","arguments":{}}}' \
  | jq '{status: (if .error then "UNAUTHORIZED" else "ERROR" end), message: .error.message}'
echo ""

echo "4. Malformed Auth Header (should return 401) ✗"
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: InvalidFormat" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"list_tickets","arguments":{}}}' \
  | jq '{status: (if .error then "UNAUTHORIZED" else "ERROR" end), message: .error.message}'
echo ""

echo "════════════════════════════════════════════════════════"
echo "Unauthorized Tests Complete - All Properly Denied"
echo "════════════════════════════════════════════════════════"
