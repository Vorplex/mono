import { SelectorPath } from '../path-selector/path-selector.util';
import { ValueSet } from '../value/value.util';
import { ArrayAdaptor } from './adaptors/array/array-adaptor.util';
import { EntityAdaptor } from './adaptors/entity/entity-adaptor.util';
import { EntityMap } from './adaptors/entity/entity-map.type';
import { IEntity } from './adaptors/entity/entity.interface';
import { Update } from './update.type';

type EntityItem<V> = V extends EntityMap<infer U> ? U : never;
type ArrayItem<V> = V extends (infer U)[] ? U : never;

type FieldOf<TClass, K> = K extends keyof TClass ? TClass[K] : {};

type ReducerFieldAdaptor<TState, TReducer extends Reducer, K extends keyof TState> =
    TState[K] extends EntityMap<IEntity>
    ? { entity: EntityAdaptor<TState, EntityItem<TState[K]>, K & any> } & FieldOf<TReducer, K>
    : TState[K] extends any[]
    ? { array: ArrayAdaptor<TState, ArrayItem<TState[K]>, K & any> } & FieldOf<TReducer, K>
    : { value: { set: (value: TState[K]) => Update<TState> } } & FieldOf<TReducer, K>;

type StateFields<TState, TReducer extends Reducer> = {
    [K in keyof TState]: ReducerFieldAdaptor<TState, TReducer, K>;
};

export const ReducerOperation = Symbol();

export type ReducerOperation<T> = {
    [ReducerOperation]: (state: T) => T;
};

export function isReducerOperation(change: unknown): change is ReducerOperation<any> {
    return change != null && typeof change === 'object' && typeof change[ReducerOperation] === 'function';
}

export type ReducerFields<TState> = {
    set: <TValue>(path: SelectorPath<TState, TValue>, update: ValueSet<TValue>) => ReducerOperation<TState>;
    update: <V>(path: SelectorPath<TState, V>, update: Update<V>) => ReducerOperation<TState>;
};

export type EmptyReducer = Record<never, never>;
export type Reducer = Record<string, any>;
export type StateReducer<TState, TReducer extends Reducer> = ReducerFields<TState> & StateFields<TState, TReducer>;
