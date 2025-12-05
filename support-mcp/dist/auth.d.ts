import { UserRole, AuthContext, UserCredentials } from './types.js';
export declare class UnauthorizedError extends Error {
    code: number;
    constructor(message: string);
}
export declare class ForbiddenError extends Error {
    code: number;
    constructor(message: string);
}
export declare const USERS: Map<string, UserCredentials>;
export declare const TOOL_PERMISSIONS: Map<string, UserRole[]>;
export declare const RESOURCE_PERMISSIONS: Map<string, UserRole[]>;
/**
 * Decode Basic Auth header
 * Format: "Basic base64(username:password)"
 */
export declare function decodeBasicAuth(authHeader: string | undefined): {
    username: string;
    password: string;
} | null;
/**
 * Validate username and password, return auth context if valid
 */
export declare function validateCredentials(username: string, password: string): AuthContext;
/**
 * Validate Basic Auth header and return auth context
 */
export declare function validateBasicAuth(authHeader: string | undefined): AuthContext;
/**
 * Check if user has permission to use a tool
 */
export declare function checkToolPermission(toolName: string, role: UserRole): void;
/**
 * Check if user has permission to access a resource
 */
export declare function checkResourcePermission(uri: string, role: UserRole): void;
/**
 * Get all users (for admin management)
 */
export declare function getAllUsers(): UserCredentials[];
/**
 * Create Basic Auth header value for testing
 */
export declare function createBasicAuthHeader(username: string, password: string): string;
//# sourceMappingURL=auth.d.ts.map