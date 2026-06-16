import { Subscribable, Subscription } from '@vorplex/core';
import { createSignal, onCleanup, onMount } from 'solid-js';

export function useSubscription<T>(subscribable: Subscribable<T>, defaultValue?: T) {
    const [value, setValue] = createSignal<T>(defaultValue, { equals: false });
    let subscription: Subscription;
    onMount(() => subscription = subscribable.subscribe(event => setValue(() => event)));
    onCleanup(() => subscription?.unsubscribe());
    return value;
}
