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

export type ReducerFields<TState> = {
    update: {
        <V>(path: (state: TState) => V, fn: (value: V) => Partial<V>): Update<TState>;
        <V>(path: (state: TState) => V, value: Partial<V>): Update<TState>;
    }
};

export type EmptyReducer = Record<never, never>;
export type Reducer = Record<string, any>;
export type StateReducer<TState, TReducer extends Reducer> = ReducerFields<TState> & StateFields<TState, TReducer>;