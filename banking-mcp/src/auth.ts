import { verifyJWT } from './jwt-utils.js';
import { AuthContext } from './types.js';
import { accessTokens } from './oauth-storage.js';

// Error classes
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

export class OAuthError extends Error {
  errorCode: string;
  statusCode: number;
  constructor(errorCode: string, message: string, statusCode: number = 401) {
    super(message);
    this.name = 'OAuthError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }
}

// Scope-based permissions (not role-based)
export const TOOL_PERMISSIONS: Map<string, string[]> = new Map([
  ['get_accounts', ['accounts:read']],
  ['get_account_balance', ['accounts:read']],
  ['get_transactions', ['transactions:read']],
  ['get_customer_profile', ['profile:read']],
  ['update_customer_profile', ['profile:read']],
  ['initiate_payment', ['payments:write']],
]);

export const RESOURCE_PERMISSIONS: Map<string, string[]> = new Map([
  ['banking://accounts/all', ['accounts:read']],
  ['banking://transactions/recent', ['transactions:read']],
  ['banking://profile', ['profile:read']],
]);

// Extract Bearer token from Authorization header
export function extractBearerToken(authHeader: string | undefined): string | undefined {
  if (!authHeader) {
    return undefined;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return undefined;
  }

  return parts[1];
}

// Validate JWT access token
export function validateAccessToken(token: string): AuthContext {
  try {
    // Verify JWT signature and decode
    const decoded = verifyJWT(token);

    // Check expiration
    if (decoded.exp < Date.now() / 1000) {
      throw new OAuthError('invalid_token', 'Access token has expired', 401);
    }

    // Check if it's a refresh token (should not be used as access token)
    if (decoded.token_type === 'refresh') {
      throw new OAuthError('invalid_token', 'Refresh token cannot be used as access token', 401);
    }

    // Check if token is revoked (check storage)
    const tokenData = accessTokens.get(decoded.jti);
    if (!tokenData) {
      throw new OAuthError('invalid_token', 'Token has been revoked', 401);
    }

    // Parse scopes
    const scopes = decoded.scope ? decoded.scope.split(' ') : [];

    return {
      userId: decoded.sub,
      scopes: scopes,
      tokenId: decoded.jti,
      expiresAt: decoded.exp,
    };
  } catch (error) {
    if (error instanceof OAuthError) {
      throw error;
    }
    throw new OAuthError('invalid_token', 'Invalid access token', 401);
  }
}

// Check if user has required scope
export function checkScopePermission(requiredScopes: string[], userScopes: string[]): void {
  // User must have at least one of the required scopes
  const hasPermission = requiredScopes.some((scope) => userScopes.includes(scope));

  if (!hasPermission) {
    throw new ForbiddenError(
      `Insufficient scope. Required: ${requiredScopes.join(' or ')}. Your scopes: ${userScopes.join(' ')}`
    );
  }
}

// Check tool permission (scope-based)
export function checkToolPermission(toolName: string, userScopes: string[]): void {
  const requiredScopes = TOOL_PERMISSIONS.get(toolName);

  if (!requiredScopes) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  checkScopePermission(requiredScopes, userScopes);
}

// Check resource permission (scope-based)
export function checkResourcePermission(uri: string, userScopes: string[]): void {
  const baseUri = uri.split('?')[0];
  const requiredScopes = RESOURCE_PERMISSIONS.get(baseUri);

  if (!requiredScopes) {
    throw new Error(`Unknown resource: ${uri}`);
  }

  checkScopePermission(requiredScopes, userScopes);
}

// Get all supported scopes
export function getSupportedScopes(): string[] {
  return ['accounts:read', 'transactions:read', 'payments:write', 'profile:read'];
}
