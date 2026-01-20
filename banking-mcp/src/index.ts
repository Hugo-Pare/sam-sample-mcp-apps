import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import {
  validateAccessToken,
  extractBearerToken,
  checkToolPermission,
  checkResourcePermission,
  UnauthorizedError,
  ForbiddenError,
  OAuthError,
  TOOL_PERMISSIONS,
  RESOURCE_PERMISSIONS,
} from './auth.js';
import { AuthContext } from './types.js';
import {
  getAccountsByUserId,
  getAccountBalance,
  getTransactions,
  getAllTransactionsForUser,
  getCustomerProfile,
  updateCustomerProfile,
  initiatePayment,
} from './banking-data.js';

const app = express();
// CRITICAL: Do NOT use express.json() - SSE transport needs raw body

interface AuthenticatedSession {
  transport: SSEServerTransport;
  authContext: AuthContext;
}

const sessions = new Map<string, AuthenticatedSession>();

const server = new Server(
  {
    name: 'banking-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Helper for current auth context
let currentAuthContext: AuthContext | null = null;

function getCurrentAuthContext(): AuthContext | null {
  return currentAuthContext;
}

function setCurrentAuthContext(context: AuthContext | null): void {
  currentAuthContext = context;
}

// ===== List Tools Handler =====
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const authContext = getCurrentAuthContext();

  if (!authContext) {
    throw new UnauthorizedError('Authentication required');
  }

  // Define all available tools
  const allTools = [
    {
      name: 'get_accounts',
      description: 'Get list of bank accounts for the authenticated user (requires accounts:read)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_account_balance',
      description: 'Get balance for a specific account (requires accounts:read)',
      inputSchema: {
        type: 'object',
        properties: {
          accountId: {
            type: 'string',
            description: 'Account ID',
          },
        },
        required: ['accountId'],
      },
    },
    {
      name: 'get_transactions',
      description: 'Get transaction history for an account (requires transactions:read)',
      inputSchema: {
        type: 'object',
        properties: {
          accountId: {
            type: 'string',
            description: 'Account ID',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of transactions to return (default: 50)',
          },
        },
        required: ['accountId'],
      },
    },
    {
      name: 'get_customer_profile',
      description: 'Get customer profile information (requires profile:read)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'update_customer_profile',
      description: 'Update customer profile information (requires profile:read)',
      inputSchema: {
        type: 'object',
        properties: {
          phone: {
            type: 'string',
            description: 'Phone number',
          },
          preferredLanguage: {
            type: 'string',
            description: 'Preferred language',
          },
          notifications: {
            type: 'object',
            description: 'Notification preferences',
            properties: {
              email: { type: 'boolean' },
              sms: { type: 'boolean' },
              push: { type: 'boolean' },
            },
          },
        },
      },
    },
    {
      name: 'initiate_payment',
      description: 'Initiate a payment to another account (requires payments:write)',
      inputSchema: {
        type: 'object',
        properties: {
          fromAccountId: {
            type: 'string',
            description: 'Source account ID',
          },
          toAccountNumber: {
            type: 'string',
            description: 'Destination account number',
          },
          amount: {
            type: 'number',
            description: 'Payment amount',
          },
          description: {
            type: 'string',
            description: 'Payment description',
          },
        },
        required: ['fromAccountId', 'toAccountNumber', 'amount'],
      },
    },
  ];

  // Filter tools based on user's scopes
  const filteredTools = allTools.filter((tool) => {
    const requiredScopes = TOOL_PERMISSIONS.get(tool.name);
    if (!requiredScopes) {
      return false;
    }
    // User needs at least one of the required scopes
    return requiredScopes.some((scope) => authContext.scopes.includes(scope));
  });

  return {
    tools: filteredTools,
  };
});

// ===== Call Tool Handler =====
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    const authContext = getCurrentAuthContext();

    if (!authContext) {
      throw new UnauthorizedError('Authentication required');
    }

    // Check permission for this tool
    checkToolPermission(name, authContext.scopes);

    const userId = authContext.userId;

    switch (name) {
      case 'get_accounts': {
        const accounts = getAccountsByUserId(userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(accounts, null, 2),
            },
          ],
        };
      }

      case 'get_account_balance': {
        const accountId = (args as any).accountId;
        const account = getAccountBalance(accountId, userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(account, null, 2),
            },
          ],
        };
      }

      case 'get_transactions': {
        const accountId = (args as any).accountId;
        const limit = (args as any).limit || 50;
        const transactions = getTransactions(accountId, userId, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(transactions, null, 2),
            },
          ],
        };
      }

      case 'get_customer_profile': {
        const profile = getCustomerProfile(userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(profile, null, 2),
            },
          ],
        };
      }

      case 'update_customer_profile': {
        const updates = args as any;
        const updatedProfile = updateCustomerProfile(userId, updates);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(updatedProfile, null, 2),
            },
          ],
        };
      }

      case 'initiate_payment': {
        const { fromAccountId, toAccountNumber, amount, description } = args as any;
        const payment = initiatePayment(userId, fromAccountId, toAccountNumber, amount, description || '');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(payment, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
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

// ===== List Resources Handler =====
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const authContext = getCurrentAuthContext();

  if (!authContext) {
    throw new UnauthorizedError('Authentication required');
  }

  const allResources = [
    {
      uri: 'banking://accounts/all',
      name: 'All Bank Accounts',
      description: 'List of all user bank accounts',
      mimeType: 'application/json',
    },
    {
      uri: 'banking://transactions/recent',
      name: 'Recent Transactions',
      description: 'Recent transactions across all accounts',
      mimeType: 'application/json',
    },
    {
      uri: 'banking://profile',
      name: 'Customer Profile',
      description: 'Customer profile information',
      mimeType: 'application/json',
    },
  ];

  // Filter resources based on user's scopes
  const filteredResources = allResources.filter((resource) => {
    const requiredScopes = RESOURCE_PERMISSIONS.get(resource.uri);
    if (!requiredScopes) {
      return false;
    }
    return requiredScopes.some((scope) => authContext.scopes.includes(scope));
  });

  return {
    resources: filteredResources,
  };
});

// ===== Read Resource Handler =====
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  const authContext = getCurrentAuthContext();

  if (!authContext) {
    throw new UnauthorizedError('Authentication required');
  }

  // Check permission for this resource
  checkResourcePermission(uri, authContext.scopes);

  const userId = authContext.userId;

  if (uri === 'banking://accounts/all') {
    const accounts = getAccountsByUserId(userId);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(accounts, null, 2),
        },
      ],
    };
  }

  if (uri === 'banking://transactions/recent') {
    const transactions = getAllTransactionsForUser(userId, 20);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(transactions, null, 2),
        },
      ],
    };
  }

  if (uri === 'banking://profile') {
    const profile = getCustomerProfile(userId);
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(profile, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// ===== List Prompts Handler =====
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'financial_summary',
        description: 'Generate a financial summary with account balances and recent activity',
        arguments: [],
      },
      {
        name: 'spending_analysis',
        description: 'Analyze spending patterns across categories',
        arguments: [
          {
            name: 'days',
            description: 'Number of days to analyze (default: 30)',
            required: false,
          },
        ],
      },
      {
        name: 'account_overview',
        description: 'Detailed overview of all accounts',
        arguments: [],
      },
    ],
  };
});

// ===== Get Prompt Handler =====
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const authContext = getCurrentAuthContext();

  if (!authContext) {
    throw new UnauthorizedError('Authentication required');
  }

  const userId = authContext.userId;

  switch (name) {
    case 'financial_summary': {
      // Check if user has accounts:read scope
      if (!authContext.scopes.includes('accounts:read')) {
        throw new ForbiddenError('financial_summary requires accounts:read scope');
      }

      const accounts = getAccountsByUserId(userId);
      const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

      let transactionInfo = '';
      if (authContext.scopes.includes('transactions:read')) {
        const transactions = getAllTransactionsForUser(userId, 5);
        transactionInfo = `\n\nRecent Transactions:\n${JSON.stringify(transactions, null, 2)}`;
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a financial summary for the user.\n\nAccounts:\n${JSON.stringify(accounts, null, 2)}\n\nTotal Balance: $${totalBalance.toFixed(2)}${transactionInfo}`,
            },
          },
        ],
      };
    }

    case 'spending_analysis': {
      if (!authContext.scopes.includes('transactions:read')) {
        throw new ForbiddenError('spending_analysis requires transactions:read scope');
      }

      const days = (args as any)?.days || 30;
      const transactions = getAllTransactionsForUser(userId, 100);

      // Filter transactions by days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentTransactions = transactions.filter(
        (txn) => new Date(txn.timestamp) >= cutoffDate
      );

      // Group by category
      const byCategory: Record<string, number> = {};
      recentTransactions.forEach((txn) => {
        if (txn.type === 'debit') {
          byCategory[txn.category] = (byCategory[txn.category] || 0) + Math.abs(txn.amount);
        }
      });

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze spending patterns for the last ${days} days.\n\nTransactions:\n${JSON.stringify(recentTransactions, null, 2)}\n\nSpending by Category:\n${JSON.stringify(byCategory, null, 2)}`,
            },
          },
        ],
      };
    }

    case 'account_overview': {
      if (!authContext.scopes.includes('accounts:read')) {
        throw new ForbiddenError('account_overview requires accounts:read scope');
      }

      const accounts = getAccountsByUserId(userId);
      const profile = authContext.scopes.includes('profile:read')
        ? getCustomerProfile(userId)
        : null;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Provide a detailed overview of all accounts.\n\nAccounts:\n${JSON.stringify(accounts, null, 2)}${profile ? `\n\nCustomer Profile:\n${JSON.stringify(profile, null, 2)}` : ''}`,
            },
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// ===== SSE Endpoints =====

app.get('/sse', async (req, res) => {
  try {
    const authHeader = req.headers.authorization as string;

    console.error(`\n=== SSE Connection Attempt ===`);
    console.error(`From: ${req.ip}`);
    console.error(`Authorization header: ${authHeader ? 'Present' : 'Missing'}`);

    // Validate Bearer token
    const token = extractBearerToken(authHeader);
    if (!token) {
      throw new UnauthorizedError(
        'Missing or invalid Authorization header. Use: Authorization: Bearer <token>'
      );
    }

    const authContext = validateAccessToken(token);

    console.error(`✓ Authenticated: User ${authContext.userId}`);
    console.error(`✓ Scopes: ${authContext.scopes.join(', ')}`);

    // Create SSE transport
    const transport = new SSEServerTransport('/message', res);
    const sessionId = (transport as any)._sessionId;

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
  } catch (error) {
    console.error(`❌ Authentication failed:`, error instanceof Error ? error.message : error);

    if (error instanceof UnauthorizedError || error instanceof OAuthError) {
      // Return WWW-Authenticate header for OAuth
      res.setHeader('WWW-Authenticate', `Bearer realm="Banking MCP", error="invalid_token"`);
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/message', async (req, res) => {
  const sessionId = req.query.sessionId as string;

  console.error(`\n=== POST /message ===`);
  console.error(`SessionId: ${sessionId}`);

  const session = sessions.get(sessionId);

  if (!session) {
    console.error(`❌ No session found for sessionId: ${sessionId}`);
    console.error(`Available sessions: ${Array.from(sessions.keys()).join(', ')}`);
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  console.error(`✓ Session found: ${session.authContext.userId} (scopes: ${session.authContext.scopes.join(', ')})`);

  // Set current auth context for handlers to access
  setCurrentAuthContext(session.authContext);

  try {
    await session.transport.handlePostMessage(req, res);
    console.error(`✓ Message handled`);
  } catch (error) {
    console.error(`❌ Error handling message:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  } finally {
    // Clear auth context after request
    setCurrentAuthContext(null);
  }
});

// ===== Start Server =====

const PORT = 6000;

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`\n╔════════════════════════════════════════════════════════╗`);
  console.error(`║   Banking MCP - SSE Server                            ║`);
  console.error(`╚════════════════════════════════════════════════════════╝`);
  console.error(`\nTransport: stdio`);
}

// Start HTTP server for SSE
app.listen(PORT, () => {
  console.error(`\n╔════════════════════════════════════════════════════════╗`);
  console.error(`║   Banking MCP - SSE Server                            ║`);
  console.error(`╚════════════════════════════════════════════════════════╝`);
  console.error(`\nServer running on: http://localhost:${PORT}`);
  console.error(`\n📋 Endpoints:`);
  console.error(`   GET  /sse      - SSE connection (requires Bearer token)`);
  console.error(`   POST /message  - MCP message handler`);
  console.error(`\n✓ OAuth 2.0 Bearer token authentication`);
  console.error(`✓ Scope-based permissions`);
  console.error(`✓ 6 banking tools available`);
  console.error(`✓ 3 resources available`);
  console.error(`✓ 3 prompts available`);
  console.error(`\n`);
});

// Handle stdio mode
if (process.argv.includes('--stdio')) {
  main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
  });
}
