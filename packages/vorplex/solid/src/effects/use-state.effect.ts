import { $Value, Signal, State } from '@vorplex/core';
import { type Accessor, createMemo, createSignal, onCleanup } from 'solid-js';

export function useState<TState, TValue = TState>(state: State<TState, any>, select?: (state: TState) => TValue): Accessor<TValue>;
export function useState<T extends any[], TValue>(state: { [K in keyof T]: State<T[K], any> }, select?: (state: T) => TValue): Accessor<TValue>;
export function useState<TState extends any[], TValue = TState>(state: State<TState, any> | { [K in keyof TState]: State<TState[K], any> }, select?: (state: TState) => TValue): Accessor<TValue> {
    const states = Array.isArray(state) ? state : [state];
    const signals = states.map(state => {
        const [get, set] = createSignal<any>(state.value);
        const accessor = state.select();
        const scope = Signal.root(() => Signal.effect(() => set(accessor())));
        onCleanup(() => scope.dispose());
        return get;
    });
    const selected = createMemo<TValue>(
        () => {
            const values = signals.map(signal => signal());
            const arg = Array.isArray(state) ? values : values[0];
            try {
                return select ? select(arg) : arg;
            } catch (error) {
                return error instanceof Error ? error : new Error(String(error));
            }
        },
        undefined as TValue,
        { equals: (a, b) => $Value.equals(a, b) }
    );
    return () => {
        const value = selected();
        if (value instanceof Error) throw value;
        return value;
    };
}
