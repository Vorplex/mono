export type UpdateFunc<T> = (state: T) => Partial<T>;
export type Update<T> = Partial<T> | UpdateFunc<T>;
