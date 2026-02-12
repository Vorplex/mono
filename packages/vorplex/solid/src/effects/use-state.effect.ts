import { $Value, State } from '@vorplex/core';
import { type Accessor, createMemo, createSignal, onCleanup } from 'solid-js';

export function useState<TState, TValue = TState>(state: State<TState>, select?: (state: TState) => TValue): Accessor<TValue>;
export function useState<T extends any[], TValue>(state: { [K in keyof T]: State<T[K]> }, select?: (state: T) => TValue): Accessor<TValue>;
export function useState<TState extends any[], TValue>(state: State<TState> | { [K in keyof TState]: State<TState[K]> }, select?: (state: TState) => TValue): Accessor<TValue> {
    const [get, set] = createSignal<TValue>();
    createMemo(() => {
        let current: any = null;
        const subscription = State.combineLatest(Array.isArray(state) ? (state as State[]) : [state], (action) => {
            try {
                let value = Array.isArray(state) ? action : action[0];
                if (select) value = select(value);
                if (!$Value.equals(current, value)) {
                    current = value;
                    set(value);
                }
            } catch (error) {
                set(error instanceof Error ? error : (new Error(error) as any));
            }
        });
        onCleanup(() => subscription.unsubscribe());
    });
    return () => {
        const value = get();
        if (value instanceof Error) throw value;
        return value;
    };
}
