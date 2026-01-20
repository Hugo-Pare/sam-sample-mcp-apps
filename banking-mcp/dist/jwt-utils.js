import jwt from 'jsonwebtoken';
import crypto from 'crypto';
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';
export function signJWT(payload, expiresIn) {
    return jwt.sign(payload, JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: `${expiresIn}s`,
    });
}
export function verifyJWT(token) {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}
// Base64url encoding for PKCE
export function base64urlEncode(buffer) {
    return buffer
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
// Generate random string for client IDs, secrets, etc.
export function generateRandomString(bytes = 16) {
    return crypto.randomBytes(bytes).toString('hex');
}
// Validate PKCE code_verifier against code_challenge
export function validatePKCE(codeVerifier, codeChallenge) {
    const computedChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    return computedChallenge === codeChallenge;
}
//# sourceMappingURL=jwt-utils.js.map