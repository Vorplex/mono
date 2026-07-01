import { IsUnion } from '../../types/is-union.type';
import type { TsonDefinition } from './schema';
import type { TsonArrayDefinition } from './schemas/array';
import type { TsonBooleanDefinition } from './schemas/boolean';
import type { TsonEnumDefinition } from './schemas/enum';
import type { TsonNumberDefinition } from './schemas/number';
import type { TsonObjectDefinition } from './schemas/object';
import type { TsonRecordDefinition } from './schemas/record';
import type { TsonStringDefinition } from './schemas/string';
import type { TsonUnionDefinition } from './schemas/union';

export type TsonTupleType<T extends readonly TsonDefinition[], Result = never>
    = T extends readonly [infer Head, ...infer Tail]
    ? (
        Tail extends readonly TsonDefinition[] ? TsonTupleType<Tail, Result | (Head extends TsonDefinition ? TsonType<Head> : never)>
        : never
    )
    : Result;
type OptionalKeys<T> = { [K in keyof T]: T[K] extends { default: { value: any } } ? K : never }[keyof T];
type RequiredKeys<T> = { [K in keyof T]: T[K] extends { default: { value: any } } ? never : K }[keyof T];
type TsonObjectType<T extends Record<string, TsonDefinition>> = [OptionalKeys<T>] extends [never]
    ? { [P in keyof T]: TsonType<T[P]> }
    : { [P in RequiredKeys<T>]: TsonType<T[P]> } & { [P in OptionalKeys<T>]?: TsonType<T[P]> };

export type TsonType<T extends TsonDefinition | readonly TsonDefinition[]>
    = T extends { type: 'any' } ? any
    : T extends { type: 'ref' } ? any
    : T extends { type: 'string' } ? string
    : T extends { type: 'number' } ? number
    : T extends { type: 'boolean' } ? boolean
    : T extends { type: 'enum', flags: (infer Flags)[] } ? Flags
    : T extends { type: 'array', readonly: true, itemDefinition: infer Item extends TsonDefinition } ? readonly TsonType<Item>[]
    : T extends { type: 'array', itemDefinition: infer Item extends TsonDefinition } ? TsonType<Item>[]
    : T extends { type: 'array' } ? any[]
    : T extends { type: "object"; properties: infer P extends Record<string, TsonDefinition> } ? TsonObjectType<P>
    : T extends { type: 'object' } ? Record<string, any>
    : T extends { type: 'record', property: infer P extends TsonDefinition } ? Record<string, TsonType<P>>
    : T extends { type: 'record' } ? Record<string, any>
    : T extends { type: 'union', union: infer Union extends readonly TsonDefinition[] } ? TsonTupleType<Union>
    : T extends readonly TsonDefinition[] ? TsonTupleType<T>
    : never;

export type TypeTson<T>
    = unknown extends T ? TsonDefinition
    : [T] extends [string] ? TsonStringDefinition | TsonEnumDefinition<T>
    : [T] extends [number] ? TsonNumberDefinition | TsonEnumDefinition<T>
    : [T] extends [boolean] ? TsonBooleanDefinition
    : [T] extends [(infer Item)[]] ? TsonArrayDefinition<Item>
    : [T] extends [object] ? (string extends keyof T ? TsonRecordDefinition<T[keyof T]> : TsonObjectDefinition<T>)
    : IsUnion<T> extends true ? (
        T extends readonly any[] ? TsonUnionDefinition<T>
        : never
    )
    : never;
