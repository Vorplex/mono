import { $Value } from '../value/value.util';

export class $Hash {
    public static async generateSha256Base64(value: any) {
        const json = JSON.stringify($Value.orderProperties(value));
        const buffer = new TextEncoder().encode(json);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).slice(0, 12);
    }
}
