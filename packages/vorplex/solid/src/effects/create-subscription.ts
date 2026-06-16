import { Subscribable, Subscription } from '@vorplex/core';
import { onCleanup, onMount } from 'solid-js';

export function createSubscription<T>(subscribable: Subscribable<T>, callback: (event: T) => void) {
    let subscription: Subscription;
    onMount(() => subscription = subscribable.subscribe(event => callback(event)));
    onCleanup(() => subscription?.unsubscribe());
}
