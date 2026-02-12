export class Compression {
    public static compressString(string: string): string {
        if (string.length === 0) return '';
        const dict = new Map<string, number>();
        let dictSize = 256;
        let w = string[0];
        const codes: number[] = [];
        for (let i = 1; i < string.length; i++) {
            const c = string[i];
            const wc = w + c;
            if (dict.has(wc)) {
                w = wc;
            } else {
                codes.push(w.length > 1 ? (dict.get(w) as number) : w.charCodeAt(0));
                dict.set(wc, dictSize++);
                w = c;
            }
        }
        codes.push(w.length > 1 ? (dict.get(w) as number) : w.charCodeAt(0));
        return codes.map((code) => String.fromCharCode(code)).join('');
    }

    public static decompressString(string: string): string {
        if (string.length === 0) return '';
        const dict = new Map<number, string>();
        let dictSize = 256;

        const symbols = [...string];
        let w = symbols[0];
        let result = w;

        for (let i = 1; i < symbols.length; i++) {
            const k = symbols[i].charCodeAt(0);

            let entry: string;
            if (k < 256) {
                entry = symbols[i];
            } else if (dict.has(k)) {
                entry = dict.get(k)!;
            } else if (k === dictSize) {
                entry = w + w[0];
            } else {
                throw new Error('Corrupt LZW stream: unknown code encountered.');
            }
            result += entry;
            dict.set(dictSize++, w + entry[0]);
            w = entry;
        }
    }
}
