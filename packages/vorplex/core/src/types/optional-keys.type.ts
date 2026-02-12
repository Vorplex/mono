/**
 * Represents a union type of all keys defined on `T` that are optional.
 */
export type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never; }[keyof T];
