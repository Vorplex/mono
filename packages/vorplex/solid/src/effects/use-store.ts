import { $PathSelector, $Value, EmptyReducer, Reducer, Signal, SignalProxy, State } from '@vorplex/core';
import { Accessor, createMemo, createRoot, createSignal, getOwner, onCleanup } from 'solid-js';

interface PathEntry {
    memo: Accessor<any>;
    dispose: () => void;
    refCount: number;
}

export function useStore<TState extends object, TReducer extends Reducer = EmptyReducer>(state: State<TState, TReducer>): SignalProxy<TState> {
    const [root, setRoot] = createSignal(state.value);
    const subscription = state.subscribe(({ value }) => setRoot(() => value));
    onCleanup(() => subscription.unsubscribe());
    const memos = new Map<string, PathEntry>();
    return Signal.proxy(path => (((...args: any[]) => {
        if (args.length === 0) {
            if (path.length === 0) return root();
            const key = $PathSelector.toString(path);
            let entry = memos.get(key);
            if (!entry) {
                entry = createRoot(dispose => ({
                    memo: createMemo(() => $Value.get(root(), path)),
                    dispose,
                    refCount: 0
                }));
                memos.set(key, entry);
            }
            const owner = getOwner();
            if (owner) {
                entry.refCount++;
                onCleanup(() => {
                    entry.refCount--;
                    if (entry.refCount <= 0) {
                        memos.delete(key);
                        entry.dispose();
                    }
                });
            }
            return entry.memo();
        }
        state.set(path as any, args[0]);
        return args[0];
    }) as Signal));
}
