import { createSignal, Setter, Signal } from 'solid-js';

const SignalCache = new Map<any, any>();

export function useCachedSignal<T>(key: any, value?: T): Signal<T> {
    const [get, set] = createSignal(SignalCache.get(key) ?? value);
    return [
        get,
        ((update: T | ((value: T) => T)) => {
            const value = typeof update === 'function' ? (update as (value: T) => T)(get()) : update;
            SignalCache.set(key, value);
            return set(value as Exclude<T, Function>);
        }) as Setter<T>
    ];
}
