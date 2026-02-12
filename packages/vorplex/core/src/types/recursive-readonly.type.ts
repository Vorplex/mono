export type RecursiveReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? RecursiveReadonly<T[K]> : T[K];
};
