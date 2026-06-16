import { $Value } from '../value/value.util';
import { ComputationScope } from './scopes/computation';
import { Scope } from './scopes/scope';

export type Getter<T> = () => T;
export type Setter<T> = {
    (value: T): T;
    (update: (value: T) => T): T;
};
export type SignalAccessor<T> = Getter<T> & Setter<T> & { readonly signal: Signal<T> };

export type SignalProxy<T> =
    T extends object ? SignalAccessor<T> & { readonly [K in keyof T]-?: SignalProxy<T[K]> }
    : SignalAccessor<T>;

export class Signal<T = any> {

    public value: T;
    public subscribers: Set<ComputationScope>;

    private static batchDepth = 0;
    private static flushing = false;
    private static readonly pendingComputations = new Set<ComputationScope>();

    static create<T>(initial: T): SignalAccessor<T> {
        const signal: Signal<T> = {
            value: initial,
            subscribers: new Set()
        };

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
            signal.value = value;
            for (const computation of signal.subscribers) {
                if (!computation.disposed) {
                    Signal.pendingComputations.add(computation);
                }
            }
            if (Signal.batchDepth === 0 && !Signal.flushing) Signal.flush();
            return signal.value;
        };

        const accessor = ((...args: [] | [T] | [(value: T) => T]) => {
            return args.length === 0 ? get() : set(args[0] as T);
        });
        return Object.assign(accessor, { signal });
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

    public static proxy<T>(select: (path: string[]) => SignalAccessor<any>): SignalProxy<T> {
        function createProxy(path: string[]): SignalProxy<any> {
            const fn = () => { };
            return new Proxy(fn, {
                get(_target: any, prop: string | symbol): any {
                    if (typeof prop === 'symbol') return fn[prop];
                    return createProxy([...path, prop]);
                },
                apply(_target: any, _this: any, args: any[]): any {
                    return (select(path) as any)(...args);
                }
            });
        }
        return createProxy([]) as SignalProxy<T>;
    }

}
