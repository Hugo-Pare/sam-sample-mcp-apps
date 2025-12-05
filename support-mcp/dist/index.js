import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { validateBasicAuth, checkToolPermission, checkResourcePermission, UnauthorizedError, ForbiddenError, } from './auth.js';
import { listTickets, getTicket, createTicket, updateTicket, assignTicket, closeTicket, searchKnowledgeBase, getCustomerInfo, getAllCustomers, getSupportStats, listAgents, getOpenTickets, getMyAssignedTickets, getAllKnowledgeBase, } from './support-data.js';
const app = express();
const sessions = new Map();
const server = new Server({
    name: 'supportdesk-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
        resources: {},
        prompts: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'list_tickets',
                description: 'List support tickets with optional filters. (agent+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            description: 'Filter by status',
                            enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'],
                        },
                        assignedTo: {
                            type: 'string',
                            description: 'Filter by assigned agent username',
                        },
                    },
                },
            },
            {
                name: 'get_ticket',
                description: 'Get detailed information about a specific ticket. (agent+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        ticketId: {
                            type: 'string',
                            description: 'Ticket ID (e.g., TKT-001)',
                        },
                    },
                    required: ['ticketId'],
                },
            },
            {
                name: 'create_ticket',
                description: 'Create a new support ticket. (agent+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        subject: { type: 'string' },
                        description: { type: 'string' },
                        customerId: { type: 'string' },
                        customerEmail: { type: 'string' },
                        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                        category: { type: 'string', enum: ['technical', 'billing', 'general', 'feature_request', 'bug'] },
                    },
                    required: ['subject', 'description', 'customerId', 'customerEmail', 'priority', 'category'],
                },
            },
            {
                name: 'update_ticket',
                description: 'Update ticket details. (agent+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        ticketId: { type: 'string' },
                        updates: { type: 'object' },
                    },
                    required: ['ticketId', 'updates'],
                },
            },
            {
                name: 'assign_ticket',
                description: 'Assign ticket to an agent. (supervisor+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        ticketId: { type: 'string' },
                        assignedTo: { type: 'string' },
                    },
                    required: ['ticketId', 'assignedTo'],
                },
            },
            {
                name: 'close_ticket',
                description: 'Close a resolved ticket. (agent+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        ticketId: { type: 'string' },
                        resolution: { type: 'string' },
                    },
                    required: ['ticketId'],
                },
            },
            {
                name: 'search_knowledge_base',
                description: 'Search knowledge base articles. (agent+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'get_customer_info',
                description: 'Get customer information and history. (agent+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        customerId: { type: 'string' },
                    },
                    required: ['customerId'],
                },
            },
            {
                name: 'get_support_stats',
                description: 'Get support performance statistics. (supervisor+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        period: { type: 'string' },
                    },
                    required: ['period'],
                },
            },
            {
                name: 'manage_agents',
                description: 'Manage support agents and assignments. (admin)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: { type: 'string', enum: ['list', 'add', 'remove'] },
                        agentId: { type: 'string' },
                    },
                    required: ['action'],
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        if (!args) {
            throw new Error('Missing arguments');
        }
        const authContext = getCurrentAuthContext();
        if (!authContext) {
            throw new UnauthorizedError('Authentication required');
        }
        checkToolPermission(name, authContext.role);
        switch (name) {
            case 'list_tickets': {
                const tickets = listTickets(args.status, args.assignedTo);
                return { content: [{ type: 'text', text: JSON.stringify(tickets, null, 2) }] };
            }
            case 'get_ticket': {
                const ticket = getTicket(args.ticketId);
                if (!ticket)
                    throw new Error(`Ticket not found: ${args.ticketId}`);
                return { content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }] };
            }
            case 'create_ticket': {
                const ticket = createTicket(args.subject, args.description, args.customerId, args.customerEmail, args.priority, args.category);
                return { content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }] };
            }
            case 'update_ticket': {
                const ticket = updateTicket(args.ticketId, args.updates);
                return { content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }] };
            }
            case 'assign_ticket': {
                const ticket = assignTicket(args.ticketId, args.assignedTo);
                return { content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }] };
            }
            case 'close_ticket': {
                const ticket = closeTicket(args.ticketId, args.resolution);
                return { content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }] };
            }
            case 'search_knowledge_base': {
                const articles = searchKnowledgeBase(args.query);
                return { content: [{ type: 'text', text: JSON.stringify(articles, null, 2) }] };
            }
            case 'get_customer_info': {
                const customer = getCustomerInfo(args.customerId);
                if (!customer)
                    throw new Error(`Customer not found: ${args.customerId}`);
                return { content: [{ type: 'text', text: JSON.stringify(customer, null, 2) }] };
            }
            case 'get_support_stats': {
                const stats = getSupportStats(args.period);
                return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
            }
            case 'manage_agents': {
                const action = args.action;
                let result;
                if (action === 'list')
                    result = listAgents();
                else if (action === 'add')
                    result = { success: true, message: `Agent ${args.agentId} added` };
                else if (action === 'remove')
                    result = { success: true, message: `Agent ${args.agentId} removed` };
                else
                    throw new Error(`Unknown action: ${action}`);
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: 'text', text: `Error: ${errorMessage}` }],
            isError: true,
        };
    }
});
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'support://tickets/open',
                name: 'Open Tickets',
                description: 'All currently open support tickets (agent+)',
                mimeType: 'application/json',
            },
            {
                uri: 'support://tickets/my-assigned',
                name: 'My Assigned Tickets',
                description: 'Tickets assigned to the current user (agent+)',
                mimeType: 'application/json',
            },
            {
                uri: 'support://knowledge-base/articles',
                name: 'Knowledge Base Articles',
                description: 'All knowledge base articles (agent+)',
                mimeType: 'application/json',
            },
            {
                uri: 'support://customers/all',
                name: 'All Customers',
                description: 'Complete customer list (supervisor+)',
                mimeType: 'application/json',
            },
            {
                uri: 'support://stats/performance',
                name: 'Support Performance Stats',
                description: 'Team performance metrics (supervisor+)',
                mimeType: 'application/json',
            },
        ],
    };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const authContext = getCurrentAuthContext();
    if (!authContext) {
        throw new UnauthorizedError('Authentication required');
    }
    checkResourcePermission(uri, authContext.role);
    if (uri === 'support://tickets/open') {
        const tickets = getOpenTickets();
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(tickets, null, 2) }] };
    }
    if (uri === 'support://tickets/my-assigned') {
        const tickets = getMyAssignedTickets(authContext.username);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(tickets, null, 2) }] };
    }
    if (uri === 'support://knowledge-base/articles') {
        const articles = getAllKnowledgeBase();
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(articles, null, 2) }] };
    }
    if (uri === 'support://customers/all') {
        const customers = getAllCustomers();
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(customers, null, 2) }] };
    }
    if (uri === 'support://stats/performance') {
        const stats = getSupportStats('current');
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(stats, null, 2) }] };
    }
    throw new Error(`Unknown resource: ${uri}`);
});
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: 'suggest_response',
                description: 'Suggest a response to a customer ticket (agent+)',
                arguments: [
                    { name: 'ticketId', description: 'Ticket ID', required: true },
                ],
            },
            {
                name: 'escalation_report',
                description: 'Create ticket escalation report (supervisor+)',
                arguments: [
                    { name: 'ticketId', description: 'Ticket ID', required: true },
                ],
            },
            {
                name: 'performance_analysis',
                description: 'Analyze team performance (supervisor+)',
                arguments: [
                    { name: 'period', description: 'Time period', required: true },
                ],
            },
        ],
    };
});
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const authContext = getCurrentAuthContext();
    if (!authContext) {
        throw new UnauthorizedError('Authentication required');
    }
    // Check permissions for supervisor+ prompts
    if ((name === 'escalation_report' || name === 'performance_analysis') && authContext.role === 'agent') {
        throw new ForbiddenError(`Prompt '${name}' requires supervisor or admin role`);
    }
    switch (name) {
        case 'suggest_response': {
            const ticketId = args?.ticketId;
            const ticket = getTicket(ticketId);
            if (!ticket)
                throw new Error(`Ticket not found: ${ticketId}`);
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Suggest a professional response to this support ticket:\n\n${JSON.stringify(ticket, null, 2)}\n\nProvide a helpful, empathetic response that addresses the customer's concerns.`,
                        },
                    },
                ],
            };
        }
        case 'escalation_report': {
            const ticketId = args?.ticketId;
            const ticket = getTicket(ticketId);
            if (!ticket)
                throw new Error(`Ticket not found: ${ticketId}`);
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Create an escalation report for this ticket:\n\n${JSON.stringify(ticket, null, 2)}\n\nInclude: reason for escalation, impact assessment, recommended actions, and priority justification.`,
                        },
                    },
                ],
            };
        }
        case 'performance_analysis': {
            const period = args?.period;
            const stats = getSupportStats(period);
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Analyze the support team performance for ${period}:\n\n${JSON.stringify(stats, null, 2)}\n\nProvide insights on: team efficiency, areas for improvement, resource allocation, and strategic recommendations.`,
                        },
                    },
                ],
            };
        }
        default:
            throw new Error(`Unknown prompt: ${name}`);
    }
});
// Helper for current auth context
let currentAuthContext = null;
function getCurrentAuthContext() {
    return currentAuthContext;
}
function setCurrentAuthContext(context) {
    currentAuthContext = context;
}
async function runServer() {
    const transport = process.argv.includes('--stdio') ? new StdioServerTransport() : null;
    if (transport) {
        console.error('SupportDesk MCP Server running on stdio');
        console.error('Note: Stdio transport does not support authentication in this demo');
        await server.connect(transport);
    }
    else {
        const SSE_PORT = 5000;
        app.get('/sse', async (req, res) => {
            try {
                // For SSE, Basic Auth credentials are sent in the Authorization header of the GET request
                const authHeader = req.headers.authorization;
                console.error(`\n=== SSE Connection Attempt ===`);
                console.error(`From: ${req.ip}`);
                console.error(`Auth Header: ${authHeader ? 'Present' : 'Missing'}`);
                // Validate credentials
                const authContext = validateBasicAuth(authHeader);
                console.error(`✓ Authenticated: ${authContext.username} (${authContext.role})`);
                // Create SSE transport
                const transport = new SSEServerTransport('/message', res);
                const sessionId = transport._sessionId;
                console.error(`Session ID: ${sessionId}`);
                // Store authenticated session
                sessions.set(sessionId, { transport, authContext });
                // Connect to MCP server
                await server.connect(transport);
                req.on('close', () => {
                    console.error(`SSE connection closed for session: ${sessionId}`);
                    sessions.delete(sessionId);
                });
            }
            catch (error) {
                console.error(`❌ Authentication failed:`, error instanceof Error ? error.message : error);
                if (error instanceof UnauthorizedError) {
                    res.setHeader('WWW-Authenticate', 'Basic realm="SupportDesk MCP Server"');
                    res.status(401).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        });
        app.post('/message', async (req, res) => {
            const sessionId = req.query.sessionId;
            console.error(`\n=== POST /message ===`);
            console.error(`SessionId: ${sessionId}`);
            const session = sessions.get(sessionId);
            if (!session) {
                console.error(`❌ No session found`);
                res.status(401).json({ error: 'Invalid or expired session' });
                return;
            }
            console.error(`✓ Session: ${session.authContext.username} (${session.authContext.role})`);
            setCurrentAuthContext(session.authContext);
            try {
                await session.transport.handlePostMessage(req, res);
                console.error(`✓ Message handled`);
            }
            catch (error) {
                console.error(`❌ Error:`, error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
            finally {
                setCurrentAuthContext(null);
            }
        });
        app.listen(SSE_PORT, () => {
            console.error(`\n╔════════════════════════════════════════════════════════╗`);
            console.error(`║   SupportDesk MCP Server (SSE) - Basic Auth           ║`);
            console.error(`╚════════════════════════════════════════════════════════╝`);
            console.error(`Server listening on http://localhost:${SSE_PORT}`);
            console.error(`SSE endpoint: http://localhost:${SSE_PORT}/sse`);
            console.error(``);
            console.error(`Authentication: Basic Auth in Authorization header`);
            console.error(``);
            console.error(`Demo Credentials:`);
            console.error(`  Agent:      agent1 / pass123       (basic support)`);
            console.error(`  Supervisor: supervisor1 / super123 (+ assignment, stats)`);
            console.error(`  Admin:      admin / admin123       (full access)`);
            console.error(``);
            console.error(`Example SSE Connection:`);
            console.error(`  curl -H "Authorization: Basic $(echo -n 'agent1:pass123' | base64)" \\`);
            console.error(`       http://localhost:${SSE_PORT}/sse`);
            console.error(``);
        });
    }
}
runServer().catch((error) => {
    console.error('Fatal error running server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map