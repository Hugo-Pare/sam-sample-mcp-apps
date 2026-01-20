import express from 'express';
import { OAUTH_USERS, authorizationCodes, accessTokens, refreshTokens, registeredClients, DEFAULT_CLIENT_ID, } from './oauth-storage.js';
import { signJWT, verifyJWT, generateRandomString, validatePKCE } from './jwt-utils.js';
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = 6002;
const ISSUER = `http://localhost:${PORT}`;
// Supported scopes
const SUPPORTED_SCOPES = ['accounts:read', 'transactions:read', 'payments:write', 'profile:read'];
// ===== OIDC Discovery Endpoint =====
app.get('/.well-known/openid-configuration', (req, res) => {
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
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['HS256'],
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
// ===== Authorization Endpoint =====
app.get('/oauth/authorize', (req, res) => {
    const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method, } = req.query;
    console.error('\n=== Authorization Request ===');
    console.error(`Client ID: ${client_id}`);
    console.error(`Redirect URI: ${redirect_uri}`);
    console.error(`Scope: ${scope}`);
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
    const requestedScopes = scope.split(' ').filter(Boolean);
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
      <head><title>Authorize Application</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h2>Authorize ${client.clientName}</h2>
        <p>This application is requesting access to your banking data with the following permissions:</p>
        <ul>
          ${requestedScopes.map((s) => `<li><strong>${s}</strong></li>`).join('')}
        </ul>
        <p>Select a user to continue:</p>
        <form action="/oauth/authorize" method="post">
          <input type="hidden" name="client_id" value="${client_id}" />
          <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
          <input type="hidden" name="response_type" value="${response_type}" />
          <input type="hidden" name="scope" value="${scope}" />
          <input type="hidden" name="state" value="${state}" />
          <input type="hidden" name="code_challenge" value="${code_challenge}" />
          <input type="hidden" name="code_challenge_method" value="${code_challenge_method}" />

          <select name="user_id" required style="margin: 10px 0; padding: 5px; width: 100%;">
            <option value="">-- Select User --</option>
            <option value="user_basic">John Doe (basic user - accounts:read, profile:read)</option>
            <option value="user_transactions">Jane Smith (transactions user - accounts:read, transactions:read, profile:read)</option>
            <option value="user_full">Admin User (full access - all scopes)</option>
          </select>

          <div style="margin-top: 20px;">
            <button type="submit" name="approve" value="true" style="padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer;">Approve</button>
            <button type="submit" name="approve" value="false" style="padding: 10px 20px; background: #dc3545; color: white; border: none; cursor: pointer; margin-left: 10px;">Deny</button>
          </div>
        </form>
      </body>
    </html>
  `);
});
// Authorization POST (consent handling)
app.post('/oauth/authorize', (req, res) => {
    const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method, user_id, approve, } = req.body;
    console.error('\n=== Authorization Decision ===');
    console.error(`User: ${user_id}`);
    console.error(`Approved: ${approve}`);
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
    // Parse requested scopes
    const requestedScopes = scope.split(' ').filter(Boolean);
    // Filter scopes to only those the user is allowed to have
    const grantedScopes = requestedScopes.filter((s) => user.allowedScopes.includes(s));
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
    // Redirect with code
    const redirectUrl = `${redirect_uri}?code=${code}&state=${state}`;
    res.redirect(redirectUrl);
});
// ===== Token Endpoint =====
app.post('/oauth/token', (req, res) => {
    const { grant_type, code, redirect_uri, client_id, code_verifier, refresh_token } = req.body;
    console.error('\n=== Token Request ===');
    console.error(`Grant Type: ${grant_type}`);
    console.error(`Client ID: ${client_id}`);
    if (grant_type === 'authorization_code') {
        // Validate authorization code
        const authCode = authorizationCodes.get(code);
        if (!authCode || authCode.used) {
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
        if (authCode.clientId !== client_id || authCode.redirectUri !== redirect_uri) {
            return res.status(400).json({
                error: 'invalid_grant',
                error_description: 'Invalid client_id or redirect_uri',
            });
        }
        // Validate PKCE
        if (!code_verifier) {
            return res.status(400).json({
                error: 'invalid_request',
                error_description: 'code_verifier is required',
            });
        }
        if (!validatePKCE(code_verifier, authCode.codeChallenge)) {
            return res.status(400).json({
                error: 'invalid_grant',
                error_description: 'Invalid code_verifier',
            });
        }
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
            aud: client_id,
            exp: Math.floor(Date.now() / 1000) + expiresIn,
            iat: Math.floor(Date.now() / 1000),
            scope: authCode.scope.join(' '),
            jti: accessTokenId,
        };
        const refreshTokenPayload = {
            sub: authCode.userId,
            iss: ISSUER,
            aud: client_id,
            exp: Math.floor(Date.now() / 1000) + refreshExpiresIn,
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
                exp: Math.floor(Date.now() / 1000) + expiresIn,
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
// Start server
app.listen(PORT, () => {
    console.error(`\n╔════════════════════════════════════════════════════════╗`);
    console.error(`║   Banking MCP - OAuth 2.0 Authorization Server       ║`);
    console.error(`╚════════════════════════════════════════════════════════╝`);
    console.error(`\nServer running on: http://localhost:${PORT}`);
    console.error(`\n📋 Available Endpoints:`);
    console.error(`   GET  /.well-known/openid-configuration - OIDC Discovery`);
    console.error(`   POST /oauth/register                    - Dynamic Client Registration`);
    console.error(`   GET  /oauth/authorize                   - Authorization Endpoint`);
    console.error(`   POST /oauth/token                       - Token Endpoint`);
    console.error(`   POST /oauth/introspect                  - Token Introspection`);
    console.error(`   POST /oauth/revoke                      - Token Revocation`);
    console.error(`\n✓ PKCE required (S256 method)`);
    console.error(`✓ Dynamic Client Registration enabled`);
    console.error(`✓ Default client registered: ${DEFAULT_CLIENT_ID}`);
    console.error(`\n`);
});
//# sourceMappingURL=oauth-server.js.map