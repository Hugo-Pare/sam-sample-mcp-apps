export declare function signJWT(payload: object, expiresIn: number): string;
export declare function verifyJWT(token: string): any;
export declare function base64urlEncode(buffer: Buffer): string;
export declare function generateRandomString(bytes?: number): string;
export declare function validatePKCE(codeVerifier: string, codeChallenge: string): boolean;
//# sourceMappingURL=jwt-utils.d.ts.map