import { $Value } from '../value/value.util';

export type SelectorPath<TValue = any, TResult = any> = string | string[] | ((value: TValue) => TResult);

export class $PathSelector {

    public static parse<T>(selector: SelectorPath<T>): string[] {
        if (selector == null) return [];
        if (Array.isArray(selector)) return selector;
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

    public static toString(path: SelectorPath): string {
        return $PathSelector.parse(path)
            .map(s => s
                .replace(/\\/g, `\\\\`) // escape \
                .replace(/\./g, `\\.`)  // escape .
                .replace(/\[/g, `\\[`)  // escape [
                .replace(/\]/g, `\\]`)  // escape ]
            )
            .join('.');
    }

    public static query(target: any, path: SelectorPath, options?: { include?: SelectorPath[], exclude?: SelectorPath[] }): any {
        const [head, ...rest] = $PathSelector.parse(path);
        if (head === undefined) return options ? $Value.pick(target, options) : target;
        if (target == null) return undefined;
        if (head === '*') {
            if (typeof target !== 'object') return undefined;
            const isArray = Array.isArray(target);
            const result: any = isArray ? [] : {};
            for (const key of Object.keys(target)) {
                const value = $PathSelector.query(target[key], rest, options);
                if (value === undefined) continue;
                if (isArray) result.push(value);
                else result[key] = value;
            }
            return (isArray ? result.length : Object.keys(result).length) ? result : undefined;
        }
        return $PathSelector.query(target[head], rest, options);
    }

}
