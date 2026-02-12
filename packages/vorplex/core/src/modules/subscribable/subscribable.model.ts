import { $Array } from '../array/array.util';
import type { Subscription } from './subscription.interface';

export class Subscribable<T> {
    private listeners: ((event: T) => void)[] = [];

    protected emit(event: T) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    public until(predicate: (value: T) => boolean): Promise<T> {
        return new Promise<T>((resolve) => {
            this.subscribe((event, subscription) => {
                if (predicate(event)) {
                    subscription.unsubscribe();
                    resolve(event);
                }
            });
        });
    }

    public subscribe(emit: (event: T, subscription: Subscription) => void): Subscription {
        const listener: (event: T) => void = event => emit(event, subscription);
        const subscription: Subscription = {
            unsubscribe: () => {
                this.listeners = $Array.remove(this.listeners, listener);
            }
        };
        this.listeners.push(listener);
        return subscription;
    }
}

export class Emitter<T> extends Subscribable<T> {
    public override emit(event: T): void {
        super.emit(event);
    }
}
