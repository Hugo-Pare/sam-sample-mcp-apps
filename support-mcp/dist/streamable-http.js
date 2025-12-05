import express from 'express';
import { validateBasicAuth, checkToolPermission, checkResourcePermission, UnauthorizedError, ForbiddenError, } from './auth.js';
import { listTickets, getTicket, createTicket, updateTicket, assignTicket, closeTicket, searchKnowledgeBase, getCustomerInfo, getAllCustomers, getSupportStats, listAgents, getOpenTickets, getMyAssignedTickets, getAllKnowledgeBase, } from './support-data.js';
const app = express();
app.use(express.json());
async function handleToolsList() {
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
                        subject: { type: 'string', description: 'Ticket subject' },
                        description: { type: 'string', description: 'Detailed description' },
                        customerId: { type: 'string', description: 'Customer ID' },
                        customerEmail: { type: 'string', description: 'Customer email' },
                        priority: {
                            type: 'string',
                            enum: ['low', 'medium', 'high', 'urgent'],
                        },
                        category: {
                            type: 'string',
                            enum: ['technical', 'billing', 'general', 'feature_request', 'bug'],
                        },
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
                        ticketId: { type: 'string', description: 'Ticket ID' },
                        updates: {
                            type: 'object',
                            description: 'Fields to update',
                        },
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
                        ticketId: { type: 'string', description: 'Ticket ID' },
                        assignedTo: { type: 'string', description: 'Agent username' },
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
                        ticketId: { type: 'string', description: 'Ticket ID' },
                        resolution: { type: 'string', description: 'Resolution notes' },
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
                        query: { type: 'string', description: 'Search query' },
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
                        customerId: { type: 'string', description: 'Customer ID' },
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
                        period: { type: 'string', description: 'Time period (e.g., today, week, month)' },
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
                        action: {
                            type: 'string',
                            enum: ['list', 'add', 'remove'],
                        },
                        agentId: { type: 'string', description: 'Agent ID (for add/remove)' },
                    },
                    required: ['action'],
                },
            },
        ],
    };
}
async function handleToolCall(params, authContext) {
    const { name, arguments: args } = params;
    if (!args) {
        throw new Error('Missing arguments');
    }
    // Check permission
    checkToolPermission(name, authContext.role);
    switch (name) {
        case 'list_tickets': {
            const tickets = listTickets(args.status, args.assignedTo);
            return {
                content: [{ type: 'text', text: JSON.stringify(tickets, null, 2) }],
            };
        }
        case 'get_ticket': {
            const ticket = getTicket(args.ticketId);
            if (!ticket) {
                throw new Error(`Ticket not found: ${args.ticketId}`);
            }
            return {
                content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }],
            };
        }
        case 'create_ticket': {
            const ticket = createTicket(args.subject, args.description, args.customerId, args.customerEmail, args.priority, args.category);
            return {
                content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }],
            };
        }
        case 'update_ticket': {
            const ticket = updateTicket(args.ticketId, args.updates);
            return {
                content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }],
            };
        }
        case 'assign_ticket': {
            const ticket = assignTicket(args.ticketId, args.assignedTo);
            return {
                content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }],
            };
        }
        case 'close_ticket': {
            const ticket = closeTicket(args.ticketId, args.resolution);
            return {
                content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }],
            };
        }
        case 'search_knowledge_base': {
            const articles = searchKnowledgeBase(args.query);
            return {
                content: [{ type: 'text', text: JSON.stringify(articles, null, 2) }],
            };
        }
        case 'get_customer_info': {
            const customer = getCustomerInfo(args.customerId);
            if (!customer) {
                throw new Error(`Customer not found: ${args.customerId}`);
            }
            return {
                content: [{ type: 'text', text: JSON.stringify(customer, null, 2) }],
            };
        }
        case 'get_support_stats': {
            const stats = getSupportStats(args.period);
            return {
                content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
            };
        }
        case 'manage_agents': {
            const action = args.action;
            let result;
            if (action === 'list') {
                result = listAgents();
            }
            else if (action === 'add') {
                result = { success: true, message: `Agent ${args.agentId} added` };
            }
            else if (action === 'remove') {
                result = { success: true, message: `Agent ${args.agentId} removed` };
            }
            else {
                throw new Error(`Unknown action: ${action}`);
            }
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
async function handleResourcesList() {
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
}
async function handleResourceRead(params, authContext) {
    const { uri } = params;
    // Check permission
    checkResourcePermission(uri, authContext.role);
    if (uri === 'support://tickets/open') {
        const tickets = getOpenTickets();
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(tickets, null, 2),
                },
            ],
        };
    }
    if (uri === 'support://tickets/my-assigned') {
        const tickets = getMyAssignedTickets(authContext.username);
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(tickets, null, 2),
                },
            ],
        };
    }
    if (uri === 'support://knowledge-base/articles') {
        const articles = getAllKnowledgeBase();
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(articles, null, 2),
                },
            ],
        };
    }
    if (uri === 'support://customers/all') {
        const customers = getAllCustomers();
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(customers, null, 2),
                },
            ],
        };
    }
    if (uri === 'support://stats/performance') {
        const stats = getSupportStats('current');
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(stats, null, 2),
                },
            ],
        };
    }
    throw new Error(`Unknown resource: ${uri}`);
}
app.post('/mcp', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        console.error(`\n=== HTTP Request ===`);
        console.error(`Method: ${req.body.method}`);
        console.error(`Auth Header: ${authHeader ? 'Present' : 'Missing'}`);
        // Skip auth for initialize and notifications
        let authContext;
        if (req.body.method !== 'initialize' && !req.body.method?.startsWith('notifications/')) {
            try {
                authContext = validateBasicAuth(authHeader);
                console.error(`✓ Authenticated: ${authContext.username} (${authContext.role})`);
            }
            catch (error) {
                console.error(`❌ Authentication failed:`, error instanceof Error ? error.message : error);
                if (error instanceof UnauthorizedError) {
                    res.setHeader('WWW-Authenticate', 'Basic realm="SupportDesk MCP Server"');
                    return res.status(401).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32001,
                            message: error.message,
                        },
                        id: req.body.id,
                    });
                }
                throw error;
            }
        }
        const request = req.body;
        // Handle notifications
        if (request.method && request.method.startsWith('notifications/')) {
            console.error('Received notification:', request.method);
            res.status(200).end();
            return;
        }
        let result;
        try {
            switch (request.method) {
                case 'initialize':
                    result = {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: {},
                            resources: {},
                            prompts: {},
                        },
                        serverInfo: {
                            name: 'supportdesk-mcp-server-http',
                            version: '1.0.0',
                        },
                    };
                    break;
                case 'tools/list':
                    result = await handleToolsList();
                    break;
                case 'tools/call':
                    if (!authContext)
                        throw new UnauthorizedError('Authentication required');
                    result = await handleToolCall(request.params, authContext);
                    break;
                case 'resources/list':
                    result = await handleResourcesList();
                    break;
                case 'resources/read':
                    if (!authContext)
                        throw new UnauthorizedError('Authentication required');
                    result = await handleResourceRead(request.params, authContext);
                    break;
                case 'ping':
                    result = {};
                    break;
                default:
                    throw new Error(`Unknown method: ${request.method}`);
            }
            console.error(`✓ Request successful`);
            res.json({
                jsonrpc: '2.0',
                result: result,
                id: request.id,
            });
        }
        catch (error) {
            console.error(`❌ Error processing request:`, error instanceof Error ? error.message : error);
            if (error instanceof ForbiddenError) {
                return res.status(403).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32002,
                        message: error.message,
                    },
                    id: request.id,
                });
            }
            throw error;
        }
    }
    catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({
            jsonrpc: '2.0',
            error: {
                code: -32603,
                message: error instanceof Error ? error.message : String(error),
            },
            id: req.body.id,
        });
    }
});
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        server: 'supportdesk-mcp-server-http',
        authentication: 'Basic Auth (username:password)',
        version: '1.0.0',
    });
});
const HTTP_PORT = 5001;
app.listen(HTTP_PORT, () => {
    console.error(`\n╔════════════════════════════════════════════════════════╗`);
    console.error(`║   SupportDesk MCP Server (HTTP) - Basic Auth          ║`);
    console.error(`╚════════════════════════════════════════════════════════╝`);
    console.error(`Server listening on http://localhost:${HTTP_PORT}`);
    console.error(`HTTP endpoint: http://localhost:${HTTP_PORT}/mcp`);
    console.error(`Health check: http://localhost:${HTTP_PORT}/health`);
    console.error(``);
    console.error(`Authentication: Basic Auth`);
    console.error(`  Header: Authorization: Basic base64(username:password)`);
    console.error(``);
    console.error(`Demo Credentials:`);
    console.error(`  Agent:      agent1 / pass123       (basic support)`);
    console.error(`  Supervisor: supervisor1 / super123 (+ assignment, stats)`);
    console.error(`  Admin:      admin / admin123       (full access)`);
    console.error(``);
    console.error(`Example:`);
    console.error(`  curl -u agent1:pass123 http://localhost:${HTTP_PORT}/mcp`);
    console.error(``);
});
//# sourceMappingURL=streamable-http.js.map