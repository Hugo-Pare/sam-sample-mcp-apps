import express from 'express';
import { validateAccessToken, extractBearerToken, checkToolPermission, checkResourcePermission, UnauthorizedError, ForbiddenError, OAuthError, TOOL_PERMISSIONS, RESOURCE_PERMISSIONS, } from './auth.js';
import { getAccountsByUserId, getAccountBalance, getTransactions, getAllTransactionsForUser, getCustomerProfile, updateCustomerProfile, initiatePayment, } from './banking-data.js';
import { OAUTH_USERS, authorizationCodes, accessTokens, refreshTokens, registeredClients, } from './oauth-storage.js';
import { signJWT, verifyJWT, generateRandomString, validatePKCE } from './jwt-utils.js';
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = 6001;
const ISSUER = `http://localhost:${PORT}`;
// Supported scopes
const SUPPORTED_SCOPES = ['accounts:read', 'transactions:read', 'payments:write', 'profile:read'];
// ===== OAuth Authorization Server Metadata Endpoint =====
app.get('/.well-known/oauth-authorization-server', (_req, res) => {
    res.json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/oauth/authorize`,
        token_endpoint: `${ISSUER}/oauth/token`,
        introspection_endpoint: `${ISSUER}/oauth/introspect`,
        revocation_endpoint: `${ISSUER}/oauth/revoke`,
        registration_endpoint: `${ISSUER}/oauth/register`,
        scopes_supported: SUPPORTED_SCOPES,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    });
});
// ===== Dynamic Client Registration (RFC 7591) =====
app.post('/oauth/register', (req, res) => {
    try {
        const registrationRequest = req.body;
        console.error('\n=== Client Registration Request ===');
        console.error(`Client Name: ${registrationRequest.client_name}`);
        console.error(`Redirect URIs: ${registrationRequest.redirect_uris?.join(', ')}`);
        // Validate required fields
        if (!registrationRequest.client_name) {
            return res.status(400).json({
                error: 'invalid_client_metadata',
                error_description: 'client_name is required',
            });
        }
        if (!registrationRequest.redirect_uris || registrationRequest.redirect_uris.length === 0) {
            return res.status(400).json({
                error: 'invalid_redirect_uri',
                error_description: 'At least one redirect_uri is required',
            });
        }
        // Validate redirect URIs
        for (const uri of registrationRequest.redirect_uris) {
            try {
                new URL(uri);
            }
            catch (error) {
                return res.status(400).json({
                    error: 'invalid_redirect_uri',
                    error_description: `Invalid redirect_uri: ${uri}`,
                });
            }
        }
        // Generate client ID
        const clientId = `client_${generateRandomString(16)}`;
        // Determine authentication method
        const tokenEndpointAuthMethod = registrationRequest.token_endpoint_auth_method || 'none';
        // Generate client secret if needed
        let clientSecret;
        if (tokenEndpointAuthMethod !== 'none') {
            clientSecret = `secret_${generateRandomString(32)}`;
        }
        // Default values
        const grantTypes = registrationRequest.grant_types || ['authorization_code'];
        const responseTypes = registrationRequest.response_types || ['code'];
        // Create registered client
        const registeredClient = {
            clientId,
            clientSecret,
            clientName: registrationRequest.client_name,
            redirectUris: registrationRequest.redirect_uris,
            grantTypes,
            responseTypes,
            tokenEndpointAuthMethod,
            scope: registrationRequest.scope,
            createdAt: new Date().toISOString(),
        };
        // Store client
        registeredClients.set(clientId, registeredClient);
        console.error(`✓ Client registered: ${clientId}`);
        // Prepare response
        const response = {
            client_id: clientId,
            client_name: registeredClient.clientName,
            redirect_uris: registeredClient.redirectUris,
            grant_types: registeredClient.grantTypes,
            response_types: registeredClient.responseTypes,
            token_endpoint_auth_method: registeredClient.tokenEndpointAuthMethod,
            client_id_issued_at: Math.floor(new Date(registeredClient.createdAt).getTime() / 1000),
        };
        if (clientSecret) {
            response.client_secret = clientSecret;
        }
        if (registeredClient.scope) {
            response.scope = registeredClient.scope;
        }
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'server_error',
            error_description: 'An error occurred during client registration',
        });
    }
});
// Helper function to get human-readable scope descriptions
function getScopeDescription(scope) {
    const descriptions = {
        'accounts:read': 'View your account information and balances',
        'transactions:read': 'View your transaction history',
        'payments:write': 'Initiate payments and transfers on your behalf',
        'profile:read': 'Access your basic profile information',
    };
    return descriptions[scope] || 'Access to this resource';
}
// ===== Authorization Endpoint =====
app.get('/oauth/authorize', (req, res) => {
    const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method, } = req.query;
    console.error('\n=== Authorization Request ===');
    console.error(`Client ID: ${client_id}`);
    console.error(`Redirect URI: ${redirect_uri}`);
    console.error(`Scope: ${scope}`);
    console.error(`State: ${state}`);
    console.error(`PKCE: ${code_challenge ? 'Yes' : 'No'}`);
    // Validate client
    const client = registeredClients.get(client_id);
    if (!client) {
        return res.status(400).json({
            error: 'invalid_client',
            error_description: 'Unknown client_id',
        });
    }
    // Validate redirect URI
    if (!client.redirectUris.includes(redirect_uri)) {
        return res.status(400).json({
            error: 'invalid_request',
            error_description: 'redirect_uri not registered for this client',
        });
    }
    // Validate PKCE
    if (!code_challenge || code_challenge_method !== 'S256') {
        return res.status(400).json({
            error: 'invalid_request',
            error_description: 'PKCE is required. Provide code_challenge with method S256',
        });
    }
    // Validate response_type
    if (response_type !== 'code') {
        return res.status(400).json({
            error: 'unsupported_response_type',
            error_description: 'Only response_type=code is supported',
        });
    }
    // Parse and validate scopes
    // If no scope is provided, default to all available scopes
    const scopeString = scope || SUPPORTED_SCOPES.join(' ');
    const requestedScopes = scopeString.split(' ').filter(Boolean);
    if (requestedScopes.length === 0) {
        return res.status(400).json({
            error: 'invalid_request',
            error_description: 'At least one scope must be requested',
        });
    }
    const invalidScopes = requestedScopes.filter((s) => !SUPPORTED_SCOPES.includes(s));
    if (invalidScopes.length > 0) {
        return res.status(400).json({
            error: 'invalid_scope',
            error_description: `Invalid scopes: ${invalidScopes.join(', ')}`,
        });
    }
    // Render consent page (simplified for demo)
    res.send(`
    <html>
      <head>
        <title>Authorize Application</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
          }
          .scope-item {
            padding: 10px;
            margin: 8px 0;
            background: #f5f5f5;
            border-radius: 4px;
            display: flex;
            align-items: center;
          }
          .scope-item input[type="checkbox"] {
            margin-right: 10px;
            width: 18px;
            height: 18px;
          }
          .scope-label {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
          }
          .scope-name {
            font-weight: bold;
            color: #333;
          }
          .scope-description {
            font-size: 0.9em;
            color: #666;
            margin-top: 4px;
          }
          .button {
            padding: 10px 20px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            border-radius: 4px;
            margin-right: 10px;
          }
          .approve { background: #007bff; color: white; }
          .deny { background: #dc3545; color: white; }
        </style>
      </head>
      <body>
        <h2>Authorize ${client.clientName}</h2>
        <p>This application is requesting access to your banking data. Please select which permissions you want to grant:</p>

        <form action="/oauth/authorize" method="post">
          <input type="hidden" name="client_id" value="${client_id}" />
          <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
          <input type="hidden" name="response_type" value="${response_type}" />
          <input type="hidden" name="state" value="${state}" />
          <input type="hidden" name="code_challenge" value="${code_challenge}" />
          <input type="hidden" name="code_challenge_method" value="${code_challenge_method}" />

          <p><strong>Select a user:</strong></p>
          <select name="user_id" required style="margin: 10px 0; padding: 8px; width: 100%; font-size: 14px;">
            <option value="">-- Select User --</option>
            <option value="user_basic">John Doe (basic user - accounts:read, profile:read)</option>
            <option value="user_transactions">Jane Smith (transactions user - accounts:read, transactions:read, profile:read)</option>
            <option value="user_full">Admin User (full access - all scopes)</option>
          </select>

          <p style="margin-top: 20px;"><strong>Select permissions to grant:</strong></p>
          <div style="margin: 10px 0;">
            ${requestedScopes
        .map((s) => `
              <div class="scope-item">
                <input type="checkbox" name="scopes" value="${s}" id="scope_${s}" checked />
                <label for="scope_${s}" class="scope-label">
                  <span class="scope-name">${s}</span>
                  <span class="scope-description">${getScopeDescription(s)}</span>
                </label>
              </div>
            `)
        .join('')}
          </div>

          <div style="margin-top: 20px;">
            <button type="submit" name="approve" value="true" class="button approve">Approve Selected Permissions</button>
            <button type="submit" name="approve" value="false" class="button deny">Deny</button>
          </div>
        </form>
      </body>
    </html>
  `);
});
// Authorization POST (consent handling)
app.post('/oauth/authorize', (req, res) => {
    const { client_id, redirect_uri, state, code_challenge, code_challenge_method, user_id, approve, scopes, // Selected scopes from checkboxes
     } = req.body;
    console.error('\n=== Authorization Decision ===');
    console.error(`User: ${user_id}`);
    console.error(`Approved: ${approve}`);
    console.error(`State received: ${state}`);
    console.error(`Selected scopes: ${Array.isArray(scopes) ? scopes.join(', ') : scopes || 'none'}`);
    // Handle denial
    if (approve !== 'true') {
        const errorUrl = `${redirect_uri}?error=access_denied&error_description=User denied authorization&state=${state}`;
        return res.redirect(errorUrl);
    }
    // Get user
    const user = OAUTH_USERS.get(user_id);
    if (!user) {
        return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Invalid user_id',
        });
    }
    // Parse user-selected scopes (from checkboxes)
    // Handle both single scope (string) and multiple scopes (array)
    const selectedScopes = Array.isArray(scopes) ? scopes : scopes ? [scopes] : [];
    // Validate that user selected at least one scope
    if (selectedScopes.length === 0) {
        return res.status(400).json({
            error: 'invalid_scope',
            error_description: 'You must select at least one permission to grant',
        });
    }
    // Filter scopes to only those the user is allowed to have
    const grantedScopes = selectedScopes.filter((s) => user.allowedScopes.includes(s));
    if (grantedScopes.length === 0) {
        return res.status(400).json({
            error: 'invalid_scope',
            error_description: 'User does not have permission for any of the requested scopes',
        });
    }
    // Generate authorization code
    const code = `authz_${generateRandomString(32)}`;
    const authCode = {
        code,
        clientId: client_id,
        userId: user_id,
        scope: grantedScopes,
        redirectUri: redirect_uri,
        codeChallenge: code_challenge,
        codeChallengeMethod: code_challenge_method,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        used: false,
    };
    authorizationCodes.set(code, authCode);
    console.error(`✓ Authorization code generated: ${code}`);
    console.error(`✓ Granted scopes: ${grantedScopes.join(', ')}`);
    console.error(`✓ Returning state: ${state}`);
    // Redirect with code
    const redirectUrl = `${redirect_uri}?code=${code}&state=${state}`;
    console.error(`✓ Redirecting to: ${redirectUrl}`);
    res.redirect(redirectUrl);
});
// ===== Token Endpoint =====
app.post('/oauth/token', (req, res) => {
    console.error('\n=== Token Request - Full Debug ===');
    console.error('Request Headers:', JSON.stringify(req.headers, null, 2));
    console.error('Request Body:', JSON.stringify(req.body, null, 2));
    console.error('Content-Type:', req.headers['content-type']);
    // Extract client credentials from either Basic Auth or request body
    let clientId;
    let clientSecret;
    // Check for HTTP Basic Authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Basic ')) {
        try {
            const base64Credentials = authHeader.substring(6);
            const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
            const [id, secret] = credentials.split(':');
            clientId = id;
            clientSecret = secret;
            console.error(`✓ Client credentials extracted from Basic Auth: ${clientId}`);
        }
        catch (error) {
            console.error('❌ Failed to parse Basic Auth header');
        }
    }
    // Fall back to request body if not in Basic Auth
    if (!clientId) {
        clientId = req.body.client_id;
        clientSecret = req.body.client_secret;
        console.error(`✓ Client credentials from request body: ${clientId}`);
    }
    const { grant_type, code, redirect_uri, code_verifier, refresh_token } = req.body;
    console.error('\n=== Parsed Token Request ===');
    console.error(`Grant Type: ${grant_type}`);
    console.error(`Client ID: ${clientId}`);
    console.error(`Code: ${code ? code.substring(0, 10) + '...' : 'undefined'}`);
    console.error(`Redirect URI: ${redirect_uri}`);
    console.error(`Code Verifier: ${code_verifier ? 'provided' : 'missing'}`);
    if (grant_type === 'authorization_code') {
        // Validate required parameters
        if (!clientId) {
            console.error('❌ Missing required parameter: client_id');
            return res.status(400).json({
                error: 'invalid_request',
                error_description: 'client_id is required for authorization_code grant',
            });
        }
        if (!code) {
            console.error('❌ Missing required parameter: code');
            return res.status(400).json({
                error: 'invalid_request',
                error_description: 'code is required for authorization_code grant',
            });
        }
        if (!code_verifier) {
            console.error('❌ Missing required parameter: code_verifier');
            return res.status(400).json({
                error: 'invalid_request',
                error_description: 'code_verifier is required for PKCE',
            });
        }
        // Validate authorization code
        const authCode = authorizationCodes.get(code);
        if (!authCode || authCode.used) {
            console.error('❌ Invalid or used authorization code');
            return res.status(400).json({
                error: 'invalid_grant',
                error_description: 'Invalid or used authorization code',
            });
        }
        if (authCode.expiresAt < Date.now()) {
            authorizationCodes.delete(code);
            return res.status(400).json({
                error: 'invalid_grant',
                error_description: 'Authorization code has expired',
            });
        }
        if (authCode.clientId !== clientId || authCode.redirectUri !== redirect_uri) {
            console.error(`❌ Client ID mismatch. Expected: ${authCode.clientId}, Got: ${clientId}`);
            console.error(`❌ Redirect URI mismatch. Expected: ${authCode.redirectUri}, Got: ${redirect_uri}`);
            return res.status(400).json({
                error: 'invalid_grant',
                error_description: 'Invalid client_id or redirect_uri',
            });
        }
        // Validate PKCE
        if (!validatePKCE(code_verifier, authCode.codeChallenge)) {
            console.error('❌ PKCE validation failed');
            return res.status(400).json({
                error: 'invalid_grant',
                error_description: 'Invalid code_verifier',
            });
        }
        console.error('✓ PKCE validation successful');
        console.error('✓ All validations passed, generating tokens');
        // Mark code as used
        authCode.used = true;
        // Generate tokens
        const accessTokenId = `access_${generateRandomString(16)}`;
        const refreshTokenId = `refresh_${generateRandomString(16)}`;
        const expiresIn = 3600; // 1 hour
        const refreshExpiresIn = 7 * 24 * 3600; // 7 days
        const accessTokenPayload = {
            sub: authCode.userId,
            iss: ISSUER,
            aud: clientId,
            iat: Math.floor(Date.now() / 1000),
            scope: authCode.scope.join(' '),
            jti: accessTokenId,
        };
        const refreshTokenPayload = {
            sub: authCode.userId,
            iss: ISSUER,
            aud: clientId,
            iat: Math.floor(Date.now() / 1000),
            jti: refreshTokenId,
            token_type: 'refresh',
        };
        const accessTokenJWT = signJWT(accessTokenPayload, expiresIn);
        const refreshTokenJWT = signJWT(refreshTokenPayload, refreshExpiresIn);
        // Store token metadata
        accessTokens.set(accessTokenId, {
            tokenId: accessTokenId,
            userId: authCode.userId,
            scope: authCode.scope,
            expiresAt: Date.now() + expiresIn * 1000,
            refreshTokenId,
        });
        refreshTokens.set(refreshTokenId, {
            tokenId: refreshTokenId,
            userId: authCode.userId,
            scope: authCode.scope,
            expiresAt: Date.now() + refreshExpiresIn * 1000,
        });
        console.error(`✓ Access token generated: ${accessTokenId}`);
        console.error(`✓ Refresh token generated: ${refreshTokenId}`);
        res.json({
            access_token: accessTokenJWT,
            token_type: 'Bearer',
            expires_in: expiresIn,
            refresh_token: refreshTokenJWT,
            scope: authCode.scope.join(' '),
        });
    }
    else if (grant_type === 'refresh_token') {
        try {
            // Verify refresh token
            const decoded = verifyJWT(refresh_token);
            if (decoded.token_type !== 'refresh') {
                return res.status(400).json({
                    error: 'invalid_grant',
                    error_description: 'Invalid refresh token',
                });
            }
            const tokenData = refreshTokens.get(decoded.jti);
            if (!tokenData) {
                return res.status(400).json({
                    error: 'invalid_grant',
                    error_description: 'Refresh token has been revoked',
                });
            }
            // Generate new access token with same scopes
            const accessTokenId = `access_${generateRandomString(16)}`;
            const expiresIn = 3600;
            const accessTokenPayload = {
                sub: decoded.sub,
                iss: ISSUER,
                aud: decoded.aud,
                iat: Math.floor(Date.now() / 1000),
                scope: tokenData.scope.join(' '),
                jti: accessTokenId,
            };
            const accessTokenJWT = signJWT(accessTokenPayload, expiresIn);
            accessTokens.set(accessTokenId, {
                tokenId: accessTokenId,
                userId: tokenData.userId,
                scope: tokenData.scope,
                expiresAt: Date.now() + expiresIn * 1000,
                refreshTokenId: decoded.jti,
            });
            console.error(`✓ New access token generated via refresh: ${accessTokenId}`);
            res.json({
                access_token: accessTokenJWT,
                token_type: 'Bearer',
                expires_in: expiresIn,
                scope: tokenData.scope.join(' '),
            });
        }
        catch (error) {
            console.error('Refresh token error:', error);
            return res.status(400).json({
                error: 'invalid_grant',
                error_description: 'Invalid refresh token',
            });
        }
    }
    else {
        res.status(400).json({
            error: 'unsupported_grant_type',
            error_description: `Grant type '${grant_type}' is not supported`,
        });
    }
});
// ===== Token Introspection =====
app.post('/oauth/introspect', (req, res) => {
    const { token } = req.body;
    try {
        const decoded = verifyJWT(token);
        // Check if it's an access token
        if (!decoded.token_type || decoded.token_type !== 'refresh') {
            const tokenData = accessTokens.get(decoded.jti);
            if (!tokenData || decoded.exp < Date.now() / 1000) {
                return res.json({ active: false });
            }
            return res.json({
                active: true,
                scope: decoded.scope,
                client_id: decoded.aud,
                username: tokenData.userId,
                token_type: 'Bearer',
                exp: decoded.exp,
                iat: decoded.iat,
                sub: decoded.sub,
            });
        }
        // It's a refresh token
        const tokenData = refreshTokens.get(decoded.jti);
        if (!tokenData || decoded.exp < Date.now() / 1000) {
            return res.json({ active: false });
        }
        return res.json({
            active: true,
            client_id: decoded.aud,
            username: tokenData.userId,
            token_type: 'refresh',
            exp: decoded.exp,
            iat: decoded.iat,
            sub: decoded.sub,
        });
    }
    catch (error) {
        res.json({ active: false });
    }
});
// ===== Token Revocation (RFC 7009) =====
app.post('/oauth/revoke', (req, res) => {
    const { token, token_type_hint } = req.body;
    console.error('\n=== Token Revocation Request ===');
    console.error(`Token Type Hint: ${token_type_hint || 'not provided'}`);
    try {
        const decoded = verifyJWT(token);
        // Remove from storage
        if (decoded.token_type === 'refresh') {
            refreshTokens.delete(decoded.jti);
            console.error(`✓ Refresh token revoked: ${decoded.jti}`);
        }
        else {
            accessTokens.delete(decoded.jti);
            console.error(`✓ Access token revoked: ${decoded.jti}`);
        }
        res.status(200).send();
    }
    catch (error) {
        // Per RFC 7009, return 200 even if token is invalid
        res.status(200).send();
    }
});
// ===== MCP HTTP Endpoint =====
app.post('/mcp', async (req, res) => {
    try {
        const { method, params, id } = req.body;
        console.error(`\n=== HTTP Request ===`);
        console.error(`Method: ${method}`);
        console.error(`ID: ${id}`);
        let authContext;
        // Skip auth for initialize and notifications
        if (method !== 'initialize' && !method?.startsWith('notifications/')) {
            try {
                const authHeader = req.headers.authorization;
                const token = extractBearerToken(authHeader);
                if (!token) {
                    throw new UnauthorizedError('Missing or invalid Authorization header. Use: Authorization: Bearer <token>');
                }
                authContext = validateAccessToken(token);
                console.error(`✓ Authenticated: User ${authContext.userId}`);
                console.error(`✓ Scopes: ${authContext.scopes.join(', ')}`);
            }
            catch (error) {
                console.error(`❌ Authentication failed:`, error);
                // Return WWW-Authenticate header
                res.setHeader('WWW-Authenticate', `Bearer realm="Banking MCP", error="invalid_token"`);
                if (error instanceof OAuthError) {
                    return res.status(error.statusCode).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32001,
                            message: error.message,
                            data: { oauth_error: error.errorCode },
                        },
                        id,
                    });
                }
                return res.status(401).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32001,
                        message: error instanceof Error ? error.message : 'Authentication failed',
                    },
                    id,
                });
            }
        }
        // Handle different MCP methods
        switch (method) {
            case 'initialize': {
                return res.json({
                    jsonrpc: '2.0',
                    result: {
                        protocolVersion: '2024-11-05',
                        serverInfo: {
                            name: 'banking-mcp-server',
                            version: '1.0.0',
                        },
                        capabilities: {
                            tools: {},
                            resources: {},
                            prompts: {},
                        },
                    },
                    id,
                });
            }
            case 'notifications/initialized': {
                // Client has finished initializing - no response needed for notifications
                console.error('✓ Client initialized');
                return res.status(200).end();
            }
            case 'tools/list': {
                if (!authContext) {
                    throw new UnauthorizedError('Authentication required');
                }
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
                                accountId: { type: 'string', description: 'Account ID' },
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
                                accountId: { type: 'string', description: 'Account ID' },
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
                                phone: { type: 'string', description: 'Phone number' },
                                preferredLanguage: { type: 'string', description: 'Preferred language' },
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
                                fromAccountId: { type: 'string', description: 'Source account ID' },
                                toAccountNumber: { type: 'string', description: 'Destination account number' },
                                amount: { type: 'number', description: 'Payment amount' },
                                description: { type: 'string', description: 'Payment description' },
                            },
                            required: ['fromAccountId', 'toAccountNumber', 'amount'],
                        },
                    },
                ];
                const filteredTools = allTools.filter((tool) => {
                    const requiredScopes = TOOL_PERMISSIONS.get(tool.name);
                    if (!requiredScopes)
                        return false;
                    return requiredScopes.some((scope) => authContext.scopes.includes(scope));
                });
                return res.json({
                    jsonrpc: '2.0',
                    result: { tools: filteredTools },
                    id,
                });
            }
            case 'tools/call': {
                if (!authContext) {
                    throw new UnauthorizedError('Authentication required');
                }
                const { name, arguments: args } = params;
                const userId = authContext.userId;
                // Check permission
                checkToolPermission(name, authContext.scopes);
                let result;
                switch (name) {
                    case 'get_accounts':
                        result = getAccountsByUserId(userId);
                        break;
                    case 'get_account_balance':
                        result = getAccountBalance(args.accountId, userId);
                        break;
                    case 'get_transactions':
                        result = getTransactions(args.accountId, userId, args.limit || 50);
                        break;
                    case 'get_customer_profile':
                        result = getCustomerProfile(userId);
                        break;
                    case 'update_customer_profile':
                        result = updateCustomerProfile(userId, args);
                        break;
                    case 'initiate_payment':
                        result = initiatePayment(userId, args.fromAccountId, args.toAccountNumber, args.amount, args.description || '');
                        break;
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
                return res.json({
                    jsonrpc: '2.0',
                    result: {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(result, null, 2),
                            },
                        ],
                    },
                    id,
                });
            }
            case 'resources/list': {
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
                const filteredResources = allResources.filter((resource) => {
                    const requiredScopes = RESOURCE_PERMISSIONS.get(resource.uri);
                    if (!requiredScopes)
                        return false;
                    return requiredScopes.some((scope) => authContext.scopes.includes(scope));
                });
                return res.json({
                    jsonrpc: '2.0',
                    result: { resources: filteredResources },
                    id,
                });
            }
            case 'resources/read': {
                if (!authContext) {
                    throw new UnauthorizedError('Authentication required');
                }
                const { uri } = params;
                const userId = authContext.userId;
                // Check permission
                checkResourcePermission(uri, authContext.scopes);
                let data;
                if (uri === 'banking://accounts/all') {
                    data = getAccountsByUserId(userId);
                }
                else if (uri === 'banking://transactions/recent') {
                    data = getAllTransactionsForUser(userId, 20);
                }
                else if (uri === 'banking://profile') {
                    data = getCustomerProfile(userId);
                }
                else {
                    throw new Error(`Unknown resource: ${uri}`);
                }
                return res.json({
                    jsonrpc: '2.0',
                    result: {
                        contents: [
                            {
                                uri,
                                mimeType: 'application/json',
                                text: JSON.stringify(data, null, 2),
                            },
                        ],
                    },
                    id,
                });
            }
            case 'prompts/list': {
                return res.json({
                    jsonrpc: '2.0',
                    result: {
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
                    },
                    id,
                });
            }
            case 'prompts/get': {
                if (!authContext) {
                    throw new UnauthorizedError('Authentication required');
                }
                const { name, arguments: args } = params;
                const userId = authContext.userId;
                let promptText;
                switch (name) {
                    case 'financial_summary': {
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
                        promptText = `Generate a financial summary for the user.\n\nAccounts:\n${JSON.stringify(accounts, null, 2)}\n\nTotal Balance: $${totalBalance.toFixed(2)}${transactionInfo}`;
                        break;
                    }
                    case 'spending_analysis': {
                        if (!authContext.scopes.includes('transactions:read')) {
                            throw new ForbiddenError('spending_analysis requires transactions:read scope');
                        }
                        const days = args?.days || 30;
                        const transactions = getAllTransactionsForUser(userId, 100);
                        const cutoffDate = new Date();
                        cutoffDate.setDate(cutoffDate.getDate() - days);
                        const recentTransactions = transactions.filter((txn) => new Date(txn.timestamp) >= cutoffDate);
                        const byCategory = {};
                        recentTransactions.forEach((txn) => {
                            if (txn.type === 'debit') {
                                byCategory[txn.category] = (byCategory[txn.category] || 0) + Math.abs(txn.amount);
                            }
                        });
                        promptText = `Analyze spending patterns for the last ${days} days.\n\nTransactions:\n${JSON.stringify(recentTransactions, null, 2)}\n\nSpending by Category:\n${JSON.stringify(byCategory, null, 2)}`;
                        break;
                    }
                    case 'account_overview': {
                        if (!authContext.scopes.includes('accounts:read')) {
                            throw new ForbiddenError('account_overview requires accounts:read scope');
                        }
                        const accounts = getAccountsByUserId(userId);
                        const profile = authContext.scopes.includes('profile:read')
                            ? getCustomerProfile(userId)
                            : null;
                        promptText = `Provide a detailed overview of all accounts.\n\nAccounts:\n${JSON.stringify(accounts, null, 2)}${profile ? `\n\nCustomer Profile:\n${JSON.stringify(profile, null, 2)}` : ''}`;
                        break;
                    }
                    default:
                        throw new Error(`Unknown prompt: ${name}`);
                }
                return res.json({
                    jsonrpc: '2.0',
                    result: {
                        messages: [
                            {
                                role: 'user',
                                content: {
                                    type: 'text',
                                    text: promptText,
                                },
                            },
                        ],
                    },
                    id,
                });
            }
            default:
                return res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32601,
                        message: `Method not found: ${method}`,
                    },
                    id,
                });
        }
    }
    catch (error) {
        console.error('Error handling request:', error);
        if (error instanceof ForbiddenError) {
            res.setHeader('WWW-Authenticate', `Bearer realm="Banking MCP", error="insufficient_scope"`);
            return res.status(403).json({
                jsonrpc: '2.0',
                error: {
                    code: -32002,
                    message: error.message,
                    data: { oauth_error: 'insufficient_scope' },
                },
                id: req.body.id,
            });
        }
        return res.status(500).json({
            jsonrpc: '2.0',
            error: {
                code: -32603,
                message: error instanceof Error ? error.message : 'Internal server error',
            },
            id: req.body.id,
        });
    }
});
// ===== Health Check =====
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        authentication: 'OAuth 2.0 Bearer Token',
        version: '1.0.0',
        port: PORT,
    });
});
// ===== Start Server =====
app.listen(PORT, () => {
    console.error(`\n╔════════════════════════════════════════════════════════╗`);
    console.error(`║   Banking MCP - HTTP Server with OAuth 2.0            ║`);
    console.error(`╚════════════════════════════════════════════════════════╝`);
    console.error(`\nServer running on: http://localhost:${PORT}`);
    console.error(`\n📋 OAuth 2.0 Endpoints:`);
    console.error(`   GET  /.well-known/oauth-authorization-server - Authorization Server Metadata`);
    console.error(`   POST /oauth/register                        - Dynamic Client Registration`);
    console.error(`   GET  /oauth/authorize                       - Authorization Endpoint`);
    console.error(`   POST /oauth/token                           - Token Endpoint`);
    console.error(`   POST /oauth/introspect                      - Token Introspection`);
    console.error(`   POST /oauth/revoke                          - Token Revocation`);
    console.error(`\n📋 MCP Endpoints:`);
    console.error(`   POST /mcp      - MCP JSON-RPC endpoint (requires Bearer token)`);
    console.error(`   GET  /health   - Health check`);
    console.error(`\n✓ PKCE required (S256 method)`);
    console.error(`✓ Dynamic Client Registration enabled`);
    console.error(`✓ Scope-based permissions`);
    console.error(`✓ 6 banking tools available`);
    console.error(`✓ 3 resources available`);
    console.error(`✓ 3 prompts available`);
    console.error(`\n`);
});
//# sourceMappingURL=streamable-http.js.map