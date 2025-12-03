export class UnauthorizedError extends Error {
    code = 401;
    constructor(message) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
export class ForbiddenError extends Error {
    code = 403;
    constructor(message) {
        super(message);
        this.name = 'ForbiddenError';
    }
}
export const API_KEYS = new Map([
    [
        'mh_viewer_demo123',
        {
            key: 'mh_viewer_demo123',
            role: 'viewer',
            name: 'Demo Viewer',
            description: 'Read-only access for viewing dashboards and metrics',
        },
    ],
    [
        'mh_analyst_demo456',
        {
            key: 'mh_analyst_demo456',
            role: 'analyst',
            name: 'Demo Analyst',
            description: 'Analyst access for creating dashboards and running queries',
        },
    ],
    [
        'mh_admin_demo789',
        {
            key: 'mh_admin_demo789',
            role: 'admin',
            name: 'Demo Admin',
            description: 'Full administrative access including user management',
        },
    ],
]);
export const TOOL_PERMISSIONS = new Map([
    ['get_metrics', ['viewer', 'analyst', 'admin']],
    ['list_dashboards', ['viewer', 'analyst', 'admin']],
    ['create_dashboard', ['analyst', 'admin']],
    ['run_query', ['viewer', 'analyst', 'admin']],
    ['get_report', ['viewer', 'analyst', 'admin']],
    ['export_data', ['analyst', 'admin']],
    ['manage_users', ['admin']],
]);
export const RESOURCE_PERMISSIONS = new Map([
    ['metrics://dashboards/all', ['viewer', 'analyst', 'admin']],
    ['metrics://templates/reports', ['viewer', 'analyst', 'admin']],
    ['metrics://data/sample', ['analyst', 'admin']],
]);
export function validateApiKey(apiKey) {
    if (!apiKey) {
        throw new UnauthorizedError('Missing API key. Provide via X-API-Key header or apiKey query parameter.');
    }
    const config = API_KEYS.get(apiKey);
    if (!config) {
        throw new UnauthorizedError('Invalid API key');
    }
    return {
        role: config.role,
        name: config.name,
        apiKey: apiKey,
    };
}
export function checkToolPermission(toolName, role) {
    const allowedRoles = TOOL_PERMISSIONS.get(toolName);
    if (!allowedRoles) {
        throw new Error(`Unknown tool: ${toolName}`);
    }
    if (!allowedRoles.includes(role)) {
        throw new ForbiddenError(`Access denied. Tool '${toolName}' requires role: ${allowedRoles.join(' or ')}. Your role: ${role}`);
    }
}
export function checkResourcePermission(uri, role) {
    const baseUri = uri.split('?')[0];
    const allowedRoles = RESOURCE_PERMISSIONS.get(baseUri);
    if (!allowedRoles) {
        throw new Error(`Unknown resource: ${uri}`);
    }
    if (!allowedRoles.includes(role)) {
        throw new ForbiddenError(`Access denied. Resource '${uri}' requires role: ${allowedRoles.join(' or ')}. Your role: ${role}`);
    }
}
export function extractApiKey(headers, query) {
    const headerKey = headers['x-api-key'];
    const queryKey = query.apiKey;
    return headerKey || queryKey;
}
export function getAllApiKeys() {
    return Array.from(API_KEYS.values());
}
//# sourceMappingURL=auth.js.map