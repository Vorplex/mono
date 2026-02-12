import { AbstractConstructor, Constructor } from './constructor.type';
import { Type } from './type.type';

export type Instance<T> =
    T extends Constructor<infer R> ? R
    : T extends AbstractConstructor<infer R> ? R
    : T extends Record<string, Type<any>> ? { [K in keyof T]: Instance<T[K]> }
    : T extends any[] ? { [K in keyof T]: Instance<T[K]> }
    : never;
