import { AuthContext } from './types.js';
export declare class UnauthorizedError extends Error {
    code: number;
    constructor(message: string);
}
export declare class ForbiddenError extends Error {
    code: number;
    constructor(message: string);
}
export declare class OAuthError extends Error {
    errorCode: string;
    statusCode: number;
    constructor(errorCode: string, message: string, statusCode?: number);
}
export declare const TOOL_PERMISSIONS: Map<string, string[]>;
export declare const RESOURCE_PERMISSIONS: Map<string, string[]>;
export declare function extractBearerToken(authHeader: string | undefined): string | undefined;
export declare function validateAccessToken(token: string): AuthContext;
export declare function checkScopePermission(requiredScopes: string[], userScopes: string[]): void;
export declare function checkToolPermission(toolName: string, userScopes: string[]): void;
export declare function checkResourcePermission(uri: string, userScopes: string[]): void;
export declare function getSupportedScopes(): string[];
//# sourceMappingURL=auth.d.ts.map