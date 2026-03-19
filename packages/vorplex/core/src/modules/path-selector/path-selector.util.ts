export class $PathSelector {

    public static parse<T>(selector: string | ((value: T) => any)): string[] {
        if (typeof selector === 'function') {
            const path: string[] = [];
            const proxy = new Proxy({}, {
                get: (target, key) => {
                    if (typeof key === 'string') path.push(key);
                    return proxy;
                }
            });
            selector(proxy as T);
            return path;
        }
        const segments: string[] = [];
        let i = 0;
        const length = selector.length;
        function readToken(endDelimiters: string[]): string {
            let token = '';
            while (i < length) {
                if (selector[i] === '\\' && i + 1 < length) {
                    i++;
                    token += selector[i++];
                } else if (endDelimiters.includes(selector[i])) {
                    break;
                } else {
                    token += selector[i++];
                }
            }
            return token;
        }
        while (i < length) {
            if (selector[i] === '.') {
                i++;
                continue;
            }
            if (selector[i] === '[') {
                i++;
                const inner = readToken([']']);
                if (i < length && selector[i] === ']') i++;
                if (inner !== '') segments.push(inner);
                continue;
            }
            const token = readToken(['.', '[']);
            if (token !== '') segments.push(token);
        }
        return segments;
    }

    public static sanitize(...segments: string[]): string {
        return segments
            .map(s => s
                .replace(/\\/g, `\\\\`) // escape \
                .replace(/\./g, `\\.`)  // escape .
                .replace(/\[/g, `\\[`)  // escape [
                .replace(/\]/g, `\\]`)  // escape ]
            )
            .join('.');
    }

}
