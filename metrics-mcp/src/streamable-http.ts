import express from 'express';
import {
  validateApiKey,
  checkToolPermission,
  checkResourcePermission,
  UnauthorizedError,
  ForbiddenError,
  extractApiKey,
  TOOL_PERMISSIONS,
  RESOURCE_PERMISSIONS,
} from './auth.js';
import { AuthContext } from './types.js';
import {
  getAllDashboards,
  getDashboardById,
  createDashboard,
  getMetric,
  executeQuery,
  getReportTemplates,
  generateReport,
  getSampleDataset,
  exportData,
  listUsers,
  createUser,
  revokeUser,
} from './metrics-data.js';

const app = express();
app.use(express.json());

async function handleToolsList(authContext: AuthContext) {
  // Define all available tools
  const allTools = [
    {
      name: 'get_metrics',
      description:
        'Retrieve specific metrics data by metric ID. Returns current value, trends, and comparisons. (viewer+)',
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
      description:
        'Execute analytics query on metrics data. Returns query results with data array. (viewer+)',
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
          required: ['reportType', 'dateRange'],
        },
      },
    },
    {
      name: 'export_data',
      description:
        'Export metrics data in various formats (CSV, JSON, XLSX). Requires analyst or admin role. (analyst+)',
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
  ];

  // Filter tools based on user's role permissions
  const filteredTools = allTools.filter((tool) => {
    const allowedRoles = TOOL_PERMISSIONS.get(tool.name);
    if (!allowedRoles) {
      return false;
    }
    return allowedRoles.includes(authContext.role);
  });

  return {
    tools: filteredTools,
  };
}

async function handleToolCall(params: any, authContext: AuthContext) {
  const { name, arguments: args } = params;

  if (!args) {
    throw new Error('Missing arguments');
  }

  // Check permission for this tool
  checkToolPermission(name, authContext.role);

  switch (name) {
    case 'get_metrics': {
      const metric = getMetric(args.metricId as string, args.timeRange as string);
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
      const dashboards = getAllDashboards(args.category as string);
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
      const dashboard = createDashboard(
        args.name as string,
        args.widgets as any[],
        authContext.name
      );
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
      const result = executeQuery(args.query as string, args.parameters as Record<string, any>);
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
      const report = generateReport(args.reportType as string, args.dateRange as any);
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
      const exportResult = exportData(args.metricIds as string[], args.format as any);
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
      const action = args.action as string;
      let result: any;

      if (action === 'list') {
        result = listUsers();
      } else if (action === 'create') {
        result = createUser(args.userId as string, args.role as string);
      } else if (action === 'revoke') {
        result = revokeUser(args.userId as string);
      } else {
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

async function handleResourcesList(authContext: AuthContext) {
  // Define all available resources
  const allResources = [
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
  ];

  // Filter resources based on user's role permissions
  const filteredResources = allResources.filter((resource) => {
    const allowedRoles = RESOURCE_PERMISSIONS.get(resource.uri);
    if (!allowedRoles) {
      return false;
    }
    return allowedRoles.includes(authContext.role);
  });

  return {
    resources: filteredResources,
  };
}

async function handleResourceRead(params: any, authContext: AuthContext) {
  const { uri } = params;

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
}

app.post('/mcp', async (req, res) => {
  try {
    // Extract API key from header or query parameter
    const apiKey = extractApiKey(req.headers, req.query as any);

    console.error(`\n=== HTTP Request ===`);
    console.error(`Method: ${req.body.method}`);
    console.error(`API Key provided: ${apiKey ? 'Yes' : 'No'}`);

    // Skip auth for initialize method
    let authContext: AuthContext | undefined;

    if (req.body.method !== 'initialize' && !req.body.method?.startsWith('notifications/')) {
      try {
        authContext = validateApiKey(apiKey);
        console.error(`✓ Authenticated: ${authContext.name} (${authContext.role})`);
      } catch (error) {
        console.error(`❌ Authentication failed:`, error instanceof Error ? error.message : error);

        if (error instanceof UnauthorizedError) {
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

    // Handle notifications (no response needed)
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
              name: 'metricshub-mcp-server-http',
              version: '1.0.0',
            },
          };
          break;

        case 'tools/list':
          if (!authContext) throw new UnauthorizedError('Authentication required');
          result = await handleToolsList(authContext);
          break;

        case 'tools/call':
          if (!authContext) throw new UnauthorizedError('Authentication required');
          result = await handleToolCall(request.params, authContext);
          break;

        case 'resources/list':
          if (!authContext) throw new UnauthorizedError('Authentication required');
          result = await handleResourcesList(authContext);
          break;

        case 'resources/read':
          if (!authContext) throw new UnauthorizedError('Authentication required');
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
    } catch (error) {
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
  } catch (error) {
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
    server: 'metricshub-mcp-server-http',
    authentication: 'API Key (header or query parameter)',
    version: '1.0.0',
  });
});

const HTTP_PORT = 4001;

app.listen(HTTP_PORT, () => {
  console.error(`\n╔════════════════════════════════════════════════════════╗`);
  console.error(`║   MetricsHub MCP Server (HTTP) - API Key Auth         ║`);
  console.error(`╚════════════════════════════════════════════════════════╝`);
  console.error(`Server listening on http://localhost:${HTTP_PORT}`);
  console.error(`HTTP endpoint: http://localhost:${HTTP_PORT}/mcp`);
  console.error(`Health check: http://localhost:${HTTP_PORT}/health`);
  console.error(``);
  console.error(`Authentication Methods:`);
  console.error(`  1. Header: X-API-Key: YOUR_KEY`);
  console.error(`  2. Query: http://localhost:${HTTP_PORT}/mcp?apiKey=YOUR_KEY`);
  console.error(``);
  console.error(`Demo API Keys:`);
  console.error(`  Viewer:  mh_viewer_demo123  (read-only)`);
  console.error(`  Analyst: mh_analyst_demo456 (read+write)`);
  console.error(`  Admin:   mh_admin_demo789   (full access)`);
  console.error(``);
});
