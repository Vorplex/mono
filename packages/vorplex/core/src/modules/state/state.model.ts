import type { Constructor } from '../reflection/types/constructor.type';
import { $Reflection } from '../reflection/utils/reflection.util';
import { Subscribable } from '../subscribable/subscribable.model';
import type { Subscription } from '../subscribable/subscription.interface';
import { $Value } from '../value/value.util';
import { ArrayAdaptor } from './adaptors/array/array-adaptor.util';
import { EntityAdaptor } from './adaptors/entity/entity-adaptor.util';
import type { EntityMap } from './adaptors/entity/entity-map.type';
import type { IEntity } from './adaptors/entity/entity.interface';
import type { Update } from './update.type';

export interface StateChange<T> {
    previousValue: T;
    value: T;
}

export type StateEffect<T> = (value: T) => T;

export class State<T = any, TReducer extends Constructor = Constructor> extends Subscribable<StateChange<T>> {
    private _value: T;

    public get value() {
        return this._value;
    }

    constructor(state?: T, private reducer?: TReducer) {
        super();
        this._value = state;
    }

    public static combineLatest<T extends any[]>(states: { [K in keyof T]: State<T[K]> }, callback: (values: T) => void): Subscription {
        const empty = Symbol();
        const values = new State(states.map(() => empty));
        const subscriptions: Subscription[] = [
            values.subscribe((values) => {
                if (values.value.every((i) => i !== empty)) {
                    callback(values.value as T);
                }
            }),
        ];
        for (const [index, state] of states.entries()) {
            const subscription = state.subscribe((state) => {
                values.update((values) => {
                    values[index] = state.value;
                    return values;
                });
            });
            subscriptions.push(subscription);
        }
        return {
            unsubscribe: () => {
                for (const subscription of subscriptions) {
                    subscription.unsubscribe();
                }
            },
        };
    }

    public reduce(
        update: (
            reducer: {
                update: {
                    <V>(path: (state: T) => V, update: (value: V) => Partial<V>): Update<T>;
                    <V>(path: (state: T) => V, value: Partial<V>): Update<T>;
                };
            } & {
                [K in keyof T]: T[K] extends EntityMap<IEntity>
                ? {
                    entity: EntityAdaptor<T, T[K] extends EntityMap<infer U> ? U : never, K & any>;
                } & (K extends keyof InstanceType<TReducer> ? InstanceType<TReducer>[K & keyof InstanceType<TReducer>] : {})
                : T[K] extends any[]
                ? {
                    array: ArrayAdaptor<T, T[K] extends (infer U)[] ? U : never, K & any>;
                } & (K extends keyof InstanceType<TReducer> ? InstanceType<TReducer>[K & keyof InstanceType<TReducer>] : {})
                : {
                    value: {
                        set: (value: T[K]) => Update<T> & (K extends keyof InstanceType<TReducer> ? InstanceType<TReducer>[K & keyof InstanceType<TReducer>] : {});
                    } & (K extends keyof InstanceType<TReducer> ? InstanceType<TReducer>[K & keyof InstanceType<TReducer>] : {});
                };
            },
        ) => Update<T>[],
    ) {
        const reducer = new Proxy({
            update: <V>(path: (state: T) => V, update: Partial<V> | ((state: NoInfer<V>) => NoInfer<V>)): Update<T> => {
                return (state: T) => $Value.update<any, V>(state, path, update);
            },
        } as any, {
            get: (target, property) => {
                if (property === 'update') return target.update;
                const reducer = {
                    entity: new EntityAdaptor<any, any, any>(property),
                    array: new ArrayAdaptor<any, any, any>(property),
                    value: {
                        set: (value: any) => ({
                            [property]: value,
                        }),
                    },
                };
                Object.assign(reducer, (this.reducer && new this.reducer()[property]) || {});
                return reducer;
            },
        });
        this.update(...update(reducer));
    }

    public override subscribe(emit: (event: StateChange<T>, subscription: Subscription) => void): Subscription {
        const subscription = super.subscribe(emit);
        const event = {
            previousValue: this.value,
            value: this.value,
        };
        emit(event, subscription);
        return subscription;
    }

    public static update<TState>(state: TState, ...updates: Update<TState>[]): TState {
        for (const update of updates) {
            if ($Reflection.isFunction(update)) {
                state = State.update(state, update(state));
            } else if ($Reflection.isObject(update)) {
                const prototype = Object.getPrototypeOf(state ?? update);
                state = Object.assign({}, state, update);
                Object.setPrototypeOf(state, prototype);
            } else {
                state = update;
            }
        }
        return state;
    }

    public update(...updates: Update<T>[]): void {
        this.set(State.update(this.value, ...updates));
    }

    public set(value: T) {
        const previousValue = this.value;
        this._value = value;
        this.emit({
            previousValue,
            value: this.value
        });
    }

    public asReadOnly(): Subscribable<StateChange<T>> & { readonly value: T } {
        return this;
    }

    public sync(config: State<T>): Subscription {
        let localValue: T;
        let refValue: T;
        const targetSubscription = config.subscribe(state => {
            if (state.value !== localValue) {
                refValue = state.value;
                this.set(state.value);
            }
        });
        const localSubscription = this.subscribe(state => {
            if (state.value !== refValue) {
                localValue = state.value;
                config.set(state.value);
            }
        });
        return {
            unsubscribe: () => {
                targetSubscription.unsubscribe();
                localSubscription.unsubscribe();
            }
        };
    }
}
