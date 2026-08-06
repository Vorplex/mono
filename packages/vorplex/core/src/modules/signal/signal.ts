import { $Array } from '../array/array.util';
import { $PathSelector, SelectorPath } from '../path-selector/path-selector.util';
import { $Value } from '../value/value.util';
import { ComputationScope } from './scopes/computation';
import { Scope } from './scopes/scope';

export type Getter<T> = () => T;
export type Setter<T> = {
    (value: T): T;
    (update: (value: T) => T): T;
};
export interface Signal<T = any> extends Getter<T>, Setter<T> {
    readonly value: T;
    readonly subscribers: Set<ComputationScope>;
    readonly proxy: SignalProxy<T>;
}
export type SignalProxy<T> =
    T extends object ? Signal<T> & { readonly [K in keyof T]-?: SignalProxy<T[K]> }
    : Signal<T>;

export class Signal<T = any> {

    private static batchDepth = 0;
    private static flushing = false;
    private static readonly pendingComputations = new Set<ComputationScope>();

    public static create<T>(initial?: T): Signal<T> {
        const signal = Object.assign(
            ((...args: [] | [T] | [(value: T) => T]) => {
                return args.length === 0 ? get() : set(args[0] as T);
            }),
            {
                value: initial,
                subscribers: new Set(),
                proxy: Signal.proxy<T>(path => select(path))
            }
        ) as Signal<T>;

        const selections = new Map<string, { path: string[]; signal: Signal; proxy: Signal }>();

        const get: Getter<T> = () => {
            const scope = Scope.current;
            if (scope instanceof ComputationScope && !scope.disposed) {
                signal.subscribers.add(scope);
                scope.registerDependency(signal);
            }
            return signal.value;
        };

        const set: Setter<T> = update => {
            const value = typeof update === 'function' ? (update as (value: T) => T)(signal.value) : update;
            if (signal.value === value) return signal.value;
            (signal as { value: Signal['value'] }).value = value;
            for (const computation of signal.subscribers) {
                if (!computation.disposed) {
                    Signal.pendingComputations.add(computation);
                }
            }
            if (selections.size > 0) {
                Signal.batch(() => {
                    for (const [key, selection] of selections) {
                        if (selection.signal.subscribers.size === 0) {
                            selections.delete(key);
                            continue;
                        }
                        selection.signal($Value.get(signal.value, selection.path));
                    }
                });
            }
            if (Signal.batchDepth === 0 && !Signal.flushing) Signal.flush();
            return signal.value;
        };

        const select = <V>(path?: SelectorPath<T, V>): Signal<V> => {
            const segments = $PathSelector.parse<T>(path);
            const key = $PathSelector.toString(segments);
            const existing = selections.get(key);
            if (existing) return existing.proxy as Signal<V>;
            const pathSignal = Signal.create<V>($Value.get(signal.value, segments));
            const selection = {
                path: segments,
                signal: pathSignal,
                proxy: new Proxy(pathSignal, {
                    apply: (_target, _thisArg, args) => {
                        if (args.length === 0) return pathSignal();
                        const [update] = args;
                        const current = $Value.get(signal.value, segments);
                        const value = typeof update === 'function' ? update(current) : update;
                        set($Value.set(signal.value, segments, value));
                        return value;
                    }
                }) as Signal<V>
            };
            selections.set(key, selection);
            return selection.proxy;
        };

        return signal;
    }

    public static batch(callback: () => void): void {
        Signal.batchDepth++;
        try {
            callback();
        } finally {
            Signal.batchDepth--;
            if (Signal.batchDepth === 0 && !Signal.flushing) {
                Signal.flush();
            }
        }
    }

    private static flush(): void {
        if (Signal.flushing) return;
        Signal.flushing = true;
        try {
            while (Signal.pendingComputations.size > 0) {
                const queue = [...Signal.pendingComputations].sort((a, b) => a.depth - b.depth);
                Signal.pendingComputations.clear();
                for (const computation of queue) {
                    computation.run();
                }
            }
        } finally {
            Signal.flushing = false;
        }
    }

    public static memo<T>(callback: () => T): Getter<T> {
        let initialized = false;
        let value!: T;
        const signal = Signal.create<T>(undefined as T);
        Signal.effect(() => {
            const next = callback();
            if (initialized && $Value.equals(value, next)) return;
            initialized = true;
            value = next;
            signal(next);
        });
        return () => signal();
    }

    public static keyed<T, U>(source: Getter<readonly T[] | Record<string, T>>, key: (item: { index: number, key: string, value: T }) => any, create: (item: Signal<{ value: T, index: number, key: any }>) => U): Getter<U[]> {
        interface Entry {
            root: Scope;
            item: Signal<{ value: T, index: number, key: any }>;
            value: U;
        }
        let entries = new Map<unknown, Entry>();
        Signal.cleanup(() => {
            for (const entry of entries.values()) entry.root.dispose();
        });
        return Signal.memo(() => {
            const data = source();
            const items = $Array.isArray<T>(data) ? data.map((item, index) => ({ index, key: String(index), value: item })) : Object.entries(data).map(([key, value], index) => ({ index, key, value }));
            const result: U[] = [];
            const next = new Map<unknown, Entry>();
            for (const item of items) {
                const id = key(item);
                if (next.has(id)) throw new Error(`Duplicate keyed value (${String(id)})`);
                let entry = entries.get(id);
                if (entry) {
                    entries.delete(id);
                    entry.item(item);
                } else {
                    let signal = Signal.create(item);
                    let value: U;
                    const root = Signal.root(() => value = create(signal));
                    entry = { root, item: signal, value };
                }
                next.set(id, entry);
                result.push(entry.value);
            }
            for (const stale of entries.values()) stale.root.dispose();
            entries = next;
            return result;
        });
    }

    public static untrack<T>(callback: () => T): T {
        const previous = Scope.current;
        Scope.current = null;
        try {
            return callback();
        } finally {
            Scope.current = previous;
        }
    }

    public static scope(callback: () => void): Scope {
        const scope = new Scope(callback, Scope.current);
        scope.run();
        return scope;
    }

    public static root(callback: () => void): Scope {
        const root = new Scope(callback, null);
        root.run();
        return root;
    }

    public static effect(callback: () => void): ComputationScope {
        const effect = new ComputationScope(callback, Scope.current);
        effect.run();
        return effect;
    }

    public static cleanup(callback: () => void): void {
        const scope = Scope.current;
        if (!scope) throw new Error('Unable to register cleanup. No scope found');
        scope.registerCleanup(callback);
    }

    public static proxy<T>(select: (path: string[]) => Signal): SignalProxy<T> {
        return $PathSelector.proxy((path, args) => (select(path) as any)(...args)) as SignalProxy<T>;
    }

}
