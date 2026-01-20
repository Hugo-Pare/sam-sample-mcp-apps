import { OAuthUser, AuthorizationCode, AccessToken, RefreshToken, RegisteredClient } from './types.js';
export declare const OAUTH_USERS: Map<string, OAuthUser>;
export declare const authorizationCodes: Map<string, AuthorizationCode>;
export declare const accessTokens: Map<string, AccessToken>;
export declare const refreshTokens: Map<string, RefreshToken>;
export declare const registeredClients: Map<string, RegisteredClient>;
export declare const DEFAULT_CLIENT_ID = "banking-mcp-client";
export declare function cleanupExpiredTokens(): void;
export declare function logStorageState(): void;
//# sourceMappingURL=oauth-storage.d.ts.map