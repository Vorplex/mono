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

    public static getPaths(value: any): string[] {
        const paths: string[] = [];
        function addPath(path: string[]) {
            if (path.length) paths.push(path.join('.'));
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

    public static isEmptyObject(value: any): boolean {
        return typeof value === 'object'
            && value !== null
            && !Array.isArray(value)
            && Object.keys(value).length === 0;
    }
}
