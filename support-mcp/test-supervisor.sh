#!/bin/bash
# Test SupportDesk MCP Server - Supervisor Role
# Credentials: supervisor1 / super123

USER="supervisor1"
PASS="super123"
URL="http://localhost:5001/mcp"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   SupportDesk - Testing Supervisor Role               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "1. List Open Tickets (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tickets","arguments":{"status":"open"}}}' \
  | jq '.result.content[0].text | fromjson | length'
echo " open tickets"
echo ""

echo "2. Assign Ticket (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"assign_ticket","arguments":{"ticketId":"TKT-001","assignedTo":"agent1"}}}' \
  | jq '.result.content[0].text | fromjson | {id, assignedTo, status}'
echo ""

echo "3. Get Support Stats (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_support_stats","arguments":{"period":"month"}}}' \
  | jq '.result.content[0].text | fromjson | {totalTickets, averageResponseTime, customerSatisfaction}'
echo ""

echo "4. Read Performance Stats Resource (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"resources/read","params":{"uri":"support://stats/performance"}}' \
  | jq '.result.contents[0].text | fromjson | {period, totalTickets}'
echo ""

echo "5. Manage Agents (should FAIL - 403) ✗"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"manage_agents","arguments":{"action":"list"}}}' \
  | jq '.error.message'
echo ""

echo "════════════════════════════════════════════════════════"
echo "Supervisor Role Tests Complete"
echo "════════════════════════════════════════════════════════"
