import { $PathSelector, $Value, Signal, SignalProxy, State } from '@vorplex/core';
import { createRoot, onCleanup } from 'solid-js';
import { useSignal } from './use-signal';

export function useStore<TState>(state: State<TState>): SignalProxy<TState> {
    const cache = new Map<string, Signal>();
    const disposes: (() => void)[] = [];
    onCleanup(() => disposes.forEach(dispose => dispose()));
    return Signal.proxy(path => {
        const key = $PathSelector.toString(path);
        if (!cache.has(key)) {
            const signal = $Value.get(state.signal.proxy, path) as Signal;
            const getter = createRoot(dispose => {
                disposes.push(dispose);
                return useSignal(signal);
            });
            const accessor = ((...args: any[]) => {
                if (args.length === 0) return getter();
                return (signal as any)(...args);
            }) as Signal;
            cache.set(key, accessor);
        }
        return cache.get(key)!;
    });
}
