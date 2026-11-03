
export class $Object {

    public static hasKeys<T = any>(value: any, ...keys: Extract<keyof T, string>[]): boolean {
        return value != null && typeof value === 'object' && keys.every((key) => key in value);
    }

    public static freeze(value: any): void {
        if ((value !== null && typeof value === 'object') || typeof value === 'function') {
            Object.freeze(value);
            for (const key in value) {
                $Object.freeze(value[key]);
            }
        }
    }

    public static getDefaults<T extends object>(object: T, defaults: Partial<T> = {}): T {
        const result: any = { ...object };
        for (const key in defaults) {
            if (result[key] == null) {
                result[key] = defaults[key];
            }
        }
        return result as T;
    }

    public static getPaths(value: any): string[][] {
        const paths: string[][] = [];
        function addPath(path: string[]) {
            if (path.length) paths.push(path);
        }
        function traverse(value: any, path: string[]) {
            if (value == null || typeof value !== 'object') {
                addPath(path);
            } else if (Array.isArray(value)) {
                if (value.length === 0) {
                    addPath(path);
                } else {
                    for (let i = 0; i < value.length; i++) {
                        traverse(value[i], [...path, String(i)]);
                    }
                }
            } else {
                const keys = Object.keys(value);
                if (keys.length === 0) {
                    addPath(path);
                } else {
                    for (const key of keys) {
                        traverse(value[key], [...path, key]);
                    }
                }
            }
        }
        traverse(value, []);
        return paths;
    }

    public static map<T, R>(value: Record<string, T>, map: (key: string, value: T) => [string, R] | undefined): Record<string, R> {
        return Object.fromEntries(
            Object
                .entries(value)
                .map(([key, value]) => map(key, value)).
                filter(entry => entry !== undefined)
        );
    }

    public static removeUndefinedProperties<T>(value: T): T {
        if (Array.isArray(value)) return value.map(item => $Object.removeUndefinedProperties(item)) as T;
        if (value === null || typeof value !== 'object') return value;
        return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, $Object.removeUndefinedProperties(item)])) as T;
    }

}
