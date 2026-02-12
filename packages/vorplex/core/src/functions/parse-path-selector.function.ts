import { $String } from '../modules/string/string.util';

export function parsePath(path: string): string[] {
    return $String.isNullOrEmpty(path) ? []
        : Array.from(path.matchAll(new RegExp(`(?<property>[^.[\\]]+)|\\[(['"\`])(?<index>.*?)\\2\\]`, 'g')))
            .map(match => match.groups.property ?? match.groups.index);
}

export function parsePathSelector<T>(selector: (value: T) => any): string[] {
    const path: string[] = [];
    const proxy = new Proxy({}, {
        get: (target, key) => {
            path.push(String(key));
            return proxy;
        }
    });
    selector(proxy as T);
    return path;
}
