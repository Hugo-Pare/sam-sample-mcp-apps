#!/bin/bash
# Test SupportDesk MCP Server - Admin Role
# Credentials: admin / admin123

USER="admin"
PASS="admin123"
URL="http://localhost:5001/mcp"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   SupportDesk - Testing Admin Role (Full Access)      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "1. List All Tickets (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tickets","arguments":{}}}' \
  | jq '.result.content[0].text | fromjson | map({id, status, priority})'
echo ""

echo "2. Assign Ticket (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"assign_ticket","arguments":{"ticketId":"TKT-003","assignedTo":"supervisor1"}}}' \
  | jq '.result.content[0].text | fromjson | {id, assignedTo}'
echo ""

echo "3. Get Support Stats (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_support_stats","arguments":{"period":"month"}}}' \
  | jq '.result.content[0].text | fromjson | .topCategories'
echo ""

echo "4. Manage Agents - List (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"manage_agents","arguments":{"action":"list"}}}' \
  | jq '.result.content[0].text | fromjson | map({username, role, assignedTickets})'
echo ""

echo "5. Read All Resources (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":5,"method":"resources/read","params":{"uri":"support://customers/all"}}' \
  | jq '.result.contents[0].text | fromjson | length'
echo " customers"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Admin Role Tests Complete - Full Access Verified"
echo "════════════════════════════════════════════════════════"
