import { $Value, Signal, SignalProxy, State } from '@vorplex/core';
import { createSignal, onCleanup } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';

export function useStore<TState extends object>(state: State<TState>): SignalProxy<TState> {
    const [store, setStore] = createStore(state.value);
    const [root, setRoot] = createSignal(state.value);
    const subscription = state.subscribe(({ value }) => {
        setStore(reconcile(value));
        setRoot(() => value);
    });
    onCleanup(() => subscription.unsubscribe());
    return Signal.proxy(path => (((...args: any[]) => {
        if (args.length === 0) return path.length === 0 ? root() : $Value.get(store, path);
        state.set(path as any, args[0]);
        return args[0];
    }) as Signal));
}
