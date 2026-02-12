import type { Constructor } from './constructor.type';

export type Type<T = any> = Constructor<T> | Function;
