import { $PathSelector, SelectorPath } from '../path-selector/path-selector.util';
import { Signal, SignalAccessor, SignalProxy } from '../signal/signal';
import { Subscribable } from '../subscribable/subscribable.model';
import type { Subscription } from '../subscribable/subscription.interface';
import { $Value, ValueSet } from '../value/value.util';
import { ArrayAdaptor } from './adaptors/array/array-adaptor.util';
import { EntityAdaptor } from './adaptors/entity/entity-adaptor.util';
import { EmptyReducer, Reducer, ReducerFields, ReducerOperation, StateReducer } from './reducer.type';
import type { Update } from './update.type';

export interface StateChange<T> {
    previousValue: T;
    value: T;
}

type StateSelection<T> = {
    path: string[];
    signal: SignalAccessor<T>;
    proxy: SignalAccessor<T>;
};

export class State<T = any, TReducer extends Reducer = EmptyReducer> extends Subscribable<StateChange<T>> {

    private readonly selections = new Map<string, StateSelection<any>>();
    private _store?: SignalProxy<T>;

    public get value() { return this._value; };
    public get store(): SignalProxy<T> { return this._store ??= Signal.proxy(path => this.select(path)); }

    constructor(private _value?: T, private reducer?: TReducer) {
        super();
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
                values.set(values => values[index], state.value);
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

    public asReadOnly(): Subscribable<StateChange<T>> & { readonly value: T } {
        return this;
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

    public reduce(update: (reducer: StateReducer<T, TReducer>) => (Update<T> | ReducerOperation<T>)[]): void {
        const reducerFields: ReducerFields<T> = {
            update: (path, update) => ReducerOperation.create(state => $Value.update(state, path, update)),
            set: (path, update) => ReducerOperation.create(state => $Value.set(state, path, update))
        };
        const reducer = new Proxy(reducerFields, {
            get: (target, property) => {
                if (property === 'update') return target.update;
                if (property === 'set') return target.set;
                const reducer = {
                    entity: new EntityAdaptor<any, any, any>(property),
                    array: new ArrayAdaptor<any, any, any>(property),
                    value: {
                        set: (value: any) => ({
                            [property]: value,
                        }),
                    },
                };
                Object.assign(reducer, this.reducer?.[property as string] ?? {});
                return reducer;
            },
        });
        let value = this.value;
        for (const change of update(reducer as StateReducer<T, TReducer>)) {
            value = ReducerOperation.is(change) ? ReducerOperation.invoke(change, value) : $Value.update(value, change);
        }
        this.commit(value);
    }

    public update(update: Update<T>): void;
    public update<V>(path: SelectorPath<T, V>, update: Update<V>): void;
    public update<V>(...args: any[]): void {
        const update: Update<T> | Update<V> = args.length === 1 ? args[0] : args[1];
        const path: SelectorPath<T, V> = args.length === 2 ? args[0] : null;
        if (args.length === 1) this.commit($Value.update(this.value, update as Update<T>));
        else this.commit($Value.update(this.value, path, update as Update<V>));
    }

    public set(update: ValueSet<T>): void;
    public set<V>(path: SelectorPath<T, V>, update: ValueSet<V>): void;
    public set<V>(...args: any[]): void {
        const update: ValueSet<T> | ValueSet<V> = args.length === 1 ? args[0] : args[1];
        const path: SelectorPath<T, V> = args.length === 2 ? args[0] : null;
        if (args.length === 1) this.commit($Value.set(this.value, update as ValueSet<T>));
        else this.commit($Value.set(this.value, path, update as ValueSet<V>));
    }

    public select<V = any>(path?: SelectorPath<T, V>): SignalAccessor<V> {
        const segments = $PathSelector.parse<T>(path);
        const key = $PathSelector.toString(segments);
        const existing = this.selections.get(key);
        if (existing) return existing.proxy;
        const value = $Value.get(this.value, key);
        const signal = Signal.create(value);
        const selection: StateSelection<any> = {
            path: segments,
            signal,
            proxy: new Proxy(signal, {
                apply: (_target, _thisArg, args) => {
                    if (args.length === 0) return signal();
                    this.commit($Value.set(this.value, selection.path, args[0]));
                    return selection.signal.signal.value;
                }
            })
        };
        this.selections.set(key, selection);
        return selection.proxy;
    }

    private commit(value: T): void {
        if (this.value === value) return;
        const event = {
            previousValue: this.value,
            value: value,
        };
        this._value = value;
        Signal.batch(() => {
            for (const [key, selection] of this.selections) {
                if (selection.signal.signal.subscribers.size === 0) {
                    this.selections.delete(key);
                    continue;
                }
                const value = $Value.get(this.value, selection.path);
                selection.signal(value);
            }
        });
        this.emit(event);
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
