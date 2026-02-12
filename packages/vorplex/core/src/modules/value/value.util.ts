import { parsePath, parsePathSelector } from '../../functions/parse-path-selector.function';
import { State } from '../state/state.model';
import { Update } from '../state/update.type';
import { $String } from '../string/string.util';

export class $Value {

    public static isNumeric(value: any) {
        return !isNaN(parseInt(value));
    }

    public static update<T extends object, V>(target: T, pathSelector: (value: T) => V, update: Update<V>): T {
        const path = parsePathSelector(pathSelector);
        const isUnassigned = (value: any) => value == null || typeof value !== 'object';
        const updateAtPath = (value: any, pathIndex: number): any => {
            if (pathIndex === path.length) return State.update(value, update);
            const key = path[pathIndex];
            let nextValue = value?.[key];
            if (isUnassigned(nextValue) && pathIndex < path.length - 1) {
                const nextKey = path[pathIndex + 1];
                nextValue = $Value.isNumeric(nextKey) ? [] : {};
            }
            if (Array.isArray(value)) {
                const array = [...value];
                array[Number(key)] = updateAtPath(nextValue, pathIndex + 1);
                return array;
            }
            return {
                ...(value || {}),
                [key]: updateAtPath(nextValue, pathIndex + 1)
            };
        };

        return updateAtPath(target, 0) as T;
    }

    public static set<T extends object, V>(target: T, pathSelector: (value: T) => V, update: NoInfer<V> | ((value: V) => NoInfer<V>)): T
    public static set<T = any>(target: T, path: string, value: any): T
    public static set<T = any>(target: T, path: any, value: any): any {
        if ($String.isNullOrEmpty(path)) return value;
        const selectors = typeof path === 'string' ? parsePath(path) : parsePathSelector(path);
        const isUnassigned = (value: any) => value == null || typeof value !== 'object';
        if (isUnassigned(target)) target = ($Value.isNumeric(selectors[0]) ? [] : {}) as T;
        let currentTarget = target;
        for (let i = 0; i < selectors.length - 1; i++) {
            const key = selectors[i];
            const nextKey = selectors[i + 1];
            if (isUnassigned(currentTarget[key])) {
                currentTarget[key] = $Value.isNumeric(nextKey) ? [] : {};
            }
            currentTarget = currentTarget[key];
        }
        currentTarget[selectors[selectors.length - 1]] = value;
        return target;
    }

    public static unset(target: any, path: string): void {
        const selectors = parsePath(path);
        for (const [index, selector] of selectors.entries()) {
            if (index < selectors.length - 1) {
                target = target?.[selector];
                if (target == null) return;
            }
            else if (Array.isArray(target)) {
                if (Number.isNaN(Number(selector))) return;
                target.splice(Number(selector), 1);
            }
            else delete target[selector];
        }
    }

    public static get(value: any, path: string): any {
        const selectors = parsePath(path);
        for (const selector of selectors) value = value?.[selector];
        return value;
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
            if (Array.isArray(a)) {
                if (!Array.isArray(b) || a.length !== b.length) return false;
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

    public static pick(target: Record<string, any>, options: { include?: string[]; exclude?: string[] }) {
        const result = options.include ? {} : { ...target };
        if (options.include) {
            for (const include of options.include) {
                $Value.set(result, include, $Value.get(target, include));
            }
        }
        if (options.exclude) {
            for (const exclude of options.exclude) {
                $Value.unset(result, exclude);
            }
        }
        return result;
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
