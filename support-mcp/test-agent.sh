#!/bin/bash
# Test SupportDesk MCP Server - Agent Role
# Credentials: agent1 / pass123

USER="agent1"
PASS="pass123"
URL="http://localhost:5001/mcp"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   SupportDesk - Testing Agent Role (Basic Support)    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "1. List Tickets (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tickets","arguments":{}}}' \
  | jq '.result.content[0].text | fromjson | length'
echo " tickets found"
echo ""

echo "2. Get Specific Ticket (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_ticket","arguments":{"ticketId":"TKT-002"}}}' \
  | jq '.result.content[0].text | fromjson | {id, subject, status}'
echo ""

echo "3. Search Knowledge Base (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_knowledge_base","arguments":{"query":"password"}}}' \
  | jq '.result.content[0].text | fromjson | length'
echo " articles found"
echo ""

echo "4. Get Customer Info (should SUCCEED) ✓"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_customer_info","arguments":{"customerId":"cust_001"}}}' \
  | jq '.result.content[0].text | fromjson | {name, email, plan}'
echo ""

echo "5. Assign Ticket (should FAIL - 403) ✗"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"assign_ticket","arguments":{"ticketId":"TKT-001","assignedTo":"agent1"}}}' \
  | jq '.error.message'
echo ""

echo "6. Get Support Stats (should FAIL - 403) ✗"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"get_support_stats","arguments":{"period":"week"}}}' \
  | jq '.error.message'
echo ""

echo "7. Manage Agents (should FAIL - 403) ✗"
curl -s -u $USER:$PASS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"manage_agents","arguments":{"action":"list"}}}' \
  | jq '.error.message'
echo ""

echo "════════════════════════════════════════════════════════"
echo "Agent Role Tests Complete"
echo "════════════════════════════════════════════════════════"
