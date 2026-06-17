import { $PathSelector, SelectorPath } from '../path-selector/path-selector.util';
import { Update } from '../state/update.type';

export type ValueSet<T = any> = T | ((value: T) => T);

export class $Value {

    public static isPrimitive(value: any) {
        return value == null || typeof value !== 'object';
    }

    public static isObject(value: any) {
        return value != null && typeof value === 'object' && !Array.isArray(value);
    }

    public static isNumeric(value: any) {
        return !isNaN(parseInt(value));
    }

    public static pick(value: any, options: { include?: SelectorPath[], exclude?: SelectorPath[] }): any {
        let result: any = options.include ? {} : $Value.clone(value);
        if (options.include) {
            for (const selector of options.include) {
                result = $Value.set(result, selector, $Value.get(value, selector));
            }
        }
        if (options.exclude) {
            for (const selector of options.exclude) {
                result = $Value.unset(result, selector);
            }
        }
        return result;
    }

    public static update<T>(target: T, update: Update<T>): T;
    public static update<T, V>(target: T, path: SelectorPath<T, V>, update: Update<V>): T;
    public static update<T = any>(...args: any[]): T {
        const patch = <TValue, TPatch extends Partial<TValue>>(value: TValue, patch: TPatch): TValue & TPatch => {
            if (value == null || patch == null) return patch as TValue & TPatch;
            if (typeof value !== 'object' || typeof patch !== 'object') return patch as TValue & TPatch;
            if (Array.isArray(value) || Array.isArray(patch)) return patch as TValue & TPatch;
            const prototype = Object.getPrototypeOf(value ?? patch);
            const result = Object.assign({}, value, patch);
            return Object.setPrototypeOf(result, prototype) as TValue & TPatch;
        };
        const target: T = args[0];
        const path: SelectorPath<T> = args.length === 3 ? args[1] : null;
        const update: Update<T> = args.length === 2 ? args[1] : args[2];
        const updater = (value: any) => typeof update === 'function' ? (update as (value: T) => Partial<T>)(value) : update;
        if (args.length === 2) return patch(target, updater(target));
        return $Value.write(target, path, (value) => patch(value, updater(value)));
    }

    public static set<T>(target: T, update: ValueSet<T>): T;
    public static set<T, V>(target: T, path: SelectorPath<T, V>, update: ValueSet<V>): T;
    public static set<T = any>(...args: any[]): T {
        const target: T = args[0];
        const path: SelectorPath<T> = args.length === 3 ? args[1] : null;
        const update: ValueSet<T> = args.length === 2 ? args[1] : args[2];
        const updater = (value: any) => typeof update === 'function' ? (update as (value: T) => T)(value) : update;
        if (args.length === 2) return updater(target);
        return $Value.write(target, path, (value) => updater(value));
    }

    public static unset<T>(target: T, path: SelectorPath<T>): T {
        const paths = $PathSelector.parse(path);
        if (paths.length === 0) return target;
        const lastKey = paths[paths.length - 1];
        const parentPath = paths.slice(0, -1);
        if ($Value.isPrimitive($Value.get(target, parentPath))) return target;
        return $Value.write(target, parentPath, (container: any) => {
            if (Array.isArray(container)) {
                if (Number.isNaN(Number(lastKey))) return container;
                const array = [...container];
                array.splice(Number(lastKey), 1);
                return array;
            }
            if (!(lastKey in container)) return container;
            const rest = { ...container };
            delete rest[lastKey];
            return rest;
        });
    }

    public static get(value: any, path: SelectorPath): any {
        const selectors = $PathSelector.parse(path);
        for (const selector of selectors) value = value?.[selector];
        return value;
    }

    private static write<T>(target: T, path: SelectorPath<T>, update: (value: any) => any): T {
        const paths = $PathSelector.parse(path);
        const writeAtPath = (value: any, pathIndex: number): any => {
            if (pathIndex === paths.length) return update(value);
            const key = paths[pathIndex];
            const container = $Value.isPrimitive(value) ? ($Value.isNumeric(key) ? [] : {}) : value;
            const currentValue = container[key];
            const nextValue = writeAtPath(currentValue, pathIndex + 1);
            if (currentValue === nextValue && key in container) return value;
            if (Array.isArray(container)) {
                const array = [...container];
                array[Number(key)] = nextValue;
                return array;
            }
            return {
                ...container,
                [key]: nextValue
            };
        };
        return writeAtPath(target, 0) as T;
    }

    public static equals(a: any, b: any): boolean {
        function recurse(a: any, b: any, refs: WeakMap<any, Set<any>>): boolean {
            if (a === b) return true;
            if (a == null || b == null) return false;
            if (typeof a !== typeof b) return false;
            if (typeof a === 'object') {
                if (refs.has(a)) return refs.get(a).has(b);
                if (!refs.has(a)) refs.set(a, new Set());
                refs.get(a).add(b);
            }
            if (Array.isArray(a) !== Array.isArray(b)) return false;
            if (Array.isArray(a)) {
                if (a.length !== b.length) return false;
                for (let i = 0; i < a.length; i++) {
                    if (!recurse(a[i], b[i], refs)) return false;
                }
                return true;
            }
            if (typeof a === 'object') {
                const keysA = Object.keys(a);
                const keysB = Object.keys(b);
                if (keysA.length !== keysB.length) return false;
                for (const key of keysA) {
                    if (!b.hasOwnProperty(key) || !recurse(a[key], b[key], refs)) return false;
                }
                return true;
            }

            return false;
        }
        return recurse(a, b, new WeakMap());
    }

    public static clone<T>(value: T): T {
        const clone = <T>(value: T, map = new WeakMap()): T => {
            if (value == null) return value;
            if (typeof value !== 'object') return value as T;
            if (map.has(value)) return map.get(value);
            let copy: any;
            if (Array.isArray(value)) {
                copy = [];
                map.set(value, copy);
                for (const item of value) copy.push(clone(item, map));
            } else {
                copy = Object.create(Object.getPrototypeOf(value));
                map.set(value, copy);
                for (const key in value) copy[key] = clone(value[key], map);
            }
            return copy;
        };
        return clone(value);
    }

    public static orderProperties<T>(value: T): T {
        const order = <T>(value: T, map = new WeakMap()): T => {
            if (value == null) return value;
            if (typeof value !== 'object') return value;
            if (map.has(value)) return map.get(value);
            let ordered: any;
            if (Array.isArray(value)) {
                ordered = [];
                map.set(value, ordered);
                for (const item of value) {
                    ordered.push(order(item, map));
                }
            } else {
                const keys = Object.keys(value).sort();
                ordered = Object.setPrototypeOf({}, Object.getPrototypeOf(value));
                map.set(value, ordered);
                for (const key of keys) {
                    ordered[key] = order(value[key], map);
                }
            }
            return ordered;
        };
        return order(value);
    }
}
