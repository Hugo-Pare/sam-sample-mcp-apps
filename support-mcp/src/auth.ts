import { UserRole, AuthContext, UserCredentials } from './types.js';

export class UnauthorizedError extends Error {
  code = 401;
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  code = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// Demo user credentials (in production, these would be hashed and stored in a database)
export const USERS: Map<string, UserCredentials> = new Map([
  [
    'agent1',
    {
      username: 'agent1',
      password: 'pass123',
      role: 'agent',
      userId: 'usr_agent_001',
      email: 'agent1@supportdesk.com',
      name: 'Alice Agent',
    },
  ],
  [
    'supervisor1',
    {
      username: 'supervisor1',
      password: 'super123',
      role: 'supervisor',
      userId: 'usr_super_001',
      email: 'supervisor1@supportdesk.com',
      name: 'Bob Supervisor',
    },
  ],
  [
    'admin',
    {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      userId: 'usr_admin_001',
      email: 'admin@supportdesk.com',
      name: 'Charlie Admin',
    },
  ],
]);

// Tool permissions by role
export const TOOL_PERMISSIONS: Map<string, UserRole[]> = new Map([
  ['list_tickets', ['agent', 'supervisor', 'admin']],
  ['get_ticket', ['agent', 'supervisor', 'admin']],
  ['create_ticket', ['agent', 'supervisor', 'admin']],
  ['update_ticket', ['agent', 'supervisor', 'admin']],
  ['assign_ticket', ['supervisor', 'admin']],
  ['close_ticket', ['agent', 'supervisor', 'admin']],
  ['search_knowledge_base', ['agent', 'supervisor', 'admin']],
  ['get_customer_info', ['agent', 'supervisor', 'admin']],
  ['get_support_stats', ['supervisor', 'admin']],
  ['manage_agents', ['admin']],
]);

export const RESOURCE_PERMISSIONS: Map<string, UserRole[]> = new Map([
  ['support://tickets/open', ['agent', 'supervisor', 'admin']],
  ['support://tickets/my-assigned', ['agent', 'supervisor', 'admin']],
  ['support://knowledge-base/articles', ['agent', 'supervisor', 'admin']],
  ['support://customers/all', ['supervisor', 'admin']],
  ['support://stats/performance', ['supervisor', 'admin']],
]);

/**
 * Decode Basic Auth header
 * Format: "Basic base64(username:password)"
 */
export function decodeBasicAuth(authHeader: string | undefined): { username: string; password: string } | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') {
    return null;
  }

  try {
    const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    if (!username || !password) {
      return null;
    }

    return { username, password };
  } catch (error) {
    return null;
  }
}

/**
 * Validate username and password, return auth context if valid
 */
export function validateCredentials(username: string, password: string): AuthContext {
  const user = USERS.get(username);

  if (!user) {
    throw new UnauthorizedError('Invalid username or password');
  }

  // In production, use bcrypt or similar for password comparison
  if (user.password !== password) {
    throw new UnauthorizedError('Invalid username or password');
  }

  return {
    username: user.username,
    role: user.role,
    userId: user.userId,
    email: user.email,
  };
}

/**
 * Validate Basic Auth header and return auth context
 */
export function validateBasicAuth(authHeader: string | undefined): AuthContext {
  if (!authHeader) {
    throw new UnauthorizedError(
      'Missing Authorization header. Provide Basic Auth credentials: Authorization: Basic base64(username:password)'
    );
  }

  const credentials = decodeBasicAuth(authHeader);

  if (!credentials) {
    throw new UnauthorizedError('Invalid Authorization header format. Use: Authorization: Basic base64(username:password)');
  }

  return validateCredentials(credentials.username, credentials.password);
}

/**
 * Check if user has permission to use a tool
 */
export function checkToolPermission(toolName: string, role: UserRole): void {
  const allowedRoles = TOOL_PERMISSIONS.get(toolName);

  if (!allowedRoles) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  if (!allowedRoles.includes(role)) {
    throw new ForbiddenError(
      `Access denied. Tool '${toolName}' requires role: ${allowedRoles.join(' or ')}. Your role: ${role}`
    );
  }
}

/**
 * Check if user has permission to access a resource
 */
export function checkResourcePermission(uri: string, role: UserRole): void {
  const baseUri = uri.split('?')[0];
  const allowedRoles = RESOURCE_PERMISSIONS.get(baseUri);

  if (!allowedRoles) {
    throw new Error(`Unknown resource: ${uri}`);
  }

  if (!allowedRoles.includes(role)) {
    throw new ForbiddenError(
      `Access denied. Resource '${uri}' requires role: ${allowedRoles.join(' or ')}. Your role: ${role}`
    );
  }
}

/**
 * Get all users (for admin management)
 */
export function getAllUsers(): UserCredentials[] {
  return Array.from(USERS.values());
}

/**
 * Create Basic Auth header value for testing
 */
export function createBasicAuthHeader(username: string, password: string): string {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${credentials}`;
}
