export type RecursiveValue<T, TValue> = {
    [K in keyof T]?: T[K] extends object ? RecursiveValue<T[K], TValue> | TValue : TValue;
};
