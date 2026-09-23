export class $Id {

    public static guid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0,
                v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    public static uuid(): string {
        const timestamp = Date.now();
        const bytes = new Uint8Array(16);
        bytes[0] = (timestamp / 2 ** 40) & 0xff;
        bytes[1] = (timestamp / 2 ** 32) & 0xff;
        bytes[2] = (timestamp / 2 ** 24) & 0xff;
        bytes[3] = (timestamp / 2 ** 16) & 0xff;
        bytes[4] = (timestamp / 2 ** 8) & 0xff;
        bytes[5] = timestamp & 0xff;
        crypto.getRandomValues(bytes.subarray(6));
        bytes[6] = (bytes[6] & 0x0f) | 0x70;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    public static getUuidTimestamp(uuid: string): number {
        const hex = uuid.slice(0, 8) + uuid.slice(9, 13);
        return parseInt(hex, 16);
    }

    public static uid(): string {
        return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    }

    public static getUidTimestamp(uid: string): number {
        return parseInt(uid.slice(0, -3), 36);
    }

    public static hash(value: string): string {
        let h1 = 1779033703;
        let h2 = 3144134277;
        let h3 = 1013904242;
        let h4 = 2773480762;
        for (let i = 0; i < value.length; i++) {
            const k = value.charCodeAt(i);
            h1 = Math.imul(h1 ^ k, 597399067);
            h2 = Math.imul(h2 ^ k, 2869860233);
            h3 = Math.imul(h3 ^ k, 951274213);
            h4 = Math.imul(h4 ^ k, 2716044179);
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
        const hex = [h1, h2, h3, h4]
            .map(n => (n >>> 0).toString(16).padStart(8, '0'))
            .join('');
        return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20, 32)
        ].join('-');
    }
}
