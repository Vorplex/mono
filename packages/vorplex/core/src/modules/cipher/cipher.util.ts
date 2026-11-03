export class $Cipher {

    private static async getKey(secret: string, purpose: string): Promise<CryptoKey> {
        const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'HKDF', false, ['deriveKey']);
        return await crypto.subtle.deriveKey(
            { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: new TextEncoder().encode(purpose) },
            material,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    private static toBase64Url(bytes: Uint8Array): string {
        let binary = '';
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    private static fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
        const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
        return Uint8Array.from(binary, character => character.charCodeAt(0));
    }

    public static async encrypt(secret: string, purpose: string, payload: unknown, lifetime: number): Promise<string> {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const data = new TextEncoder().encode(JSON.stringify({ payload, expireTimestamp: Date.now() + lifetime }));
        const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await $Cipher.getKey(secret, purpose), data));
        const bytes = new Uint8Array(iv.length + encrypted.length);
        bytes.set(iv);
        bytes.set(encrypted, iv.length);
        return $Cipher.toBase64Url(bytes);
    }

    public static async decrypt<T>(secret: string, purpose: string, value: string): Promise<T | undefined> {
        try {
            const bytes = $Cipher.fromBase64Url(value);
            const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, await $Cipher.getKey(secret, purpose), bytes.subarray(12));
            const sealed = JSON.parse(new TextDecoder().decode(decrypted));
            if (sealed.expireTimestamp < Date.now()) return undefined;
            return sealed.payload;
        } catch {
            return undefined;
        }
    }

}
