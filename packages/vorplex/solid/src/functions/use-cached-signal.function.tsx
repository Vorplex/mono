import { createSignal, Signal, Setter } from 'solid-js';

const SignalCache: Record<string, any> = {};

export function useCachedSignal<T>(cacheKey: string, value?: T): Signal<T> {
    const [get, set] = createSignal(SignalCache[cacheKey] ?? value);
    return [
        get,
        ((value: Exclude<T, Function>) => {
            SignalCache[cacheKey] = value;
            set(value);
        }) as Setter<T>
    ];
}
