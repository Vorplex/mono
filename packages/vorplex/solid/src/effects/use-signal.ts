import { Signal } from '@vorplex/core';
import { from } from 'solid-js';

export function useSignal<T>(signal: Signal<T>) {
    return from<T>((set) => {
        const root = Signal.root(() => {
            Signal.effect(() => {
                const value = signal();
                set(() => value);
            });
        });
        return () => root.dispose();
    }, signal());
}
