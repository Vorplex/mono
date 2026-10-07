import { Scope } from '../signal/scopes/scope';
import { Getter, Setter, Signal } from '../signal/signal';

export type ContextValue<T = any> = {
    readonly context: Context<T>;
    readonly value: Getter<T> | Signal<T>;
};

export interface Context<T> extends Getter<T>, Setter<T> {
    as(value: T | Getter<T> | Signal<T>): ContextValue<T>;
    use<R>(value: T | Getter<T> | Signal<T>, callback: () => R): R;
    signal(): Getter<T> | Signal<T>;
}

class ContextClass {

    private static readonly values = new WeakMap<Scope, Map<Context<any>, Getter<any> | Signal<any>>>();

    public static create<T = any>(): Context<T>;
    public static create<T>(defaultValue: T): Context<T>;
    public static create<T = any>(defaultValue?: T): Context<T> {
        const root = Signal.create<T>(defaultValue);
        const resolve = (): Getter<T> | Signal<T> => {
            for (let scope = Scope.current; scope; scope = scope.context) {
                const binding = this.values.get(scope)?.get(context);
                if (binding) return binding;
            }
            return root;
        };
        const context = Object.assign(
            (...args: [] | [T | ((current: T) => T)]) => {
                const binding = resolve();
                if (args.length === 0) return binding();
                return binding(args[0] as T);
            },
            {
                as: (value: T | Getter<T> | Signal<T>): ContextValue<T> => ({
                    context,
                    value: typeof value === 'function' ? value as Getter<T> : Signal.create(value)
                }),
                use: <R>(value: T | Getter<T> | Signal<T>, callback: () => R): R => Context.use([context.as(value)], callback),
                signal: resolve
            }
        ) as Context<T>;
        return context;
    }

    public static use<R>(contexts: readonly ContextValue[], callback: () => R): R {
        let result!: R;
        Signal.scope(() => {
            const store = new Map<Context<any>, Getter<any> | Signal<any>>();
            for (const binding of contexts) {
                store.set(binding.context, binding.value);
            }
            Context.values.set(Scope.current, store);
            result = callback();
        });
        return result;
    }

}

export const Context = ContextClass;