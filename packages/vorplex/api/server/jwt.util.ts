import { SignJWT, createRemoteJWKSet, decodeJwt, jwtVerify, JWTPayload } from 'jose';

export class $JWT {

    private static jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

    public static async create(secret: string, claims: JWTPayload): Promise<string> {
        const secretKey = new TextEncoder().encode(secret);
        return new SignJWT(claims)
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .sign(secretKey);
    }

    public static decode(token: string): JWTPayload | null {
        try {
            return decodeJwt(token);
        } catch {
            return null;
        }
    }

    public static async verify(token: string, secret: string): Promise<JWTPayload | null> {
        try {
            const secretKey = new TextEncoder().encode(secret);
            const { payload } = await jwtVerify(token, secretKey);
            return payload;
        } catch {
            return null;
        }
    }

    public static async verifyWithJwks(token: string, jwksUrl: string): Promise<JWTPayload | null> {
        try {
            let jwks = this.jwksCache.get(jwksUrl);
            if (!jwks) {
                jwks = createRemoteJWKSet(new URL(jwksUrl));
                this.jwksCache.set(jwksUrl, jwks);
            }
            const { payload } = await jwtVerify(token, jwks);
            return payload;
        } catch {
            return null;
        }
    }

}
