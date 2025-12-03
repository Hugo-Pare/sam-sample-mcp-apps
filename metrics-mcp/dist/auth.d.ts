import { UserRole, AuthContext, ApiKeyConfig } from './types.js';
export declare class UnauthorizedError extends Error {
    code: number;
    constructor(message: string);
}
export declare class ForbiddenError extends Error {
    code: number;
    constructor(message: string);
}
export declare const API_KEYS: Map<string, ApiKeyConfig>;
export declare const TOOL_PERMISSIONS: Map<string, UserRole[]>;
export declare const RESOURCE_PERMISSIONS: Map<string, UserRole[]>;
export declare function validateApiKey(apiKey: string | undefined): AuthContext;
export declare function checkToolPermission(toolName: string, role: UserRole): void;
export declare function checkResourcePermission(uri: string, role: UserRole): void;
export declare function extractApiKey(headers: Record<string, string | string[] | undefined>, query: Record<string, string | string[] | undefined>): string | undefined;
export declare function getAllApiKeys(): ApiKeyConfig[];
//# sourceMappingURL=auth.d.ts.map