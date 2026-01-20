import {
  OAuthUser,
  AuthorizationCode,
  AccessToken,
  RefreshToken,
  RegisteredClient,
} from './types.js';

// Demo users with different scope access
export const OAUTH_USERS: Map<string, OAuthUser> = new Map([
  [
    'user_basic',
    {
      userId: 'user_basic',
      username: 'john.doe',
      email: 'john@example.com',
      name: 'John Doe',
      allowedScopes: ['accounts:read', 'profile:read'],
    },
  ],
  [
    'user_transactions',
    {
      userId: 'user_transactions',
      username: 'jane.smith',
      email: 'jane@example.com',
      name: 'Jane Smith',
      allowedScopes: ['accounts:read', 'transactions:read', 'profile:read'],
    },
  ],
  [
    'user_full',
    {
      userId: 'user_full',
      username: 'admin.user',
      email: 'admin@example.com',
      name: 'Admin User',
      allowedScopes: ['accounts:read', 'transactions:read', 'payments:write', 'profile:read'],
    },
  ],
]);

// Storage maps
export const authorizationCodes = new Map<string, AuthorizationCode>();
export const accessTokens = new Map<string, AccessToken>();
export const refreshTokens = new Map<string, RefreshToken>();
export const registeredClients = new Map<string, RegisteredClient>();

// Demo client (for backwards compatibility and testing)
export const DEFAULT_CLIENT_ID = 'banking-mcp-client';
registeredClients.set(DEFAULT_CLIENT_ID, {
  clientId: DEFAULT_CLIENT_ID,
  clientName: 'Banking MCP Demo Client',
  redirectUris: ['http://localhost:8080/callback', 'http://localhost:3000/callback'],
  grantTypes: ['authorization_code', 'refresh_token'],
  responseTypes: ['code'],
  tokenEndpointAuthMethod: 'none',
  createdAt: new Date().toISOString(),
});

// Helper to clean expired tokens periodically
export function cleanupExpiredTokens() {
  const now = Date.now();

  // Clean expired authorization codes
  for (const [code, data] of authorizationCodes.entries()) {
    if (data.expiresAt < now || data.used) {
      authorizationCodes.delete(code);
    }
  }

  // Clean expired access tokens
  for (const [tokenId, data] of accessTokens.entries()) {
    if (data.expiresAt < now) {
      accessTokens.delete(tokenId);
    }
  }

  // Clean expired refresh tokens
  for (const [tokenId, data] of refreshTokens.entries()) {
    if (data.expiresAt < now) {
      refreshTokens.delete(tokenId);
    }
  }

  console.error(
    `[OAuth Storage] Cleanup: ${authorizationCodes.size} codes, ${accessTokens.size} access tokens, ${refreshTokens.size} refresh tokens`
  );
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

// Log storage state for debugging
export function logStorageState() {
  console.error('\n=== OAuth Storage State ===');
  console.error(`Authorization Codes: ${authorizationCodes.size}`);
  console.error(`Access Tokens: ${accessTokens.size}`);
  console.error(`Refresh Tokens: ${refreshTokens.size}`);
  console.error(`Registered Clients: ${registeredClients.size}`);
  console.error('=========================\n');
}
