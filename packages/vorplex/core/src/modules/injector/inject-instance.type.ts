import type { AbstractConstructor, Constructor } from '../reflection/types/constructor.type';
import type { Type } from '../reflection/types/type.type';

export type InjectInstance<T extends Record<string, () => Type>> = {
    [K in keyof T]: T[K] extends () => Constructor<infer R> ? R
    : T[K] extends () => AbstractConstructor<infer R> ? R
    : never;
};
