import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { validateApiKey, checkToolPermission, checkResourcePermission, UnauthorizedError, ForbiddenError, } from './auth.js';
import { getAllDashboards, getDashboardById, createDashboard, getMetric, executeQuery, getReportTemplates, generateReport, getSampleDataset, exportData, listUsers, createUser, revokeUser, getAvailableMetricIds, } from './metrics-data.js';
const app = express();
const sessions = new Map();
const server = new Server({
    name: 'metricshub-mcp-server',
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
                name: 'get_metrics',
                description: 'Retrieve specific metrics data by metric ID. Returns current value, trends, and comparisons. (viewer+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        metricId: {
                            type: 'string',
                            description: 'Metric ID (e.g., revenue_mrr, users_dau, perf_response_time)',
                        },
                        timeRange: {
                            type: 'string',
                            description: 'Optional time range (e.g., 7d, 30d, 12m)',
                        },
                    },
                    required: ['metricId'],
                },
            },
            {
                name: 'list_dashboards',
                description: 'List all available analytics dashboards with metadata. (viewer+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        category: {
                            type: 'string',
                            description: 'Optional category filter (finance, users, performance, executive)',
                        },
                    },
                },
            },
            {
                name: 'create_dashboard',
                description: 'Create a custom analytics dashboard. Requires analyst or admin role. (analyst+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Dashboard name',
                        },
                        widgets: {
                            type: 'array',
                            description: 'Array of widget configurations',
                        },
                    },
                    required: ['name', 'widgets'],
                },
            },
            {
                name: 'run_query',
                description: 'Execute analytics query on metrics data. Returns query results with data array. (viewer+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Query string (SQL-like syntax)',
                        },
                        parameters: {
                            type: 'object',
                            description: 'Optional query parameters',
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'get_report',
                description: 'Generate analytics report from template. Returns formatted report. (viewer+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        reportType: {
                            type: 'string',
                            description: 'Report template ID or name',
                        },
                        dateRange: {
                            type: 'object',
                            description: 'Date range with start and end dates',
                            properties: {
                                start: { type: 'string' },
                                end: { type: 'string' },
                            },
                        },
                    },
                    required: ['reportType', 'dateRange'],
                },
            },
            {
                name: 'export_data',
                description: 'Export metrics data in various formats (CSV, JSON, XLSX). Requires analyst or admin role. (analyst+)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        metricIds: {
                            type: 'array',
                            description: 'Array of metric IDs to export',
                            items: { type: 'string' },
                        },
                        format: {
                            type: 'string',
                            description: 'Export format',
                            enum: ['csv', 'json', 'xlsx'],
                        },
                    },
                    required: ['metricIds', 'format'],
                },
            },
            {
                name: 'manage_users',
                description: 'Manage API keys and user permissions. Admin only. (admin)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'Action to perform',
                            enum: ['list', 'create', 'revoke'],
                        },
                        userId: {
                            type: 'string',
                            description: 'User ID (required for create/revoke)',
                        },
                        role: {
                            type: 'string',
                            description: 'Role for new user (required for create)',
                            enum: ['viewer', 'analyst', 'admin'],
                        },
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
        // Get auth context from current session
        // This is a workaround since MCP handlers don't have direct access to Express req
        const authContext = getCurrentAuthContext();
        if (!authContext) {
            throw new UnauthorizedError('Authentication required');
        }
        // Check permission for this tool
        checkToolPermission(name, authContext.role);
        switch (name) {
            case 'get_metrics': {
                const metric = getMetric(args.metricId, args.timeRange);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(metric, null, 2),
                        },
                    ],
                };
            }
            case 'list_dashboards': {
                const dashboards = getAllDashboards(args.category);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(dashboards, null, 2),
                        },
                    ],
                };
            }
            case 'create_dashboard': {
                const dashboard = createDashboard(args.name, args.widgets, authContext.name);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(dashboard, null, 2),
                        },
                    ],
                };
            }
            case 'run_query': {
                const result = executeQuery(args.query, args.parameters);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'get_report': {
                const report = generateReport(args.reportType, args.dateRange);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(report, null, 2),
                        },
                    ],
                };
            }
            case 'export_data': {
                const exportResult = exportData(args.metricIds, args.format);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(exportResult, null, 2),
                        },
                    ],
                };
            }
            case 'manage_users': {
                const action = args.action;
                let result;
                if (action === 'list') {
                    result = listUsers();
                }
                else if (action === 'create') {
                    result = createUser(args.userId, args.role);
                }
                else if (action === 'revoke') {
                    result = revokeUser(args.userId);
                }
                else {
                    throw new Error(`Unknown action: ${action}`);
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'metrics://dashboards/all',
                name: 'All Dashboards',
                description: 'Complete list of available analytics dashboards with metadata (viewer+)',
                mimeType: 'application/json',
            },
            {
                uri: 'metrics://templates/reports',
                name: 'Report Templates',
                description: 'Pre-configured report templates for common analytics scenarios (viewer+)',
                mimeType: 'application/json',
            },
            {
                uri: 'metrics://data/sample',
                name: 'Sample Dataset',
                description: 'Sample analytics dataset for testing queries and dashboards (analyst+)',
                mimeType: 'application/json',
            },
        ],
    };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    // Get auth context
    const authContext = getCurrentAuthContext();
    if (!authContext) {
        throw new UnauthorizedError('Authentication required');
    }
    // Check permission for this resource
    checkResourcePermission(uri, authContext.role);
    if (uri === 'metrics://dashboards/all') {
        const dashboards = getAllDashboards();
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(dashboards, null, 2),
                },
            ],
        };
    }
    if (uri === 'metrics://templates/reports') {
        const templates = getReportTemplates();
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(templates, null, 2),
                },
            ],
        };
    }
    if (uri === 'metrics://data/sample') {
        const dataset = getSampleDataset();
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(dataset, null, 2),
                },
            ],
        };
    }
    throw new Error(`Unknown resource: ${uri}`);
});
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: 'analyze_trends',
                description: 'Analyze metric trends and identify patterns (all roles)',
                arguments: [
                    {
                        name: 'metricIds',
                        description: 'Comma-separated list of metric IDs to analyze',
                        required: true,
                    },
                    {
                        name: 'timeRange',
                        description: 'Time range for analysis (e.g., 30d, 12m)',
                        required: true,
                    },
                ],
            },
            {
                name: 'create_report_brief',
                description: 'Generate executive summary report from dashboard data (all roles)',
                arguments: [
                    {
                        name: 'dashboardId',
                        description: 'Dashboard ID to create report from',
                        required: true,
                    },
                    {
                        name: 'period',
                        description: 'Reporting period (e.g., monthly, quarterly)',
                        required: true,
                    },
                ],
            },
            {
                name: 'optimization_recommendations',
                description: 'Get system optimization recommendations based on metrics (analyst+)',
                arguments: [
                    {
                        name: 'category',
                        description: 'Category to optimize (performance, costs, engagement)',
                        required: true,
                    },
                ],
            },
        ],
    };
});
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    // Get auth context
    const authContext = getCurrentAuthContext();
    if (!authContext) {
        throw new UnauthorizedError('Authentication required');
    }
    // Check permission for optimization_recommendations prompt (analyst+)
    if (name === 'optimization_recommendations') {
        if (authContext.role === 'viewer') {
            throw new ForbiddenError('Optimization recommendations require analyst or admin role');
        }
    }
    switch (name) {
        case 'analyze_trends': {
            const metricIds = args?.metricIds?.split(',').map((id) => id.trim()) || [];
            const timeRange = args?.timeRange;
            const metrics = metricIds.map((id) => getMetric(id, timeRange));
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Analyze the following metric trends over ${timeRange}:\n\n${JSON.stringify(metrics, null, 2)}\n\nProvide insights on:\n1. Overall trend direction and significance\n2. Notable changes or anomalies\n3. Correlations between metrics\n4. Recommendations for stakeholders`,
                        },
                    },
                ],
            };
        }
        case 'create_report_brief': {
            const dashboardId = args?.dashboardId;
            const period = args?.period;
            const dashboard = getDashboardById(dashboardId);
            if (!dashboard) {
                throw new Error(`Dashboard not found: ${dashboardId}`);
            }
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Create an executive summary report for the "${dashboard.name}" dashboard covering the ${period} period:\n\n${JSON.stringify(dashboard, null, 2)}\n\nThe report should include:\n1. Key highlights and achievements\n2. Notable trends or changes\n3. Areas of concern\n4. Strategic recommendations`,
                        },
                    },
                ],
            };
        }
        case 'optimization_recommendations': {
            const category = args?.category;
            const relevantMetrics = getAvailableMetricIds()
                .filter((id) => id.includes(category))
                .map((id) => getMetric(id));
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Based on these ${category} metrics:\n\n${JSON.stringify(relevantMetrics, null, 2)}\n\nProvide optimization recommendations:\n1. Current performance assessment\n2. Identified bottlenecks or inefficiencies\n3. Specific optimization strategies\n4. Expected impact and priority\n5. Implementation considerations`,
                        },
                    },
                ],
            };
        }
        default:
            throw new Error(`Unknown prompt: ${name}`);
    }
});
// Helper to get current auth context (will be set during request processing)
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
        console.error('MetricsHub MCP Server running on stdio');
        console.error('Note: Stdio transport does not support authentication in this demo');
        await server.connect(transport);
    }
    else {
        const SSE_PORT = 4000;
        app.get('/sse', async (req, res) => {
            try {
                const apiKey = req.query.apiKey;
                console.error(`\n=== SSE Connection Attempt ===`);
                console.error(`From: ${req.ip}`);
                console.error(`API Key provided: ${apiKey ? 'Yes' : 'No'}`);
                // Validate API key
                const authContext = validateApiKey(apiKey);
                console.error(`✓ Authenticated: ${authContext.name} (${authContext.role})`);
                // Create SSE transport
                const transport = new SSEServerTransport('/message', res);
                const sessionId = transport._sessionId;
                console.error(`Session ID: ${sessionId}`);
                // Store authenticated session
                sessions.set(sessionId, {
                    transport,
                    authContext,
                });
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
                console.error(`❌ No session found for sessionId: ${sessionId}`);
                console.error(`Available sessions: ${Array.from(sessions.keys()).join(', ')}`);
                res.status(401).json({ error: 'Invalid or expired session' });
                return;
            }
            console.error(`✓ Session found: ${session.authContext.name} (${session.authContext.role})`);
            // Set current auth context for handlers to access
            setCurrentAuthContext(session.authContext);
            try {
                await session.transport.handlePostMessage(req, res);
                console.error(`✓ Message handled`);
            }
            catch (error) {
                console.error(`❌ Error handling message:`, error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
            finally {
                // Clear auth context after request
                setCurrentAuthContext(null);
            }
        });
        app.listen(SSE_PORT, () => {
            console.error(`\n╔════════════════════════════════════════════════════════╗`);
            console.error(`║   MetricsHub MCP Server (SSE) - API Key Auth          ║`);
            console.error(`╚════════════════════════════════════════════════════════╝`);
            console.error(`Server listening on http://localhost:${SSE_PORT}`);
            console.error(`SSE endpoint: http://localhost:${SSE_PORT}/sse?apiKey=YOUR_KEY`);
            console.error(``);
            console.error(`Demo API Keys:`);
            console.error(`  Viewer:  mh_viewer_demo123  (read-only)`);
            console.error(`  Analyst: mh_analyst_demo456 (read+write)`);
            console.error(`  Admin:   mh_admin_demo789   (full access)`);
            console.error(``);
        });
    }
}
runServer().catch((error) => {
    console.error('Fatal error running server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map